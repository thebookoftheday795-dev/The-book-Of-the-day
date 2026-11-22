import crypto from 'node:crypto';
import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocket, WebSocketServer } from 'ws';
import { fetchFromSources, INITIAL_FEED_SOURCES } from './server/feeds.ts';
import type {
  FeedSourceConfig,
  FeedStats,
  IndiaRegion,
  IndianLanguageCode,
  NewsArticle,
  NewsCategory,
  NewsSectionSlug,
} from './src/types/news.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const POLL_INTERVAL_MS = 45_000;

let feedSources: FeedSourceConfig[] = INITIAL_FEED_SOURCES.map((s) => ({ ...s }));
let cachedArticles: NewsArticle[] = [];
let lastSyncedAt: string | null = null;
let activeSyncPromise: Promise<{
  total: number;
  newlyDiscovered: NewsArticle[];
}> | null = null;
const knownArticleIds = new Set<string>();

const app = express();
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

function broadcastEvent(type: string, payload: unknown) {
  const message = JSON.stringify({ type, payload, timestamp: new Date().toISOString() });
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

async function syncFeeds(broadcastNew = true): Promise<{
  total: number;
  newlyDiscovered: NewsArticle[];
}> {
  if (activeSyncPromise) {
    return activeSyncPromise;
  }

  activeSyncPromise = (async () => {
    try {
      const { articles: fresh, updatedSources } = await fetchFromSources(feedSources);
      feedSources = updatedSources;

      const newlyDiscovered: NewsArticle[] = [];

      if (knownArticleIds.size > 0) {
        for (const article of fresh) {
          if (!knownArticleIds.has(article.id)) {
            newlyDiscovered.push({ ...article, isBreaking: true });
          }
        }
      }

      for (const article of fresh) {
        knownArticleIds.add(article.id);
      }

      if (fresh.length > 0 || feedSources.every((s) => !s.enabled)) {
        cachedArticles = fresh;
        lastSyncedAt = new Date().toISOString();
      }

      if (broadcastNew && newlyDiscovered.length > 0) {
        for (const article of newlyDiscovered.slice(0, 3)) {
          broadcastEvent('news:push', {
            article,
            reason: `Breaking via ${article.newspaper}`,
          });
        }
        broadcastEvent('news:sync', {
          total: cachedArticles.length,
          lastSyncedAt,
        });
      }

      return { total: cachedArticles.length, newlyDiscovered };
    } finally {
      activeSyncPromise = null;
    }
  })();

  return activeSyncPromise;
}

function buildStats(articles: NewsArticle[]): FeedStats {
  const byCategory: Record<NewsSectionSlug, number> = {
    national: 0,
    state: 0,
    politics: 0,
    business: 0,
    economy: 0,
    technology: 0,
    sports: 0,
    education: 0,
    entertainment: 0,
    health: 0,
    world: 0,
  };

  const byRegion: Record<IndiaRegion, number> = {
    all: articles.length,
    north: 0,
    south: 0,
    west: 0,
    east: 0,
    central: 0,
    northeast: 0,
  };

  const byLanguage: Record<Exclude<IndianLanguageCode, 'all'>, number> = {
    en: 0,
    hi: 0,
    ta: 0,
    te: 0,
    ml: 0,
    kn: 0,
    mr: 0,
    bn: 0,
    gu: 0,
    pa: 0,
  };

  for (const article of articles) {
    byCategory[article.category] = (byCategory[article.category] || 0) + 1;
    if (article.region !== 'all') {
      byRegion[article.region] = (byRegion[article.region] || 0) + 1;
    }
    byLanguage[article.language] = (byLanguage[article.language] || 0) + 1;
  }

  return {
    totalArticles: articles.length,
    lastSyncedAt,
    activeSourcesCount: feedSources.filter((s) => s.enabled && s.lastStatus === 'ok').length,
    totalSourcesCount: feedSources.length,
    byCategory,
    byRegion,
    byLanguage,
  };
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    articlesLoaded: cachedArticles.length,
    lastSyncedAt,
    wsClients: wss.clients.size,
  });
});

// News query endpoint (strictly headlines, thumbnails, source, time, excerpt, canonical link)
app.get('/api/news', async (req, res) => {
  if (cachedArticles.length === 0 && feedSources.some((s) => s.enabled)) {
    await syncFeeds(false);
  }

  const category = String(req.query.category || 'all') as NewsCategory;
  const region = String(req.query.region || 'all') as IndiaRegion;
  const language = String(req.query.language || 'all') as IndianLanguageCode;
  const state = String(req.query.state || 'all');
  const newspaper = String(req.query.newspaper || 'all');
  const q = String(req.query.q || '').trim().toLowerCase();

  const filtered = cachedArticles.filter((article) => {
    if (category !== 'all' && category !== 'for-you' && article.category !== category) {
      return false;
    }
    if (region !== 'all' && article.region !== region) return false;
    if (language !== 'all' && article.language !== language) return false;
    if (newspaper !== 'all' && article.newspaper !== newspaper) return false;
    if (
      state !== 'all' &&
      !article.stateLabel.toLowerCase().includes(state.toLowerCase()) &&
      !article.title.toLowerCase().includes(state.toLowerCase())
    ) {
      return false;
    }
    if (
      q &&
      !article.title.toLowerCase().includes(q) &&
      !article.excerpt.toLowerCase().includes(q) &&
      !article.newspaper.toLowerCase().includes(q) &&
      !article.stateLabel.toLowerCase().includes(q)
    ) {
      return false;
    }
    return true;
  });

  res.json({
    articles: filtered,
    stats: buildStats(cachedArticles),
  });
});

app.post('/api/news/refresh', async (_req, res) => {
  const { total, newlyDiscovered } = await syncFeeds(true);
  res.json({
    total,
    newlyDiscoveredCount: newlyDiscovered.length,
    lastSyncedAt,
    articles: cachedArticles,
    stats: buildStats(cachedArticles),
  });
});

// Admin Sources Management API
app.get('/api/admin/sources', (_req, res) => {
  res.json({
    sources: feedSources,
    stats: buildStats(cachedArticles),
    wsClients: wss.clients.size,
  });
});

app.patch('/api/admin/sources/:id', async (req, res) => {
  const { id } = req.params;
  const idx = feedSources.findIndex((s) => s.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Feed source not found' });
    return;
  }

  if (typeof req.body?.enabled === 'boolean') {
    feedSources[idx].enabled = req.body.enabled;
  }

  await syncFeeds(false);
  res.json({
    source: feedSources[idx],
    sources: feedSources,
    stats: buildStats(cachedArticles),
  });
});

app.post('/api/admin/sources', async (req, res) => {
  const newspaper = String(req.body?.newspaper || '').trim();
  const url = String(req.body?.url || '').trim();
  const category = (req.body?.category || 'national') as NewsSectionSlug;
  const region = (req.body?.region || 'all') as IndiaRegion;
  const stateLabel = String(req.body?.stateLabel || 'All India').trim();
  const language = (req.body?.language || 'en') as Exclude<IndianLanguageCode, 'all'>;
  const licenseNote = String(
    req.body?.licenseNote || 'Admin-verified Public RSS Feed'
  ).trim();

  if (!newspaper || !url.startsWith('http')) {
    res.status(400).json({ error: 'Valid publisher name and RSS URL are required.' });
    return;
  }

  const newSource: FeedSourceConfig = {
    id: `custom-${crypto.randomBytes(4).toString('hex')}`,
    sourceId: newspaper.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    newspaper,
    url,
    category,
    region,
    stateLabel,
    language,
    enabled: true,
    licenseNote,
    lastFetchedAt: null,
    lastStatus: 'pending',
    articleCount: 0,
  };

  feedSources.unshift(newSource);
  await syncFeeds(false);

  res.status(201).json({
    source: feedSources[0],
    sources: feedSources,
    stats: buildStats(cachedArticles),
  });
});

app.delete('/api/admin/sources/:id', async (req, res) => {
  const { id } = req.params;
  const before = feedSources.length;
  feedSources = feedSources.filter((s) => s.id !== id);
  if (feedSources.length === before) {
    res.status(404).json({ error: 'Source not found' });
    return;
  }
  await syncFeeds(false);
  res.json({ sources: feedSources, stats: buildStats(cachedArticles) });
});

// Admin & Real-time Breaking Notification Dispatch
app.post('/api/admin/notifications/broadcast', async (req, res) => {
  if (cachedArticles.length === 0) {
    await syncFeeds(false);
  }

  const customHeadline = String(req.body?.headline || '').trim();
  const customReason = String(req.body?.reason || '').trim();
  const articleId = String(req.body?.articleId || '').trim();
  const category = String(req.body?.category || 'all');
  const region = String(req.body?.region || 'all');

  let target = articleId
    ? cachedArticles.find((a) => a.id === articleId)
    : undefined;

  if (!target) {
    const pool = cachedArticles.filter((a) => {
      if (category !== 'all' && category !== 'for-you' && a.category !== category) {
        return false;
      }
      if (region !== 'all' && a.region !== region) return false;
      return true;
    });
    target = pool[Math.floor(Math.random() * Math.min(pool.length, 6))] || cachedArticles[0];
  }

  if (!target) {
    res.status(503).json({ error: 'No live wire articles available yet.' });
    return;
  }

  const broadcastArticle: NewsArticle = customHeadline
    ? {
        ...target,
        id: `alert-${Date.now().toString(36)}-${target.id}`,
        title: customHeadline,
        isBreaking: true,
      }
    : { ...target, isBreaking: true };

  const alertPayload = {
    article: broadcastArticle,
    reason:
      customReason ||
      `Breaking Desk · ${broadcastArticle.newspaper} (${broadcastArticle.stateLabel})`,
  };

  broadcastEvent('news:push', alertPayload);
  res.json({ dispatched: true, wsClients: wss.clients.size, ...alertPayload });
});

wss.on('connection', (socket) => {
  socket.send(
    JSON.stringify({
      type: 'connection:ready',
      payload: {
        connectedClients: wss.clients.size,
        lastSyncedAt,
        totalArticles: cachedArticles.length,
      },
      timestamp: new Date().toISOString(),
    })
  );
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Bharat Chronicle server listening on http://0.0.0.0:${PORT}`);
    void syncFeeds(false);
    setInterval(() => {
      void syncFeeds(true);
    }, POLL_INTERVAL_MS);
  });
}

void startServer();

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bookmark,
  ExternalLink,
  Globe,
  Moon,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sun,
  X,
} from 'lucide-react';
import { AdminDashboardDrawer } from './components/AdminDashboardDrawer';
import { EditorialImage } from './components/EditorialImage';
import { PersonalizeDrawer } from './components/PersonalizeDrawer';
import { PushNotificationsDrawer } from './components/PushNotificationsDrawer';
import {
  RecentlyReadStrip,
  type RecentlyReadEntry,
} from './components/RecentlyReadStrip';
import {
  CATEGORY_ITEMS,
  INDIAN_LANGUAGES,
  INDIA_REGIONS,
  type FeedStats,
  type IndiaRegion,
  type IndianLanguageCode,
  type NewsArticle,
  type NewsCategory,
  type PushAlert,
  type UserPreferences,
} from './types/news';

const STORAGE_RECENT_KEY = 'bharat_chronicle_recently_read_v1';
const STORAGE_BOOKMARKS_KEY = 'bharat_chronicle_bookmarks_v1';
const STORAGE_PREFS_KEY = 'bharat_chronicle_preferences_v1';
const STORAGE_THEME_KEY = 'bharat_chronicle_theme_v1';

const DEFAULT_PREFERENCES: UserPreferences = {
  favoriteCategories: ['national', 'economy', 'technology', 'sports'],
  favoriteRegions: ['north', 'south', 'west'],
  favoriteStates: [],
  preferredLanguages: ['en'],
  notificationsEnabled: true,
  browserPushEnabled: false,
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.round(diffMs / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

function getLanguageLabel(code: string): string {
  return INDIAN_LANGUAGES.find((l) => l.code === code)?.nativeLabel || code.toUpperCase();
}

export default function App() {
  // Theme (Light / Dark mode)
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_THEME_KEY);
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem(STORAGE_THEME_KEY, 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem(STORAGE_THEME_KEY, 'light');
    }
  }, [isDark]);

  // Core navigation & filter state
  const [activeCategory, setActiveCategory] = useState<NewsCategory>('all');
  const [activeRegion, setActiveRegion] = useState<IndiaRegion>('all');
  const [activeState, setActiveState] = useState<string>('all');
  const [activeLanguage, setActiveLanguage] = useState<IndianLanguageCode>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'wire' | 'bookmarks'>('wire');

  // Data state
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [stats, setStats] = useState<FeedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // LocalStorage state: Recently Read, Bookmarks, Personalization
  const [recentlyRead, setRecentlyRead] = useState<RecentlyReadEntry[]>(() =>
    readStorage<RecentlyReadEntry[]>(STORAGE_RECENT_KEY, [])
  );
  const [bookmarks, setBookmarks] = useState<NewsArticle[]>(() =>
    readStorage<NewsArticle[]>(STORAGE_BOOKMARKS_KEY, [])
  );
  const [preferences, setPreferences] = useState<UserPreferences>(() =>
    readStorage<UserPreferences>(STORAGE_PREFS_KEY, DEFAULT_PREFERENCES)
  );

  // Drawers & real-time alerts
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [personalizeOpen, setPersonalizeOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  const [alerts, setAlerts] = useState<PushAlert[]>([]);
  const [liveToast, setLiveToast] = useState<PushAlert | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [browserPermission, setBrowserPermission] = useState<
    NotificationPermission | 'unsupported'
  >(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  });

  const toastTimerRef = useRef<number | null>(null);

  // Persist localStorage collections
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_RECENT_KEY, JSON.stringify(recentlyRead));
    } catch {
      // ignore storage quota errors
    }
  }, [recentlyRead]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_BOOKMARKS_KEY, JSON.stringify(bookmarks));
    } catch {
      // ignore
    }
  }, [bookmarks]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PREFS_KEY, JSON.stringify(preferences));
    } catch {
      // ignore
    }
  }, [preferences]);

  const fetchNews = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/news');
      if (!res.ok) throw new Error('Unable to load news wire');
      const data = await res.json();
      setArticles(data.articles || []);
      setStats(data.stats || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reach news server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchNews();
  }, [fetchNews]);

  // Real-time WebSocket push notification connection
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: number | null = null;
    let closedByUnmount = false;

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as {
            type: string;
            payload?: { article?: NewsArticle; reason?: string };
          };

          if (msg.type === 'news:sync') {
            void fetchNews();
            return;
          }

          if (msg.type === 'news:push' && msg.payload?.article) {
            const incoming = msg.payload.article;
            const reason = msg.payload.reason || `Breaking · ${incoming.newspaper}`;

            // Idempotent prepend to live feed
            setArticles((prev) => {
              if (prev.some((a) => a.id === incoming.id)) return prev;
              return [incoming, ...prev];
            });

            if (!preferences.notificationsEnabled) return;

            const newAlert: PushAlert = {
              id: `${incoming.id}-${Date.now()}`,
              article: incoming,
              receivedAt: new Date().toISOString(),
              reason,
              read: false,
            };

            setAlerts((prev) => [newAlert, ...prev].slice(0, 40));
            setLiveToast(newAlert);

            if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
            toastTimerRef.current = window.setTimeout(() => {
              setLiveToast(null);
            }, 7000);

            if (
              typeof window !== 'undefined' &&
              'Notification' in window &&
              Notification.permission === 'granted'
            ) {
              new Notification(`${incoming.newspaper} · Breaking`, {
                body: incoming.title,
                tag: incoming.id,
              });
            }
          }
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        if (!closedByUnmount) {
          reconnectTimeout = window.setTimeout(connect, 3500);
        }
      };

      ws.onerror = () => {
        ws?.close();
      };
    };

    connect();

    return () => {
      closedByUnmount = true;
      if (reconnectTimeout) window.clearTimeout(reconnectTimeout);
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
      ws?.close();
    };
  }, [fetchNews, preferences.notificationsEnabled]);

  const handleRefreshWire = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/news/refresh', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles || []);
        setStats(data.stats || null);
      }
    } finally {
      setRefreshing(false);
    }
  };

  // Track Recently Read in localStorage whenever user clicks an article link
  const recordRecentlyRead = useCallback((article: NewsArticle) => {
    setRecentlyRead((prev) => {
      const filtered = prev.filter((entry) => entry.article.id !== article.id);
      const next: RecentlyReadEntry[] = [
        {
          article: {
            id: article.id,
            title: article.title,
            excerpt: article.excerpt,
            link: article.link,
            sourceId: article.sourceId,
            newspaper: article.newspaper,
            category: article.category,
            region: article.region,
            stateLabel: article.stateLabel,
            language: article.language,
            publishedAt: article.publishedAt,
            imageUrl: article.imageUrl,
          },
          viewedAt: new Date().toISOString(),
        },
        ...filtered,
      ];
      return next.slice(0, 12);
    });
  }, []);

  const toggleBookmark = useCallback((article: NewsArticle) => {
    setBookmarks((prev) => {
      const exists = prev.some((b) => b.id === article.id);
      if (exists) return prev.filter((b) => b.id !== article.id);
      return [article, ...prev];
    });
  }, []);

  const bookmarkedIds = useMemo(
    () => new Set(bookmarks.map((b) => b.id)),
    [bookmarks]
  );

  const handleRequestBrowserPush = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    setBrowserPermission(perm);
    if (perm === 'granted') {
      setPreferences((prev) => ({ ...prev, browserPushEnabled: true }));
    }
  };

  const handleTriggerLiveAlert = async (
    category: NewsCategory | 'all',
    region: IndiaRegion
  ) => {
    setIsDispatching(true);
    try {
      await fetch('/api/admin/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, region }),
      });
    } finally {
      setIsDispatching(false);
    }
  };

  // Filtered & personalized articles
  const displayedArticles = useMemo(() => {
    const sourcePool = viewMode === 'bookmarks' ? bookmarks : articles;
    const q = searchQuery.trim().toLowerCase();

    let list = sourcePool.filter((article) => {
      if (activeCategory === 'for-you') {
        const catMatch =
          preferences.favoriteCategories.length === 0 ||
          preferences.favoriteCategories.includes(article.category);
        const regMatch =
          preferences.favoriteRegions.length === 0 ||
          article.region === 'all' ||
          preferences.favoriteRegions.includes(article.region);
        const langMatch =
          preferences.preferredLanguages.length === 0 ||
          preferences.preferredLanguages.includes(article.language);
        if (!catMatch && !regMatch) return false;
        if (!langMatch) return false;
      } else if (activeCategory !== 'all' && article.category !== activeCategory) {
        return false;
      }

      if (activeRegion !== 'all' && article.region !== activeRegion) return false;
      if (activeLanguage !== 'all' && article.language !== activeLanguage) return false;
      if (
        activeState !== 'all' &&
        !article.stateLabel.toLowerCase().includes(activeState.toLowerCase()) &&
        !article.title.toLowerCase().includes(activeState.toLowerCase())
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

    if (activeCategory === 'for-you') {
      list = [...list].sort((a, b) => {
        const scoreA =
          (preferences.favoriteCategories.includes(a.category) ? 2 : 0) +
          (preferences.favoriteRegions.includes(a.region) ? 2 : 0);
        const scoreB =
          (preferences.favoriteCategories.includes(b.category) ? 2 : 0) +
          (preferences.favoriteRegions.includes(b.region) ? 2 : 0);
        if (scoreB !== scoreA) return scoreB - scoreA;
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      });
    }

    return list;
  }, [
    viewMode,
    bookmarks,
    articles,
    searchQuery,
    activeCategory,
    activeRegion,
    activeLanguage,
    activeState,
    preferences,
  ]);

  const currentRegionMeta = useMemo(
    () => INDIA_REGIONS.find((r) => r.id === activeRegion) || INDIA_REGIONS[0],
    [activeRegion]
  );

  const unreadAlertsCount = useMemo(
    () => alerts.filter((a) => !a.read).length,
    [alerts]
  );

  const leadArticle = displayedArticles[0];
  const secondaryFeatures = displayedArticles.slice(1, 4);
  const wireArticles = displayedArticles.slice(4);

  const istDateString = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#FBF9F5] dark:bg-[#131210] text-stone-900 dark:text-stone-100 transition-colors duration-200">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 border-b border-stone-200 dark:border-stone-800 bg-[#FBF9F5]/95 dark:bg-[#131210]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8 py-3.5">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => {
              setViewMode('wire');
              setActiveCategory('all');
              setActiveRegion('all');
              setActiveState('all');
            }}
            className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-50 whitespace-nowrap shrink-0 text-left"
          >
            Bharat Chronicle
          </button>

          {/* Zone 2: 5 concise single-line text nav links */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600 dark:text-stone-400"
          >
            <button
              type="button"
              onClick={() => {
                setViewMode('wire');
                setActiveCategory('all');
              }}
              className={`whitespace-nowrap shrink-0 py-1 transition-colors ${
                viewMode === 'wire' && activeCategory === 'all'
                  ? 'text-[#9A3412] dark:text-amber-400 border-b-2 border-[#9A3412] dark:border-amber-400'
                  : 'hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              Front Page
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('wire');
                setActiveCategory('for-you');
              }}
              className={`whitespace-nowrap shrink-0 py-1 transition-colors ${
                viewMode === 'wire' && activeCategory === 'for-you'
                  ? 'text-[#9A3412] dark:text-amber-400 border-b-2 border-[#9A3412] dark:border-amber-400'
                  : 'hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              For You
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('wire');
                setActiveCategory('state');
              }}
              className={`whitespace-nowrap shrink-0 py-1 transition-colors ${
                viewMode === 'wire' && activeCategory === 'state'
                  ? 'text-[#9A3412] dark:text-amber-400 border-b-2 border-[#9A3412] dark:border-amber-400'
                  : 'hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              Regions
            </button>
            <button
              type="button"
              onClick={() => setViewMode('bookmarks')}
              className={`whitespace-nowrap shrink-0 py-1 transition-colors ${
                viewMode === 'bookmarks'
                  ? 'text-[#9A3412] dark:text-amber-400 border-b-2 border-[#9A3412] dark:border-amber-400'
                  : 'hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              Bookmarks ({bookmarks.length})
            </button>
            <button
              type="button"
              onClick={() => setAdminOpen(true)}
              className="whitespace-nowrap shrink-0 py-1 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              Admin
            </button>
          </nav>

          {/* Zone 3: 1 Primary CTA Button */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setAlertsOpen(true)}
              className="rounded-md bg-[#9A3412] dark:bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-[#7C2D12] dark:hover:bg-amber-500 transition-colors whitespace-nowrap shrink-0"
            >
              {unreadAlertsCount > 0
                ? `Breaking Alerts (${unreadAlertsCount})`
                : 'Breaking Alerts'}
            </button>
          </div>
        </div>
      </header>

      {/* Editorial Edition Ribbon & Utility Toolbar */}
      <div className="border-b border-stone-200 dark:border-stone-800 bg-[#F4F0E8]/70 dark:bg-stone-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            {/* Edition Info */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600 dark:text-stone-400">
              <span className="font-medium text-stone-900 dark:text-stone-200">
                {istDateString}
              </span>
              <span aria-hidden="true">·</span>
              <span>All-India RSS Edition</span>
              {stats && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    {stats.activeSourcesCount} Active Feeds · {stats.totalArticles} Headlines
                  </span>
                </>
              )}
            </div>

            {/* Search, Language, Personalize, Refresh, Theme */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 sm:flex-initial min-w-[210px]">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search headlines, states, sources..."
                  aria-label="Search headlines"
                  className="w-full rounded-md border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 pl-8 pr-7 py-1.5 text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:border-[#9A3412] dark:focus:border-amber-500 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-stone-500 shrink-0" />
                <select
                  aria-label="Select edition language"
                  value={activeLanguage}
                  onChange={(e) =>
                    setActiveLanguage(e.target.value as IndianLanguageCode)
                  }
                  className="rounded-md border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-2.5 py-1.5 text-xs font-medium text-stone-800 dark:text-stone-200 focus:border-[#9A3412] focus:outline-none"
                >
                  {INDIAN_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.code === 'all'
                        ? 'All Languages'
                        : `${lang.label} (${lang.nativeLabel})`}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setPersonalizeOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-1.5 text-xs font-medium text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors whitespace-nowrap"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Personalize
              </button>

              <button
                type="button"
                onClick={handleRefreshWire}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-1.5 text-xs font-medium text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`}
                />
                Sync Wire
              </button>

              <button
                type="button"
                onClick={() => setIsDark((d) => !d)}
                aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-2.5 py-1.5 text-xs font-medium text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors whitespace-nowrap"
              >
                {isDark ? (
                  <>
                    <Sun className="h-3.5 w-3.5 text-amber-400" />
                    <span>Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-3.5 w-3.5 text-stone-600" />
                    <span>Dark</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Primary Quick Nav */}
          <div className="mt-2.5 flex md:hidden items-center gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setViewMode('wire')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${
                viewMode === 'wire'
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                  : 'border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300'
              }`}
            >
              News Wire
            </button>
            <button
              type="button"
              onClick={() => setViewMode('bookmarks')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${
                viewMode === 'bookmarks'
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                  : 'border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300'
              }`}
            >
              Bookmarks ({bookmarks.length})
            </button>
            <button
              type="button"
              onClick={() => setAdminOpen(true)}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 whitespace-nowrap"
            >
              Admin Console
            </button>
          </div>
        </div>
      </div>

      {/* Category Desk Selector (All 11 Indian News Categories + For You) */}
      <div className="border-b border-stone-200 dark:border-stone-800 bg-white/70 dark:bg-[#171614]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto py-2.5">
            {CATEGORY_ITEMS.map((cat) => {
              const active = viewMode === 'wire' && activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setViewMode('wire');
                    setActiveCategory(cat.id);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                    active
                      ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Region & State Bar */}
          <div className="flex flex-wrap items-center gap-1.5 border-t border-stone-200/70 dark:border-stone-800/80 py-2.5">
            <span className="mr-2 text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              India Region:
            </span>
            {INDIA_REGIONS.map((reg) => {
              const active = activeRegion === reg.id;
              return (
                <button
                  key={reg.id}
                  type="button"
                  onClick={() => {
                    setActiveRegion(reg.id);
                    setActiveState('all');
                  }}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-[#9A3412]/15 text-[#9A3412] dark:bg-amber-500/20 dark:text-amber-300'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  {reg.label}
                </button>
              );
            })}

            {currentRegionMeta.states.length > 0 && (
              <div className="mt-1.5 flex w-full flex-wrap items-center gap-1.5 pt-1.5 border-t border-stone-200/60 dark:border-stone-800/60">
                <span className="mr-1 text-[11px] text-stone-500 dark:text-stone-400">
                  State / UT:
                </span>
                <button
                  type="button"
                  onClick={() => setActiveState('all')}
                  className={`px-2 py-0.5 text-[11px] font-medium rounded ${
                    activeState === 'all'
                      ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                      : 'text-stone-600 dark:text-stone-400 hover:underline'
                  }`}
                >
                  All States
                </button>
                {currentRegionMeta.states.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setActiveState(st)}
                    className={`px-2 py-0.5 text-[11px] font-medium rounded ${
                      activeState === st
                        ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                        : 'text-stone-600 dark:text-stone-400 hover:underline'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main>
        {/* Status / Loading / Empty / Error */}
        {loading ? (
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse">
              <div className="lg:col-span-7 aspect-[16/9] rounded-md bg-stone-200 dark:bg-stone-800" />
              <div className="lg:col-span-5 space-y-4">
                <div className="h-4 w-40 bg-stone-200 dark:bg-stone-800 rounded" />
                <div className="h-10 w-full bg-stone-200 dark:bg-stone-800 rounded" />
                <div className="h-24 w-full bg-stone-200 dark:bg-stone-800 rounded" />
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="mx-auto max-w-3xl px-4 py-16 text-center">
            <p className="font-serif text-xl font-semibold">News Wire Temporarily Offline</p>
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">{error}</p>
            <button
              type="button"
              onClick={fetchNews}
              className="mt-4 rounded-md bg-[#9A3412] px-4 py-2 text-xs font-semibold text-white"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <>
            {/* Bookmarks Banner */}
            {viewMode === 'bookmarks' && (
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6">
                <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-4">
                  <div>
                    <h1 className="font-serif text-2xl font-bold">Saved Bookmarks</h1>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Stored locally on this browser · Always opens the original publisher
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewMode('wire')}
                    className="text-xs font-medium text-[#9A3412] dark:text-amber-400 hover:underline"
                  >
                    Back to Live Wire
                  </button>
                </div>
              </div>
            )}

            {displayedArticles.length === 0 ? (
              <div className="mx-auto max-w-3xl px-4 py-16 text-center">
                <h2 className="font-serif text-2xl font-semibold">
                  {viewMode === 'bookmarks'
                    ? 'No bookmarked articles yet'
                    : 'No matching dispatches found'}
                </h2>
                <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
                  {viewMode === 'bookmarks'
                    ? 'Click the bookmark icon on any headline to save it here for quick return.'
                    : 'Try clearing your search query or switching back to All India / All Languages.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('wire');
                    setActiveCategory('all');
                    setActiveRegion('all');
                    setActiveState('all');
                    setActiveLanguage('all');
                    setSearchQuery('');
                  }}
                  className="mt-4 rounded-md bg-stone-900 dark:bg-stone-100 px-4 py-2 text-xs font-semibold text-white dark:text-stone-900"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <>
                {/* Tier 1: Lead Story */}
                {leadArticle && (
                  <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-7 pb-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-stretch">
                      <a
                        href={leadArticle.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => recordRecentlyRead(leadArticle)}
                        className="group lg:col-span-7 block overflow-hidden rounded-md"
                      >
                        <EditorialImage
                          article={leadArticle}
                          aspectClass="aspect-[16/9] lg:h-full lg:aspect-auto"
                        />
                      </a>

                      <div className="lg:col-span-5 flex flex-col justify-between py-1">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                            <span className="font-semibold text-[#9A3412] dark:text-amber-400">
                              {leadArticle.newspaper}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{leadArticle.stateLabel}</span>
                            <span aria-hidden="true">·</span>
                            <span className="capitalize">{leadArticle.category}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">
                              {formatRelativeTime(leadArticle.publishedAt)}
                            </span>
                          </div>

                          <a
                            href={leadArticle.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => recordRecentlyRead(leadArticle)}
                            className="mt-3 block group"
                          >
                            <h1 className="font-serif text-3xl sm:text-4xl font-bold leading-tight text-stone-900 dark:text-stone-50 group-hover:text-[#9A3412] dark:group-hover:text-amber-400 transition-colors">
                              {leadArticle.title}
                            </h1>
                          </a>

                          <p className="mt-4 text-sm sm:text-base leading-relaxed text-stone-600 dark:text-stone-300">
                            {leadArticle.excerpt}
                          </p>
                        </div>

                        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 dark:border-stone-800 pt-4">
                          <a
                            href={leadArticle.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => recordRecentlyRead(leadArticle)}
                            className="inline-flex items-center gap-2 rounded-md bg-stone-900 dark:bg-stone-100 px-4 py-2 text-xs font-semibold text-white dark:text-stone-900 hover:opacity-90 transition-opacity"
                          >
                            Read Full Article on {leadArticle.newspaper}
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>

                          <button
                            type="button"
                            onClick={() => toggleBookmark(leadArticle)}
                            aria-label="Bookmark lead story"
                            className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                              bookmarkedIds.has(leadArticle.id)
                                ? 'border-[#9A3412] text-[#9A3412] dark:border-amber-400 dark:text-amber-400'
                                : 'border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                            }`}
                          >
                            <Bookmark
                              className="h-3.5 w-3.5"
                              fill={bookmarkedIds.has(leadArticle.id) ? 'currentColor' : 'none'}
                            />
                            {bookmarkedIds.has(leadArticle.id) ? 'Saved' : 'Save'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* Tier 2: Secondary Features */}
                {secondaryFeatures.length > 0 && (
                  <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-stone-200 dark:border-stone-800 pt-7">
                      {secondaryFeatures.map((article) => (
                        <article
                          key={article.id}
                          className="group flex flex-col justify-between"
                        >
                          <div>
                            <a
                              href={article.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => recordRecentlyRead(article)}
                              className="block overflow-hidden rounded-md"
                            >
                              <EditorialImage article={article} aspectClass="aspect-[4/3]" />
                            </a>

                            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
                              <span className="font-semibold text-[#9A3412] dark:text-amber-400">
                                {article.newspaper}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>{article.stateLabel}</span>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums">
                                {formatRelativeTime(article.publishedAt)}
                              </span>
                            </div>

                            <a
                              href={article.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => recordRecentlyRead(article)}
                              className="mt-1.5 block"
                            >
                              <h2 className="font-serif text-xl font-semibold leading-snug text-stone-900 dark:text-stone-100 group-hover:text-[#9A3412] dark:group-hover:text-amber-400 transition-colors">
                                {article.title}
                              </h2>
                            </a>

                            <p className="mt-2 text-xs leading-relaxed text-stone-600 dark:text-stone-400 line-clamp-3">
                              {article.excerpt}
                            </p>
                          </div>

                          <div className="mt-3 flex items-center justify-between pt-2 text-xs">
                            <a
                              href={article.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => recordRecentlyRead(article)}
                              className="inline-flex items-center gap-1 font-medium text-stone-800 dark:text-stone-200 hover:underline"
                            >
                              Original publisher
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            <button
                              type="button"
                              onClick={() => toggleBookmark(article)}
                              aria-label={`Bookmark ${article.title}`}
                              className="rounded p-1 text-stone-500 hover:text-[#9A3412] dark:hover:text-amber-400"
                            >
                              <Bookmark
                                className="h-4 w-4"
                                fill={bookmarkedIds.has(article.id) ? 'currentColor' : 'none'}
                              />
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}

            {/* Recently Read Section (Tracked via localStorage) */}
            <RecentlyReadStrip
              items={recentlyRead}
              onArticleClick={recordRecentlyRead}
              onRemoveItem={(id) =>
                setRecentlyRead((prev) => prev.filter((item) => item.article.id !== id))
              }
              onClearAll={() => setRecentlyRead([])}
            />

            {/* Tier 3: Asymmetric Broadsheet Wire + Regional India Bureau */}
            {wireArticles.length > 0 && (
              <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  {/* Left 70%: Chronological News Wire */}
                  <div className="lg:col-span-8">
                    <div className="flex items-center justify-between border-b border-stone-300 dark:border-stone-700 pb-3 mb-2">
                      <h2 className="font-serif text-2xl font-bold">
                        {activeCategory === 'for-you'
                          ? 'Personalized For You Wire'
                          : `${
                              CATEGORY_ITEMS.find((c) => c.id === activeCategory)?.label ||
                              'All-India'
                            } Dispatches`}
                      </h2>
                      <span className="font-mono text-xs tabular-nums text-stone-500 dark:text-stone-400">
                        {wireArticles.length} more stories
                      </span>
                    </div>

                    <div className="divide-y divide-stone-200 dark:divide-stone-800">
                      {wireArticles.map((article) => (
                        <article
                          key={article.id}
                          className="group grid grid-cols-1 sm:grid-cols-12 gap-4 py-5 items-start"
                        >
                          <a
                            href={article.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => recordRecentlyRead(article)}
                            className="sm:col-span-4 block overflow-hidden rounded-md"
                          >
                            <EditorialImage article={article} aspectClass="aspect-[4/3]" />
                          </a>

                          <div className="sm:col-span-8 flex flex-col justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
                                <span className="font-semibold text-[#9A3412] dark:text-amber-400">
                                  {article.newspaper}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span>{article.stateLabel}</span>
                                <span aria-hidden="true">·</span>
                                <span className="capitalize">{article.category}</span>
                                {article.language !== 'en' && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span>{getLanguageLabel(article.language)}</span>
                                  </>
                                )}
                                <span aria-hidden="true">·</span>
                                <span className="font-mono tabular-nums">
                                  {formatRelativeTime(article.publishedAt)}
                                </span>
                              </div>

                              <a
                                href={article.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => recordRecentlyRead(article)}
                                className="mt-1.5 block"
                              >
                                <h3 className="font-serif text-lg sm:text-xl font-semibold leading-snug text-stone-900 dark:text-stone-100 group-hover:text-[#9A3412] dark:group-hover:text-amber-400 transition-colors">
                                  {article.title}
                                </h3>
                              </a>

                              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-stone-600 dark:text-stone-400">
                                {article.excerpt}
                              </p>
                            </div>

                            <div className="mt-3 flex items-center justify-between text-xs">
                              <a
                                href={article.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => recordRecentlyRead(article)}
                                className="inline-flex items-center gap-1.5 font-medium text-stone-800 dark:text-stone-200 hover:text-[#9A3412] dark:hover:text-amber-400"
                              >
                                Read full article at {article.newspaper}
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>

                              <button
                                type="button"
                                onClick={() => toggleBookmark(article)}
                                aria-label={`Bookmark ${article.title}`}
                                className="inline-flex items-center gap-1 text-stone-500 hover:text-[#9A3412] dark:hover:text-amber-400"
                              >
                                <Bookmark
                                  className="h-3.5 w-3.5"
                                  fill={
                                    bookmarkedIds.has(article.id) ? 'currentColor' : 'none'
                                  }
                                />
                                <span>
                                  {bookmarkedIds.has(article.id) ? 'Saved' : 'Save'}
                                </span>
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>

                  {/* Right 30%: Regional Bureaus & Publisher Attribution */}
                  <aside className="lg:col-span-4 space-y-8">
                    <div className="rounded-md border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/70 p-5">
                      <h3 className="font-serif text-lg font-bold border-b border-stone-200 dark:border-stone-800 pb-2.5">
                        All-India Regional Bureaus
                      </h3>
                      <div className="mt-3 divide-y divide-stone-200/80 dark:divide-stone-800">
                        {INDIA_REGIONS.filter((r) => r.id !== 'all').map((region) => {
                          const count = stats?.byRegion[region.id] ?? 0;
                          const isCurrent = activeRegion === region.id;
                          return (
                            <button
                              key={region.id}
                              type="button"
                              onClick={() => {
                                setViewMode('wire');
                                setActiveRegion(region.id);
                                setActiveState('all');
                              }}
                              className="flex w-full items-start justify-between gap-3 py-3 text-left group"
                            >
                              <div>
                                <div
                                  className={`text-sm font-semibold transition-colors ${
                                    isCurrent
                                      ? 'text-[#9A3412] dark:text-amber-400'
                                      : 'text-stone-900 dark:text-stone-100 group-hover:text-[#9A3412] dark:group-hover:text-amber-400'
                                  }`}
                                >
                                  {region.label}
                                </div>
                                <div className="mt-0.5 text-[11px] leading-snug text-stone-500 dark:text-stone-400">
                                  {region.statesSummary}
                                </div>
                              </div>
                              <span className="font-mono text-xs tabular-nums text-stone-500 dark:text-stone-400 shrink-0 pt-0.5">
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-md border border-stone-200 dark:border-stone-800 bg-stone-100/70 dark:bg-stone-900/50 p-5 text-xs leading-relaxed text-stone-600 dark:text-stone-400">
                      <h4 className="font-serif text-sm font-semibold text-stone-900 dark:text-stone-100">
                        Syndication &amp; Copyright Policy
                      </h4>
                      <p className="mt-2">
                        Bharat Chronicle indexes headlines, thumbnails, publication
                        timestamps, and brief RSS excerpts strictly from publicly
                        syndicated Indian newspaper feeds. Full articles are never stored
                        or republished; every link directs readers straight to the
                        original publisher&rsquo;s website.
                      </p>
                    </div>
                  </aside>
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-stone-200 dark:border-stone-800 bg-[#F4F0E8]/60 dark:bg-stone-950/60 py-8">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 text-xs text-stone-600 dark:text-stone-400">
          <div>
            <span className="font-serif text-sm font-semibold text-stone-900 dark:text-stone-100">
              Bharat Chronicle
            </span>
            <span className="mx-2">·</span>
            <span>All-India RSS News Aggregator across 10 Languages &amp; 6 Regions</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setPersonalizeOpen(true)}
              className="hover:text-stone-900 dark:hover:text-stone-100"
            >
              Personalize Feed
            </button>
            <button
              type="button"
              onClick={() => setAlertsOpen(true)}
              className="hover:text-stone-900 dark:hover:text-stone-100"
            >
              Breaking Alerts
            </button>
            <button
              type="button"
              onClick={() => setAdminOpen(true)}
              className="hover:text-stone-900 dark:hover:text-stone-100"
            >
              Admin Console
            </button>
          </div>
        </div>
      </footer>

      {/* Real-Time Breaking News Toast */}
      {liveToast && (
        <div
          role="status"
          className="fixed bottom-4 right-4 z-40 w-[calc(100%-2rem)] max-w-sm rounded-md border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 p-4 shadow-xl"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#9A3412] dark:text-amber-400">
              Breaking · {liveToast.article.newspaper}
            </div>
            <button
              type="button"
              onClick={() => setLiveToast(null)}
              aria-label="Dismiss breaking alert"
              className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <a
            href={liveToast.article.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              recordRecentlyRead(liveToast.article);
              setLiveToast(null);
            }}
            className="mt-1.5 block font-serif text-sm font-semibold leading-snug text-stone-900 dark:text-stone-100 hover:underline"
          >
            {liveToast.article.title}
          </a>
          <div className="mt-2 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
            <span>{liveToast.article.stateLabel}</span>
            <a
              href={liveToast.article.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => recordRecentlyRead(liveToast.article)}
              className="inline-flex items-center gap-1 font-medium text-[#9A3412] dark:text-amber-400"
            >
              Read at source
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}

      {/* Drawers */}
      <PushNotificationsDrawer
        open={alertsOpen}
        onClose={() => setAlertsOpen(false)}
        alerts={alerts}
        wsConnected={wsConnected}
        preferences={preferences}
        browserPermission={browserPermission}
        onRequestBrowserPush={handleRequestBrowserPush}
        onToggleNotifications={() =>
          setPreferences((p) => ({
            ...p,
            notificationsEnabled: !p.notificationsEnabled,
          }))
        }
        onMarkAllRead={() =>
          setAlerts((prev) => prev.map((a) => ({ ...a, read: true })))
        }
        onTriggerLiveAlert={handleTriggerLiveAlert}
        onArticleClick={recordRecentlyRead}
        isDispatching={isDispatching}
      />

      <PersonalizeDrawer
        open={personalizeOpen}
        onClose={() => setPersonalizeOpen(false)}
        preferences={preferences}
        onUpdatePreferences={setPreferences}
      />

      <AdminDashboardDrawer
        open={adminOpen}
        onClose={() => setAdminOpen(false)}
        onSourcesChanged={fetchNews}
      />
    </div>
  );
}

import { useEffect, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import {
  CATEGORY_ITEMS,
  INDIAN_LANGUAGES,
  INDIA_REGIONS,
  type FeedSourceConfig,
  type IndiaRegion,
  type IndianLanguageCode,
  type NewsSectionSlug,
} from '../types/news';

interface AdminDashboardDrawerProps {
  open: boolean;
  onClose: () => void;
  onSourcesChanged: () => void;
}

export function AdminDashboardDrawer({
  open,
  onClose,
  onSourcesChanged,
}: AdminDashboardDrawerProps) {
  const [sources, setSources] = useState<FeedSourceConfig[]>([]);
  const [wsClients, setWsClients] = useState(0);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Add source form
  const [newspaper, setNewspaper] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState<NewsSectionSlug>('national');
  const [region, setRegion] = useState<IndiaRegion>('all');
  const [stateLabel, setStateLabel] = useState('All India');
  const [language, setLanguage] = useState<Exclude<IndianLanguageCode, 'all'>>('en');

  // Breaking alert broadcast form
  const [alertHeadline, setAlertHeadline] = useState('');
  const [alertCategory, setAlertCategory] = useState<NewsSectionSlug | 'all'>('all');
  const [alertRegion, setAlertRegion] = useState<IndiaRegion>('all');
  const [broadcasting, setBroadcasting] = useState(false);

  const loadSources = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/sources');
      if (res.ok) {
        const data = await res.json();
        setSources(data.sources || []);
        setWsClients(data.wsClients || 0);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      void loadSources();
    }
  }, [open]);

  if (!open) return null;

  const toggleSource = async (source: FeedSourceConfig) => {
    setFeedback(null);
    const res = await fetch(`/api/admin/sources/${source.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !source.enabled }),
    });
    if (res.ok) {
      const data = await res.json();
      setSources(data.sources || []);
      setFeedback(
        `${source.newspaper} (${source.stateLabel}) ${!source.enabled ? 'enabled' : 'paused'}.`
      );
      onSourcesChanged();
    }
  };

  const handleAddSource = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const res = await fetch('/api/admin/sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        newspaper,
        url,
        category,
        region,
        stateLabel,
        language,
        licenseNote: 'Admin-approved Public Publisher RSS',
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setSources(data.sources || []);
      setNewspaper('');
      setUrl('');
      setFeedback('New RSS feed source verified and added to aggregation.');
      onSourcesChanged();
    } else {
      const err = await res.json().catch(() => ({}));
      setFeedback(err.error || 'Could not add RSS feed.');
    }
  };

  const handleDeleteSource = async (id: string) => {
    const res = await fetch(`/api/admin/sources/${id}`, { method: 'DELETE' });
    if (res.ok) {
      const data = await res.json();
      setSources(data.sources || []);
      setFeedback('Feed source removed.');
      onSourcesChanged();
    }
  };

  const handleBroadcast = async (e: FormEvent) => {
    e.preventDefault();
    setBroadcasting(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline: alertHeadline.trim() || undefined,
          category: alertCategory,
          region: alertRegion,
          reason: 'Admin Breaking Desk Dispatch',
        }),
      });
      if (res.ok) {
        setAlertHeadline('');
        setFeedback('Breaking news alert broadcast to all connected readers.');
      }
    } finally {
      setBroadcasting(false);
    }
  };

  const okCount = sources.filter((s) => s.enabled && s.lastStatus === 'ok').length;
  const errCount = sources.filter((s) => s.enabled && s.lastStatus === 'error').length;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Admin Dashboard"
    >
      <div className="flex h-full w-full max-w-2xl flex-col border-l border-stone-200 dark:border-stone-800 bg-[#FBF9F5] dark:bg-[#161513] text-stone-900 dark:text-stone-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#9A3412] dark:text-amber-400" />
              <h2 className="font-serif text-xl font-semibold">
                Editorial Admin Console
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
              Manage licensed RSS feeds, publisher compliance, and real-time breaking alerts
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close admin console"
            className="rounded-md p-2 text-stone-500 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Summary Metrics Row */}
        <div className="grid grid-cols-4 gap-3 border-b border-stone-200 dark:border-stone-800 bg-stone-100/70 dark:bg-stone-900/50 px-6 py-3.5">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Total Feeds
            </div>
            <div className="font-mono text-lg font-semibold tabular-nums">
              {sources.length}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Healthy
            </div>
            <div className="font-mono text-lg font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
              {okCount}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Degraded
            </div>
            <div className="font-mono text-lg font-semibold tabular-nums text-amber-700 dark:text-amber-400">
              {errCount}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Live Clients
            </div>
            <div className="font-mono text-lg font-semibold tabular-nums">
              {wsClients}
            </div>
          </div>
        </div>

        {feedback && (
          <div className="border-b border-stone-200 dark:border-stone-800 bg-amber-50 dark:bg-amber-950/30 px-6 py-2.5 text-xs font-medium text-stone-800 dark:text-amber-200">
            {feedback}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">
          {/* Broadcast Breaking News Alert */}
          <section className="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/80 p-4">
            <h3 className="font-serif text-base font-semibold">
              Broadcast Breaking News Alert
            </h3>
            <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
              Pushes an instant WebSocket &amp; browser notification linked to the original publisher.
            </p>
            <form onSubmit={handleBroadcast} className="mt-3 space-y-3">
              <input
                type="text"
                value={alertHeadline}
                onChange={(e) => setAlertHeadline(e.target.value)}
                placeholder="Optional custom breaking headline (or leave blank to dispatch latest wire item)"
                className="w-full rounded-md border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-2 text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:border-[#9A3412] focus:outline-none"
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select
                  value={alertCategory}
                  onChange={(e) =>
                    setAlertCategory(e.target.value as NewsSectionSlug | 'all')
                  }
                  className="rounded-md border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-2 text-xs"
                >
                  <option value="all">Any Category</option>
                  {CATEGORY_ITEMS.filter(
                    (c) => c.id !== 'all' && c.id !== 'for-you'
                  ).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <select
                  value={alertRegion}
                  onChange={(e) => setAlertRegion(e.target.value as IndiaRegion)}
                  className="rounded-md border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-2 text-xs"
                >
                  {INDIA_REGIONS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={broadcasting}
                  className="inline-flex items-center justify-center gap-1.5 rounded-md bg-[#9A3412] px-4 py-2 text-xs font-semibold text-white hover:bg-[#7C2D12] disabled:opacity-50 transition-colors"
                >
                  <Send className="h-3.5 w-3.5" />
                  {broadcasting ? 'Sending...' : 'Dispatch Alert'}
                </button>
              </div>
            </form>
          </section>

          {/* Add Legal RSS Source */}
          <section className="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/80 p-4">
            <h3 className="font-serif text-base font-semibold">
              Add Public RSS / Licensed Feed Source
            </h3>
            <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
              Only index feeds permitting aggregation (headlines, excerpts, and publisher links).
            </p>
            <form onSubmit={handleAddSource} className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                required
                value={newspaper}
                onChange={(e) => setNewspaper(e.target.value)}
                placeholder="Publisher Name (e.g., Deccan Herald)"
                className="rounded-md border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-2 text-xs"
              />
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://publisher.com/rss.xml"
                className="rounded-md border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-2 text-xs"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as NewsSectionSlug)}
                className="rounded-md border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-2 text-xs"
              >
                {CATEGORY_ITEMS.filter((c) => c.id !== 'all' && c.id !== 'for-you').map(
                  (c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  )
                )}
              </select>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value as IndiaRegion)}
                className="rounded-md border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-2 text-xs"
              >
                {INDIA_REGIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={stateLabel}
                onChange={(e) => setStateLabel(e.target.value)}
                placeholder="State / Bureau (e.g., Karnataka)"
                className="rounded-md border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-2 text-xs"
              />
              <select
                value={language}
                onChange={(e) =>
                  setLanguage(e.target.value as Exclude<IndianLanguageCode, 'all'>)
                }
                className="rounded-md border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-2 text-xs"
              >
                {INDIAN_LANGUAGES.filter((l) => l.code !== 'all').map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label} ({l.nativeLabel})
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="sm:col-span-2 inline-flex items-center justify-center gap-1.5 rounded-md bg-stone-900 dark:bg-stone-100 px-4 py-2 text-xs font-semibold text-white dark:text-stone-900 hover:opacity-90 transition-opacity"
              >
                <Plus className="h-3.5 w-3.5" />
                Add &amp; Sync Feed Source
              </button>
            </form>
          </section>

          {/* Feed Sources Table */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif text-base font-semibold">
                Configured Publisher Feeds
              </h3>
              <button
                type="button"
                onClick={loadSources}
                disabled={loading}
                className="inline-flex items-center gap-1 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh Status
              </button>
            </div>

            <div className="divide-y divide-stone-200 dark:divide-stone-800 border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-900/60">
              {sources.map((src) => (
                <div
                  key={src.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {src.lastStatus === 'ok' ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      ) : src.lastStatus === 'error' ? (
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                      )}
                      <span className="font-semibold truncate text-stone-900 dark:text-stone-100">
                        {src.newspaper}
                      </span>
                      <span className="text-stone-500 dark:text-stone-400 truncate">
                        · {src.stateLabel} · {src.category} · {src.language.toUpperCase()}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400 truncate">
                      <span className="font-mono tabular-nums">
                        {src.articleCount} items
                      </span>
                      <span>·</span>
                      <span className="truncate">{src.licenseNote}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleSource(src)}
                      className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                        src.enabled
                          ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                          : 'border border-stone-300 dark:border-stone-700 text-stone-500 dark:text-stone-400'
                      }`}
                    >
                      {src.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                    {src.id.startsWith('custom-') && (
                      <button
                        type="button"
                        onClick={() => handleDeleteSource(src.id)}
                        aria-label={`Remove ${src.newspaper}`}
                        className="rounded-md p-1.5 text-stone-400 hover:text-red-600 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

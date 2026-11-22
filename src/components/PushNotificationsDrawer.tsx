import { Bell, CheckCheck, ExternalLink, Radio, Send, X } from 'lucide-react';
import {
  CATEGORY_ITEMS,
  INDIA_REGIONS,
  type IndiaRegion,
  type NewsArticle,
  type NewsSectionSlug,
  type PushAlert,
  type UserPreferences,
} from '../types/news';

interface PushNotificationsDrawerProps {
  open: boolean;
  onClose: () => void;
  alerts: PushAlert[];
  wsConnected: boolean;
  preferences: UserPreferences;
  browserPermission: NotificationPermission | 'unsupported';
  onRequestBrowserPush: () => void;
  onToggleNotifications: () => void;
  onMarkAllRead: () => void;
  onTriggerLiveAlert: (category: NewsSectionSlug | 'all', region: IndiaRegion) => void;
  onArticleClick: (article: NewsArticle) => void;
  isDispatching: boolean;
}

export function PushNotificationsDrawer({
  open,
  onClose,
  alerts,
  wsConnected,
  preferences,
  browserPermission,
  onRequestBrowserPush,
  onToggleNotifications,
  onMarkAllRead,
  onTriggerLiveAlert,
  onArticleClick,
  isDispatching,
}: PushNotificationsDrawerProps) {
  if (!open) return null;

  const unreadCount = alerts.filter((a) => !a.read).length;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Breaking News Alerts"
    >
      <div className="flex h-full w-full max-w-md flex-col border-l border-stone-200 dark:border-stone-800 bg-[#FBF9F5] dark:bg-[#161513] text-stone-900 dark:text-stone-100 shadow-2xl">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 px-6 py-4">
          <div>
            <h2 className="font-serif text-xl font-semibold">Breaking Alerts</h2>
            <p className="mt-0.5 flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
              <Radio
                className={`h-3.5 w-3.5 ${
                  wsConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'
                }`}
              />
              <span>
                {wsConnected
                  ? 'Live WebSocket wire connected'
                  : 'Reconnecting to wire...'}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close alerts drawer"
            className="rounded-md p-2 text-stone-500 hover:bg-stone-200/60 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Notification Controls */}
        <div className="border-b border-stone-200 dark:border-stone-800 bg-stone-100/60 dark:bg-stone-900/50 px-6 py-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Real-Time Wire Alerts</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Receive breaking dispatches as newspapers publish
              </p>
            </div>
            <button
              type="button"
              onClick={onToggleNotifications}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                preferences.notificationsEnabled
                  ? 'bg-[#9A3412] text-white'
                  : 'border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300'
              }`}
            >
              {preferences.notificationsEnabled ? 'Active' : 'Paused'}
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="text-xs text-stone-600 dark:text-stone-400">
              Browser Push:{' '}
              <span className="font-medium text-stone-900 dark:text-stone-200">
                {browserPermission === 'granted'
                  ? 'Allowed'
                  : browserPermission === 'denied'
                    ? 'Blocked in browser'
                    : browserPermission === 'unsupported'
                      ? 'Not supported'
                      : 'Not enabled'}
              </span>
            </div>

            {browserPermission === 'default' && (
              <button
                type="button"
                onClick={onRequestBrowserPush}
                className="flex items-center gap-1.5 rounded-md border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-1.5 text-xs font-medium text-stone-800 dark:text-stone-100 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
              >
                <Bell className="h-3.5 w-3.5" />
                Enable Browser Push
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              disabled={isDispatching}
              onClick={() =>
                onTriggerLiveAlert(
                  preferences.favoriteCategories[0] || 'all',
                  preferences.favoriteRegions[0] || 'all'
                )
              }
              className="flex w-full items-center justify-center gap-2 rounded-md border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-2 text-xs font-medium text-stone-900 dark:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-700 disabled:opacity-50 transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
              {isDispatching ? 'Dispatching Bulletin...' : 'Trigger Live Breaking Alert'}
            </button>
          </div>
        </div>

        {/* Feed Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 px-6 py-3 text-xs">
          <span className="font-medium text-stone-600 dark:text-stone-400">
            Recent Dispatches ({alerts.length})
          </span>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="flex items-center gap-1 font-medium text-[#9A3412] dark:text-amber-400 hover:underline"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </div>

        {/* Alert Items */}
        <div className="flex-1 overflow-y-auto divide-y divide-stone-200 dark:divide-stone-800">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <Bell className="h-8 w-8 text-stone-300 dark:text-stone-700" strokeWidth={1.5} />
              <p className="mt-3 font-serif text-base font-medium text-stone-700 dark:text-stone-300">
                No breaking alerts yet
              </p>
              <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 max-w-xs">
                New headlines discovered on Indian newspaper RSS feeds are pushed here in real time.
              </p>
            </div>
          ) : (
            alerts.map((alert) => {
              const catLabel =
                CATEGORY_ITEMS.find((c) => c.id === alert.article.category)?.label ||
                alert.article.category;
              const regLabel =
                INDIA_REGIONS.find((r) => r.id === alert.article.region)?.label ||
                'All India';

              return (
                <article
                  key={alert.id}
                  className={`px-6 py-4 transition-colors ${
                    alert.read
                      ? 'bg-transparent'
                      : 'bg-amber-50/50 dark:bg-amber-950/20'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-[11px] text-stone-500 dark:text-stone-400">
                    <span className="truncate font-medium text-[#9A3412] dark:text-amber-400">
                      {alert.article.newspaper} · {catLabel} · {regLabel}
                    </span>
                    <span className="font-mono tabular-nums shrink-0">
                      {new Date(alert.receivedAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <a
                    href={alert.article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => onArticleClick(alert.article)}
                    className="mt-1.5 block font-serif text-base font-semibold leading-snug text-stone-900 dark:text-stone-100 hover:text-[#9A3412] dark:hover:text-amber-400 transition-colors"
                  >
                    {alert.article.title}
                  </a>
                  <p className="mt-1 text-xs text-stone-600 dark:text-stone-400 line-clamp-2">
                    {alert.article.excerpt}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
                    <span>{alert.reason}</span>
                    <a
                      href={alert.article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => onArticleClick(alert.article)}
                      className="inline-flex items-center gap-1 font-medium text-stone-800 dark:text-stone-200 hover:underline"
                    >
                      Read at publisher
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

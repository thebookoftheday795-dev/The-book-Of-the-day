import { Clock, ExternalLink, History, Trash2, X } from 'lucide-react';
import type { NewsArticle } from '../types/news';

export interface RecentlyReadEntry {
  article: NewsArticle;
  viewedAt: string;
}

interface RecentlyReadStripProps {
  items: RecentlyReadEntry[];
  onArticleClick: (article: NewsArticle) => void;
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
}

function formatViewedTime(iso: string): string {
  const diffMin = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const hrs = Math.round(diffMin / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function RecentlyReadStrip({
  items,
  onArticleClick,
  onRemoveItem,
  onClearAll,
}: RecentlyReadStripProps) {
  if (items.length === 0) return null;

  return (
    <section
      aria-label="Recently Read"
      className="border-y border-stone-200 dark:border-stone-800 bg-stone-100/50 dark:bg-stone-900/40 py-5"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 mb-3.5">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-[#9A3412] dark:text-amber-400" />
            <h2 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">
              Recently Read
            </h2>
            <span className="font-mono text-xs tabular-nums text-stone-500 dark:text-stone-400">
              · {items.length} {items.length === 1 ? 'article' : 'articles'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClearAll}
            className="inline-flex items-center gap-1 text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear history
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {items.slice(0, 4).map(({ article, viewedAt }) => (
            <div
              key={article.id}
              className="group relative flex flex-col justify-between rounded-md border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/90 p-3.5 transition-colors hover:border-stone-300 dark:hover:border-stone-700"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-[11px] text-stone-500 dark:text-stone-400">
                  <span className="truncate font-medium text-[#9A3412] dark:text-amber-400">
                    {article.newspaper}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(article.id)}
                    aria-label={`Remove ${article.title} from recently read`}
                    className="rounded p-0.5 text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <a
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onArticleClick(article)}
                  className="mt-1.5 block font-serif text-sm font-semibold leading-snug text-stone-900 dark:text-stone-100 group-hover:text-[#9A3412] dark:group-hover:text-amber-400 line-clamp-2 transition-colors"
                >
                  {article.title}
                </a>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
                <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                  <Clock className="h-3 w-3" />
                  Viewed {formatViewedTime(viewedAt)}
                </span>
                <a
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onArticleClick(article)}
                  className="inline-flex items-center gap-1 font-medium text-stone-700 dark:text-stone-300 hover:underline"
                >
                  Reopen
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

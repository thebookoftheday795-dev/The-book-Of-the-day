import { useState } from 'react';
import { Newspaper, Trophy } from 'lucide-react';
import type { NewsArticle, NewsSectionSlug } from '../types/news';

const CATEGORY_FALLBACK_IMAGES: Partial<Record<NewsSectionSlug, string>> = {
  national: '/src/assets/images/india_national_editorial_1794925785221.jpg',
  state: '/src/assets/images/india_national_editorial_1794925785221.jpg',
  politics: '/src/assets/images/india_national_editorial_1794925785221.jpg',
  world: '/src/assets/images/india_national_editorial_1794925785221.jpg',
  business: '/src/assets/images/india_economics_mumbai_1794925787766.jpg',
  economy: '/src/assets/images/india_economics_mumbai_1794925787766.jpg',
  technology: '/src/assets/images/india_tech_bengaluru_1794925786786.jpg',
};

interface EditorialImageProps {
  article: NewsArticle;
  aspectClass?: string;
  className?: string;
}

export function EditorialImage({
  article,
  aspectClass = 'aspect-[4/3]',
  className = '',
}: EditorialImageProps) {
  const [primaryFailed, setPrimaryFailed] = useState(false);
  const [fallbackFailed, setFallbackFailed] = useState(false);

  const curatedImage = CATEGORY_FALLBACK_IMAGES[article.category];
  const resolvedSrc =
    article.imageUrl && !primaryFailed ? article.imageUrl : curatedImage;

  if (resolvedSrc && !fallbackFailed) {
    return (
      <div
        className={`relative overflow-hidden bg-stone-200 dark:bg-stone-800 ${aspectClass} ${className}`}
      >
        <img
          src={resolvedSrc}
          alt={`${article.title} — ${article.newspaper}`}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => {
            if (resolvedSrc === article.imageUrl && !primaryFailed) {
              setPrimaryFailed(true);
            } else {
              setFallbackFailed(true);
            }
          }}
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
        />
      </div>
    );
  }

  const isSports = article.category === 'sports';

  return (
    <div
      className={`relative flex flex-col justify-between overflow-hidden border border-stone-200 dark:border-stone-800 p-4 ${aspectClass} ${className} ${
        isSports
          ? 'bg-gradient-to-br from-stone-900 via-stone-800 to-[#14532D] text-stone-100'
          : 'bg-gradient-to-br from-[#F4EFE6] via-[#EBE4D8] to-[#E2D9C8] dark:from-stone-900 dark:via-stone-800 dark:to-stone-900 text-stone-800 dark:text-stone-200'
      }`}
    >
      <div className="flex items-center justify-between text-[11px] tracking-widest uppercase opacity-75">
        <span className="truncate">{article.newspaper}</span>
        <span className="truncate ml-2">{article.stateLabel}</span>
      </div>

      <div className="my-auto flex items-center justify-center py-2">
        {isSports ? (
          <div className="flex flex-col items-center gap-1.5 text-center">
            <Trophy className="h-7 w-7 text-amber-300/90" strokeWidth={1.5} />
            <span className="font-serif text-xs italic text-stone-200">
              India Sports Desk
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-center">
            <Newspaper
              className="h-6 w-6 text-stone-500 dark:text-stone-400"
              strokeWidth={1.5}
            />
            <span className="font-serif text-xs italic text-stone-600 dark:text-stone-400">
              {article.newspaper}
            </span>
          </div>
        )}
      </div>

      <div className="line-clamp-2 font-serif text-xs font-medium leading-snug opacity-90">
        {article.title}
      </div>
    </div>
  );
}

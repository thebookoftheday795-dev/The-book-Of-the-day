import { Check, Sparkles, X } from 'lucide-react';
import {
  CATEGORY_ITEMS,
  INDIAN_LANGUAGES,
  INDIA_REGIONS,
  type IndiaRegion,
  type IndianLanguageCode,
  type NewsSectionSlug,
  type UserPreferences,
} from '../types/news';

interface PersonalizeDrawerProps {
  open: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onUpdatePreferences: (next: UserPreferences) => void;
}

export function PersonalizeDrawer({
  open,
  onClose,
  preferences,
  onUpdatePreferences,
}: PersonalizeDrawerProps) {
  if (!open) return null;

  const toggleCategory = (cat: NewsSectionSlug) => {
    const exists = preferences.favoriteCategories.includes(cat);
    const next = exists
      ? preferences.favoriteCategories.filter((c) => c !== cat)
      : [...preferences.favoriteCategories, cat];
    onUpdatePreferences({ ...preferences, favoriteCategories: next });
  };

  const toggleRegion = (reg: IndiaRegion) => {
    if (reg === 'all') {
      onUpdatePreferences({ ...preferences, favoriteRegions: [] });
      return;
    }
    const exists = preferences.favoriteRegions.includes(reg);
    const next = exists
      ? preferences.favoriteRegions.filter((r) => r !== reg)
      : [...preferences.favoriteRegions, reg];
    onUpdatePreferences({ ...preferences, favoriteRegions: next });
  };

  const toggleLanguage = (lang: Exclude<IndianLanguageCode, 'all'>) => {
    const exists = preferences.preferredLanguages.includes(lang);
    const next = exists
      ? preferences.preferredLanguages.filter((l) => l !== lang)
      : [...preferences.preferredLanguages, lang];
    onUpdatePreferences({
      ...preferences,
      preferredLanguages: next.length > 0 ? next : ['en'],
    });
  };

  const selectableCategories = CATEGORY_ITEMS.filter(
    (c): c is { id: NewsSectionSlug; label: string } =>
      c.id !== 'all' && c.id !== 'for-you'
  );

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Personalize News Feed"
    >
      <div className="flex h-full w-full max-w-md flex-col border-l border-stone-200 dark:border-stone-800 bg-[#FBF9F5] dark:bg-[#161513] text-stone-900 dark:text-stone-100 shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#9A3412] dark:text-amber-400" />
            <h2 className="font-serif text-xl font-semibold">Personalize Your Edition</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close personalization"
            className="rounded-md p-2 text-stone-500 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <p className="text-xs leading-relaxed text-stone-600 dark:text-stone-400">
            Customize your &ldquo;For You&rdquo; personalized feed across Indian regions,
            editorial categories, and regional languages. Saved automatically to this device.
          </p>

          {/* Categories */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Preferred Categories
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {selectableCategories.map((cat) => {
                const active = preferences.favoriteCategories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`flex items-center justify-between rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                      active
                        ? 'border-[#9A3412] bg-[#9A3412]/10 text-[#9A3412] dark:border-amber-500 dark:bg-amber-500/15 dark:text-amber-300'
                        : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:border-stone-300 dark:hover:border-stone-700'
                    }`}
                  >
                    <span className="truncate">{cat.label}</span>
                    {active && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Indian Regions */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Preferred Indian Regions
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {INDIA_REGIONS.filter((r) => r.id !== 'all').map((region) => {
                const active = preferences.favoriteRegions.includes(region.id);
                return (
                  <button
                    key={region.id}
                    type="button"
                    onClick={() => toggleRegion(region.id)}
                    className={`flex items-center justify-between rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                      active
                        ? 'border-[#9A3412] bg-[#9A3412]/10 text-[#9A3412] dark:border-amber-500 dark:bg-amber-500/15 dark:text-amber-300'
                        : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:border-stone-300 dark:hover:border-stone-700'
                    }`}
                  >
                    <span className="truncate">{region.label}</span>
                    {active && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Languages */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Preferred Languages
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {INDIAN_LANGUAGES.filter(
                (l): l is {
                  code: Exclude<IndianLanguageCode, 'all'>;
                  label: string;
                  nativeLabel: string;
                } => l.code !== 'all'
              ).map((lang) => {
                const active = preferences.preferredLanguages.includes(lang.code);
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => toggleLanguage(lang.code)}
                    className={`flex items-center justify-between rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                      active
                        ? 'border-[#9A3412] bg-[#9A3412]/10 text-[#9A3412] dark:border-amber-500 dark:bg-amber-500/15 dark:text-amber-300'
                        : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:border-stone-300 dark:hover:border-stone-700'
                    }`}
                  >
                    <span className="truncate">
                      {lang.label} · {lang.nativeLabel}
                    </span>
                    {active && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <div className="border-t border-stone-200 dark:border-stone-800 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-md bg-stone-900 dark:bg-stone-100 px-4 py-2.5 text-xs font-semibold text-white dark:text-stone-900 hover:opacity-90 transition-opacity"
          >
            Apply to For You Feed
          </button>
        </div>
      </div>
    </div>
  );
}

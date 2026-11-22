export type NewsCategory =
  | 'all'
  | 'for-you'
  | 'national'
  | 'state'
  | 'politics'
  | 'business'
  | 'economy'
  | 'technology'
  | 'sports'
  | 'education'
  | 'entertainment'
  | 'health'
  | 'world';

export type NewsSectionSlug = Exclude<NewsCategory, 'all' | 'for-you'>;

export type IndiaRegion =
  | 'all'
  | 'north'
  | 'south'
  | 'west'
  | 'east'
  | 'central'
  | 'northeast';

export type IndianLanguageCode =
  | 'all'
  | 'en'
  | 'hi'
  | 'ta'
  | 'te'
  | 'ml'
  | 'kn'
  | 'mr'
  | 'bn'
  | 'gu'
  | 'pa';

export interface LanguageOption {
  code: IndianLanguageCode;
  label: string;
  nativeLabel: string;
}

export const INDIAN_LANGUAGES: LanguageOption[] = [
  { code: 'all', label: 'All Languages', nativeLabel: 'All' },
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { code: 'ml', label: 'Malayalam', nativeLabel: 'മലയാളം' },
  { code: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা' },
  { code: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી' },
  { code: 'pa', label: 'Punjabi', nativeLabel: 'ਪੰਜਾਬੀ' },
];

export interface RegionMeta {
  id: IndiaRegion;
  label: string;
  statesSummary: string;
  states: string[];
}

export const INDIA_REGIONS: RegionMeta[] = [
  {
    id: 'all',
    label: 'All India',
    statesSummary: '28 States & 8 Union Territories',
    states: [],
  },
  {
    id: 'north',
    label: 'North India',
    statesSummary: 'Delhi NCR, Uttar Pradesh, Punjab, Haryana, Rajasthan, J&K, Ladakh, HP, Uttarakhand',
    states: [
      'Delhi NCR',
      'Uttar Pradesh',
      'Punjab',
      'Haryana',
      'Rajasthan',
      'Jammu & Kashmir',
      'Ladakh',
      'Himachal Pradesh',
      'Uttarakhand',
      'Chandigarh',
    ],
  },
  {
    id: 'south',
    label: 'South India',
    statesSummary: 'Karnataka, Tamil Nadu, Kerala, Telangana, Andhra Pradesh, Puducherry',
    states: [
      'Karnataka',
      'Tamil Nadu',
      'Kerala',
      'Telangana',
      'Andhra Pradesh',
      'Puducherry',
    ],
  },
  {
    id: 'west',
    label: 'West India',
    statesSummary: 'Maharashtra, Gujarat, Goa, Dadra & Nagar Haveli and Daman & Diu',
    states: ['Maharashtra', 'Gujarat', 'Goa'],
  },
  {
    id: 'east',
    label: 'East India',
    statesSummary: 'West Bengal, Odisha, Bihar, Jharkhand',
    states: ['West Bengal', 'Odisha', 'Bihar', 'Jharkhand'],
  },
  {
    id: 'central',
    label: 'Central India',
    statesSummary: 'Madhya Pradesh, Chhattisgarh',
    states: ['Madhya Pradesh', 'Chhattisgarh'],
  },
  {
    id: 'northeast',
    label: 'Northeast India',
    statesSummary: 'Assam, Meghalaya, Manipur, Nagaland, Arunachal Pradesh, Tripura, Mizoram, Sikkim',
    states: [
      'Assam',
      'Meghalaya',
      'Manipur',
      'Nagaland',
      'Arunachal Pradesh',
      'Tripura',
      'Mizoram',
      'Sikkim',
    ],
  },
];

export const CATEGORY_ITEMS: Array<{ id: NewsCategory; label: string }> = [
  { id: 'all', label: 'All News' },
  { id: 'for-you', label: 'For You' },
  { id: 'national', label: 'National' },
  { id: 'state', label: 'State News' },
  { id: 'politics', label: 'Politics' },
  { id: 'business', label: 'Business' },
  { id: 'economy', label: 'Economy' },
  { id: 'technology', label: 'Technology' },
  { id: 'sports', label: 'Sports' },
  { id: 'education', label: 'Education' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'health', label: 'Health' },
  { id: 'world', label: 'World News' },
];

export interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  link: string;
  sourceId: string;
  newspaper: string;
  category: NewsSectionSlug;
  region: IndiaRegion;
  stateLabel: string;
  language: Exclude<IndianLanguageCode, 'all'>;
  publishedAt: string;
  imageUrl?: string;
  isBreaking?: boolean;
}

export interface FeedSourceConfig {
  id: string;
  sourceId: string;
  newspaper: string;
  url: string;
  category: NewsSectionSlug;
  region: IndiaRegion;
  stateLabel: string;
  language: Exclude<IndianLanguageCode, 'all'>;
  enabled: boolean;
  licenseNote: string;
  lastFetchedAt: string | null;
  lastStatus: 'pending' | 'ok' | 'error';
  lastError?: string;
  articleCount: number;
}

export interface PushAlert {
  id: string;
  article: NewsArticle;
  receivedAt: string;
  reason: string;
  read: boolean;
}

export interface UserPreferences {
  favoriteCategories: NewsSectionSlug[];
  favoriteRegions: IndiaRegion[];
  favoriteStates: string[];
  preferredLanguages: Array<Exclude<IndianLanguageCode, 'all'>>;
  notificationsEnabled: boolean;
  browserPushEnabled: boolean;
}

export interface FeedStats {
  totalArticles: number;
  lastSyncedAt: string | null;
  activeSourcesCount: number;
  totalSourcesCount: number;
  byCategory: Record<NewsSectionSlug, number>;
  byRegion: Record<IndiaRegion, number>;
  byLanguage: Record<Exclude<IndianLanguageCode, 'all'>, number>;
}

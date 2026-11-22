import crypto from 'node:crypto';
import Parser from 'rss-parser';
import type {
  FeedSourceConfig,
  IndiaRegion,
  IndianLanguageCode,
  NewsArticle,
  NewsSectionSlug,
} from '../src/types/news.ts';

function seedSource(
  id: string,
  sourceId: string,
  newspaper: string,
  url: string,
  category: NewsSectionSlug,
  region: IndiaRegion,
  stateLabel: string,
  language: Exclude<IndianLanguageCode, 'all'>,
  licenseNote = 'Public Publisher RSS Syndication'
): FeedSourceConfig {
  return {
    id,
    sourceId,
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
}

export const INITIAL_FEED_SOURCES: FeedSourceConfig[] = [
  // National (English)
  seedSource(
    'hindu-national',
    'the-hindu',
    'The Hindu',
    'https://www.thehindu.com/news/national/feeder/default.rss',
    'national',
    'all',
    'All India',
    'en'
  ),
  seedSource(
    'ie-india',
    'indian-express',
    'The Indian Express',
    'https://indianexpress.com/section/india/feed/',
    'national',
    'all',
    'New Delhi',
    'en'
  ),
  seedSource(
    'toi-india',
    'times-of-india',
    'The Times of India',
    'https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms',
    'national',
    'all',
    'All India',
    'en'
  ),
  seedSource(
    'ht-india',
    'hindustan-times',
    'Hindustan Times',
    'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml',
    'national',
    'all',
    'New Delhi',
    'en'
  ),
  seedSource(
    'ndtv-india',
    'ndtv',
    'NDTV',
    'https://feeds.feedburner.com/ndtvnews-india-news',
    'national',
    'all',
    'New Delhi',
    'en'
  ),

  // Politics
  seedSource(
    'toi-politics',
    'times-of-india',
    'The Times of India',
    'https://news.google.com/rss/search?q=Indian+Express+OR+The+Hindu+Parliament+Politics+India&hl=en-IN&gl=IN&ceid=IN:en',
    'politics',
    'all',
    'Parliament / National',
    'en',
    'Google News Public RSS Index'
  ),
  seedSource(
    'gnews-politics',
    'the-hindu',
    'The Hindu',
    'https://news.google.com/rss/search?q=India+Parliament+Election+Politics&hl=en-IN&gl=IN&ceid=IN:en',
    'politics',
    'all',
    'New Delhi',
    'en',
    'Google News Public RSS Index'
  ),

  // Business & Economy
  seedSource(
    'et-economy',
    'economic-times',
    'The Economic Times',
    'https://economictimes.indiatimes.com/news/economy/rssfeeds/1373380680.cms',
    'economy',
    'west',
    'Mumbai / RBI',
    'en'
  ),
  seedSource(
    'mint-economy',
    'mint',
    'Mint (Livemint)',
    'https://www.livemint.com/rss/economy',
    'economy',
    'north',
    'New Delhi',
    'en'
  ),
  seedSource(
    'hindu-economy',
    'the-hindu',
    'The Hindu',
    'https://www.thehindu.com/business/Economy/feeder/default.rss',
    'economy',
    'south',
    'Chennai / Policy',
    'en'
  ),
  seedSource(
    'et-business',
    'economic-times',
    'The Economic Times',
    'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms',
    'business',
    'west',
    'Dalal Street',
    'en'
  ),
  seedSource(
    'mint-companies',
    'mint',
    'Mint (Livemint)',
    'https://www.livemint.com/rss/companies',
    'business',
    'all',
    'Corporate India',
    'en'
  ),
  seedSource(
    'toi-business',
    'times-of-india',
    'The Times of India',
    'https://timesofindia.indiatimes.com/rssfeeds/1898055.cms',
    'business',
    'west',
    'Mumbai',
    'en'
  ),

  // Technology
  seedSource(
    'hindu-tech',
    'the-hindu',
    'The Hindu',
    'https://www.thehindu.com/sci-tech/technology/feeder/default.rss',
    'technology',
    'south',
    'Bengaluru / Tech',
    'en'
  ),
  seedSource(
    'toi-tech',
    'times-of-india',
    'The Times of India',
    'https://timesofindia.indiatimes.com/rssfeeds/66949542.cms',
    'technology',
    'all',
    'India Tech',
    'en'
  ),
  seedSource(
    'et-tech',
    'economic-times',
    'The Economic Times',
    'https://economictimes.indiatimes.com/tech/rssfeeds/13357270.cms',
    'technology',
    'south',
    'Bengaluru / Startups',
    'en'
  ),
  seedSource(
    'mint-tech',
    'mint',
    'Mint (Livemint)',
    'https://www.livemint.com/rss/technology',
    'technology',
    'all',
    'Digital India',
    'en'
  ),

  // Sports
  seedSource(
    'hindu-sports',
    'the-hindu',
    'The Hindu',
    'https://www.thehindu.com/sport/feeder/default.rss',
    'sports',
    'all',
    'India Sports',
    'en'
  ),
  seedSource(
    'ndtv-sports',
    'ndtv',
    'NDTV',
    'https://feeds.feedburner.com/ndtvsports-latest',
    'sports',
    'all',
    'India Sports',
    'en'
  ),
  seedSource(
    'toi-sports',
    'times-of-india',
    'The Times of India',
    'https://timesofindia.indiatimes.com/rssfeeds/4719148.cms',
    'sports',
    'all',
    'Cricket & Athletics',
    'en'
  ),

  // Education, Entertainment, Health, World News
  seedSource(
    'toi-education',
    'times-of-india',
    'The Times of India',
    'https://timesofindia.indiatimes.com/rssfeeds/913168846.cms',
    'education',
    'all',
    'UGC / Exams / Campus',
    'en'
  ),
  seedSource(
    'ht-education',
    'hindustan-times',
    'Hindustan Times',
    'https://www.hindustantimes.com/feeds/rss/education/rssfeed.xml',
    'education',
    'all',
    'Universities & Policy',
    'en'
  ),
  seedSource(
    'toi-entertainment',
    'times-of-india',
    'The Times of India',
    'https://timesofindia.indiatimes.com/rssfeeds/1081479906.cms',
    'entertainment',
    'west',
    'Cinema & Culture',
    'en'
  ),
  seedSource(
    'ht-entertainment',
    'hindustan-times',
    'Hindustan Times',
    'https://www.hindustantimes.com/feeds/rss/entertainment/rssfeed.xml',
    'entertainment',
    'west',
    'Film & Arts',
    'en'
  ),
  seedSource(
    'hindu-health',
    'the-hindu',
    'The Hindu',
    'https://www.thehindu.com/sci-tech/health/feeder/default.rss',
    'health',
    'all',
    'Public Health & Medicine',
    'en'
  ),
  seedSource(
    'toi-health',
    'times-of-india',
    'The Times of India',
    'https://timesofindia.indiatimes.com/rssfeeds/3908999.cms',
    'health',
    'all',
    'Wellness & Healthcare',
    'en'
  ),
  seedSource(
    'hindu-world',
    'the-hindu',
    'The Hindu',
    'https://www.thehindu.com/news/international/feeder/default.rss',
    'world',
    'all',
    'International Desk',
    'en'
  ),
  seedSource(
    'toi-world',
    'times-of-india',
    'The Times of India',
    'https://timesofindia.indiatimes.com/rssfeeds/296589292.cms',
    'world',
    'all',
    'Global Affairs',
    'en'
  ),

  // State News across ALL Indian Regions
  seedSource(
    'ht-delhi',
    'hindustan-times',
    'Hindustan Times',
    'https://www.hindustantimes.com/feeds/rss/cities/delhi-news/rssfeed.xml',
    'state',
    'north',
    'Delhi NCR',
    'en'
  ),
  seedSource(
    'ht-lucknow',
    'hindustan-times',
    'Hindustan Times',
    'https://www.hindustantimes.com/feeds/rss/cities/lucknow-news/rssfeed.xml',
    'state',
    'north',
    'Uttar Pradesh',
    'en'
  ),
  seedSource(
    'ht-jaipur',
    'hindustan-times',
    'Hindustan Times',
    'https://www.hindustantimes.com/feeds/rss/cities/jaipur-news/rssfeed.xml',
    'state',
    'north',
    'Rajasthan',
    'en'
  ),
  seedSource(
    'tribune-punjab',
    'tribune-india',
    'The Tribune',
    'https://www.tribuneindia.com/rss/feed?catId=14',
    'state',
    'north',
    'Punjab',
    'en'
  ),
  seedSource(
    'gnews-jk-himachal',
    'indian-express',
    'The Indian Express',
    'https://news.google.com/rss/search?q=Jammu+Kashmir+Himachal+Uttarakhand+Ladakh+news&hl=en-IN&gl=IN&ceid=IN:en',
    'state',
    'north',
    'J&K / Himachal / Uttarakhand',
    'en',
    'Google News Public RSS Index'
  ),
  seedSource(
    'hindu-tn',
    'the-hindu',
    'The Hindu',
    'https://www.thehindu.com/news/national/tamil-nadu/feeder/default.rss',
    'state',
    'south',
    'Tamil Nadu',
    'en'
  ),
  seedSource(
    'hindu-karnataka',
    'the-hindu',
    'The Hindu',
    'https://www.thehindu.com/news/national/karnataka/feeder/default.rss',
    'state',
    'south',
    'Karnataka',
    'en'
  ),
  seedSource(
    'hindu-kerala',
    'the-hindu',
    'The Hindu',
    'https://www.thehindu.com/news/national/kerala/feeder/default.rss',
    'state',
    'south',
    'Kerala',
    'en'
  ),
  seedSource(
    'hindu-telangana',
    'the-hindu',
    'The Hindu',
    'https://www.thehindu.com/news/national/telangana/feeder/default.rss',
    'state',
    'south',
    'Telangana',
    'en'
  ),
  seedSource(
    'hindu-ap',
    'the-hindu',
    'The Hindu',
    'https://www.thehindu.com/news/national/andhra-pradesh/feeder/default.rss',
    'state',
    'south',
    'Andhra Pradesh',
    'en'
  ),
  seedSource(
    'toi-maharashtra',
    'times-of-india',
    'The Times of India',
    'https://timesofindia.indiatimes.com/rssfeeds/-2128838597.cms',
    'state',
    'west',
    'Maharashtra',
    'en'
  ),
  seedSource(
    'toi-gujarat',
    'times-of-india',
    'The Times of India',
    'https://timesofindia.indiatimes.com/rssfeeds/-2128821153.cms',
    'state',
    'west',
    'Gujarat',
    'en'
  ),
  seedSource(
    'gnews-goa',
    'times-of-india',
    'The Times of India',
    'https://news.google.com/rss/search?q=Goa+news+Panaji&hl=en-IN&gl=IN&ceid=IN:en',
    'state',
    'west',
    'Goa',
    'en',
    'Google News Public RSS Index'
  ),
  seedSource(
    'toi-bengal',
    'times-of-india',
    'The Times of India',
    'https://timesofindia.indiatimes.com/rssfeeds/-2128830821.cms',
    'state',
    'east',
    'West Bengal',
    'en'
  ),
  seedSource(
    'ht-patna',
    'hindustan-times',
    'Hindustan Times',
    'https://www.hindustantimes.com/feeds/rss/cities/patna-news/rssfeed.xml',
    'state',
    'east',
    'Bihar',
    'en'
  ),
  seedSource(
    'gnews-odisha-jharkhand',
    'the-hindu',
    'The Hindu',
    'https://news.google.com/rss/search?q=Odisha+Jharkhand+Bhubaneswar+Ranchi+news&hl=en-IN&gl=IN&ceid=IN:en',
    'state',
    'east',
    'Odisha & Jharkhand',
    'en',
    'Google News Public RSS Index'
  ),
  seedSource(
    'ht-bhopal',
    'hindustan-times',
    'Hindustan Times',
    'https://www.hindustantimes.com/feeds/rss/cities/bhopal-news/rssfeed.xml',
    'state',
    'central',
    'Madhya Pradesh',
    'en'
  ),
  seedSource(
    'gnews-chhattisgarh',
    'central-chronicle',
    'Central Wire',
    'https://news.google.com/rss/search?q=Chhattisgarh+Raipur+Madhya+Pradesh+news&hl=en-IN&gl=IN&ceid=IN:en',
    'state',
    'central',
    'Chhattisgarh & MP',
    'en',
    'Google News Public RSS Index'
  ),
  seedSource(
    'assam-tribune',
    'assam-tribune',
    'The Assam Tribune',
    'https://assamtribune.com/feed',
    'state',
    'northeast',
    'Assam',
    'en'
  ),
  seedSource(
    'gnews-northeast',
    'assam-tribune',
    'Northeast Wire',
    'https://news.google.com/rss/search?q=Manipur+Meghalaya+Nagaland+Arunachal+Tripura+Mizoram+Sikkim+news&hl=en-IN&gl=IN&ceid=IN:en',
    'state',
    'northeast',
    'Northeast States',
    'en',
    'Google News Public RSS Index'
  ),

  // Regional Indian Language Editions (Public Official RSS Feeds)
  seedSource(
    'bbc-hindi',
    'bbc-hindi',
    'BBC News हिन्दी',
    'https://feeds.bbci.co.uk/hindi/rss.xml',
    'national',
    'north',
    'हिन्दी संस्करण',
    'hi'
  ),
  seedSource(
    'gnews-hindi',
    'dainik-bhaskar',
    'हिन्दी समाचार (Google News IN)',
    'https://news.google.com/rss?hl=hi&gl=IN&ceid=IN:hi',
    'national',
    'north',
    'हिन्दी भारत',
    'hi',
    'Google News Public RSS Index'
  ),
  seedSource(
    'gnews-tamil',
    'hindu-tamil',
    'தமிழ் செய்திகள் (Google News IN)',
    'https://news.google.com/rss?hl=ta&gl=IN&ceid=IN:ta',
    'state',
    'south',
    'Tamil Nadu',
    'ta',
    'Google News Public RSS Index'
  ),
  seedSource(
    'gnews-telugu',
    'eenadu',
    'తెలుగు వార్తలు (Google News IN)',
    'https://news.google.com/rss?hl=te&gl=IN&ceid=IN:te',
    'state',
    'south',
    'Telangana & Andhra Pradesh',
    'te',
    'Google News Public RSS Index'
  ),
  seedSource(
    'gnews-malayalam',
    'manorama',
    'മലയാളം വാർത്തകൾ (Google News IN)',
    'https://news.google.com/rss?hl=ml&gl=IN&ceid=IN:ml',
    'state',
    'south',
    'Kerala',
    'ml',
    'Google News Public RSS Index'
  ),
  seedSource(
    'gnews-kannada',
    'prajavani',
    'ಕನ್ನಡ ಸುದ್ದಿ (OneIndia Kannada)',
    'https://kannada.oneindia.com/rss/feeds/kannada-news-fb.xml',
    'state',
    'south',
    'Karnataka',
    'kn',
    'Public Publisher RSS Syndication'
  ),
  seedSource(
    'gnews-marathi',
    'loksatta',
    'मराठी बातम्या (Google News IN)',
    'https://news.google.com/rss?hl=mr&gl=IN&ceid=IN:mr',
    'state',
    'west',
    'Maharashtra',
    'mr',
    'Google News Public RSS Index'
  ),
  seedSource(
    'gnews-bengali',
    'anandabazar',
    'বাংলা সংবাদ (Google News IN)',
    'https://news.google.com/rss?hl=bn&gl=IN&ceid=IN:bn',
    'state',
    'east',
    'West Bengal',
    'bn',
    'Google News Public RSS Index'
  ),
  seedSource(
    'gnews-gujarati',
    'divya-bhaskar',
    'ગુજરાતી સમાચાર (Google News IN)',
    'https://news.google.com/rss?hl=gu&gl=IN&ceid=IN:gu',
    'state',
    'west',
    'Gujarat',
    'gu',
    'Google News Public RSS Index'
  ),
  seedSource(
    'gnews-punjabi',
    'ajit-jalandhar',
    'ਪੰਜਾਬੀ ਖ਼ਬਰਾਂ (Google News IN)',
    'https://news.google.com/rss?hl=pa&gl=IN&ceid=IN:pa',
    'state',
    'north',
    'Punjab',
    'pa',
    'Google News Public RSS Index'
  ),
];

const parser = new Parser({
  timeout: 7500,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (compatible; BharatChronicleAggregator/1.0; +https://bharatchronicle.in)',
    Accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
  },
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: true }],
      ['media:thumbnail', 'mediaThumbnail', { keepArray: true }],
      ['content:encoded', 'contentEncoded'],
    ],
  },
});

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, ' ')
    .trim();
}

function extractImageUrl(item: Record<string, unknown>): string | undefined {
  const enclosure = item.enclosure as { url?: string; type?: string } | undefined;
  if (enclosure?.url && (!enclosure.type || enclosure.type.startsWith('image/'))) {
    return enclosure.url;
  }

  const mediaContent = item.mediaContent as Array<{ $?: { url?: string } }> | undefined;
  if (Array.isArray(mediaContent)) {
    for (const mc of mediaContent) {
      if (mc?.$?.url && !mc.$.url.includes('pixel') && !mc.$.url.includes('1x1')) {
        return mc.$.url;
      }
    }
  }

  const mediaThumb = item.mediaThumbnail as Array<{ $?: { url?: string } }> | undefined;
  if (Array.isArray(mediaThumb)) {
    for (const mt of mediaThumb) {
      if (mt?.$?.url) {
        return mt.$.url;
      }
    }
  }

  const html =
    (typeof item.contentEncoded === 'string' && item.contentEncoded) ||
    (typeof item.content === 'string' && item.content) ||
    (typeof item.description === 'string' && item.description) ||
    '';

  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch && imgMatch[1] && imgMatch[1].startsWith('http')) {
    const src = imgMatch[1];
    if (!src.includes('doubleclick') && !src.includes('scorecardresearch')) {
      return src;
    }
  }

  return undefined;
}

function inferStateFromText(title: string, fallbackState: string): string {
  const lower = title.toLowerCase();
  const stateMap: Array<[string, string]> = [
    ['bengaluru', 'Karnataka'],
    ['karnataka', 'Karnataka'],
    ['chennai', 'Tamil Nadu'],
    ['tamil nadu', 'Tamil Nadu'],
    ['kerala', 'Kerala'],
    ['kochi', 'Kerala'],
    ['hyderabad', 'Telangana'],
    ['telangana', 'Telangana'],
    ['andhra', 'Andhra Pradesh'],
    ['mumbai', 'Maharashtra'],
    ['pune', 'Maharashtra'],
    ['maharashtra', 'Maharashtra'],
    ['ahmedabad', 'Gujarat'],
    ['gujarat', 'Gujarat'],
    ['goa', 'Goa'],
    ['kolkata', 'West Bengal'],
    ['west bengal', 'West Bengal'],
    ['odisha', 'Odisha'],
    ['bhubaneswar', 'Odisha'],
    ['patna', 'Bihar'],
    ['bihar', 'Bihar'],
    ['jharkhand', 'Jharkhand'],
    ['ranchi', 'Jharkhand'],
    ['bhopal', 'Madhya Pradesh'],
    ['indore', 'Madhya Pradesh'],
    ['madhya pradesh', 'Madhya Pradesh'],
    ['chhattisgarh', 'Chhattisgarh'],
    ['raipur', 'Chhattisgarh'],
    ['guwahati', 'Assam'],
    ['assam', 'Assam'],
    ['manipur', 'Manipur'],
    ['meghalaya', 'Meghalaya'],
    ['nagaland', 'Nagaland'],
    ['arunachal', 'Arunachal Pradesh'],
    ['tripura', 'Tripura'],
    ['mizoram', 'Mizoram'],
    ['sikkim', 'Sikkim'],
    ['delhi', 'Delhi NCR'],
    ['punjab', 'Punjab'],
    ['haryana', 'Haryana'],
    ['lucknow', 'Uttar Pradesh'],
    ['uttar pradesh', 'Uttar Pradesh'],
    ['jaipur', 'Rajasthan'],
    ['rajasthan', 'Rajasthan'],
    ['kashmir', 'Jammu & Kashmir'],
    ['ladakh', 'Ladakh'],
    ['himachal', 'Himachal Pradesh'],
    ['uttarakhand', 'Uttarakhand'],
  ];

  for (const [needle, label] of stateMap) {
    if (lower.includes(needle)) return label;
  }
  return fallbackState;
}

function resolveGooglePublisher(
  rawTitle: string,
  sourceField: unknown,
  fallbackNewspaper: string
): { cleanTitle: string; newspaper: string } {
  const sourceTitle =
    typeof sourceField === 'string'
      ? sourceField
      : typeof sourceField === 'object' && sourceField !== null && '_' in sourceField
        ? String((sourceField as { _: unknown })._)
        : '';

  const splitIdx = rawTitle.lastIndexOf(' - ');
  let cleanTitle = rawTitle;
  let detectedPaper = sourceTitle;

  if (splitIdx > 12) {
    const candidatePaper = rawTitle.slice(splitIdx + 3).trim();
    if (candidatePaper.length > 1 && candidatePaper.length < 56) {
      cleanTitle = rawTitle.slice(0, splitIdx).trim();
      if (!detectedPaper) detectedPaper = candidatePaper;
    }
  }

  return {
    cleanTitle,
    newspaper: detectedPaper || fallbackNewspaper,
  };
}

function buildLegalExcerpt(rawSnippet: string, title: string, newspaper: string): string {
  const cleaned = decodeHtmlEntities(rawSnippet);
  if (!cleaned || cleaned.toLowerCase() === title.toLowerCase()) {
    return `Brief summary indexed via ${newspaper} RSS syndication. Visit the original publisher to read the full story.`;
  }
  // Strictly cap excerpt length so full copyrighted article text is never stored or republished
  if (cleaned.length <= 190) return cleaned;
  const sliced = cleaned.slice(0, 187);
  const lastSpace = sliced.lastIndexOf(' ');
  return `${lastSpace > 120 ? sliced.slice(0, lastSpace) : sliced}...`;
}

function createStableId(link: string, title: string): string {
  return crypto
    .createHash('sha1')
    .update(`${link.split('?')[0]}|${title.toLowerCase().trim()}`)
    .digest('hex')
    .slice(0, 16);
}

export async function fetchFromSources(
  sources: FeedSourceConfig[]
): Promise<{ articles: NewsArticle[]; updatedSources: FeedSourceConfig[] }> {
  const updatedSources = sources.map((s) => ({ ...s }));
  const enabledIndices = updatedSources
    .map((s, idx) => (s.enabled ? idx : -1))
    .filter((idx) => idx !== -1);

  const deduped = new Map<string, NewsArticle>();
  const seenTitles = new Set<string>();

  const BATCH_SIZE = 16;
  for (let start = 0; start < enabledIndices.length; start += BATCH_SIZE) {
    const batch = enabledIndices.slice(start, start + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (sourceIndex) => {
        const source = updatedSources[sourceIndex];
        const feed = await parser.parseURL(source.url);
        const articles: NewsArticle[] = [];

        for (const rawItem of (feed.items ?? []).slice(0, 8)) {
          const rawTitle = decodeHtmlEntities(rawItem.title || '');
          const link = (rawItem.link || '').trim();
          if (!rawTitle || !link || rawTitle.length < 10) continue;

          const isGoogleSyndicated = source.url.includes('news.google.com');
          const resolved = isGoogleSyndicated
            ? resolveGooglePublisher(
                rawTitle,
                (rawItem as unknown as Record<string, unknown>).source,
                source.newspaper
              )
            : {
                cleanTitle: rawTitle,
                newspaper: source.newspaper,
              };

          const rawSnippet =
            rawItem.contentSnippet ||
            (rawItem as unknown as { summary?: string }).summary ||
            rawItem.content ||
            '';

          const excerpt = buildLegalExcerpt(rawSnippet, resolved.cleanTitle, resolved.newspaper);
          const publishedDate = rawItem.isoDate || rawItem.pubDate;
          const parsedTime = publishedDate ? new Date(publishedDate).getTime() : Date.now();
          const safeTime = Number.isNaN(parsedTime) ? Date.now() : parsedTime;

          articles.push({
            id: createStableId(link, resolved.cleanTitle),
            title: resolved.cleanTitle,
            excerpt,
            link,
            sourceId: source.sourceId,
            newspaper: resolved.newspaper,
            category: source.category,
            region: source.region,
            stateLabel:
              source.language === 'en'
                ? inferStateFromText(resolved.cleanTitle, source.stateLabel)
                : source.stateLabel,
            language: source.language,
            publishedAt: new Date(safeTime).toISOString(),
            imageUrl: extractImageUrl(rawItem as unknown as Record<string, unknown>),
            isBreaking: Date.now() - safeTime < 1000 * 60 * 90,
          });
        }

        updatedSources[sourceIndex].lastFetchedAt = new Date().toISOString();
        updatedSources[sourceIndex].lastStatus = 'ok';
        updatedSources[sourceIndex].lastError = undefined;
        updatedSources[sourceIndex].articleCount = articles.length;

        return articles;
      })
    );

    results.forEach((res, i) => {
      const sourceIndex = batch[i];
      if (res.status !== 'fulfilled') {
        updatedSources[sourceIndex].lastFetchedAt = new Date().toISOString();
        updatedSources[sourceIndex].lastStatus = 'error';
        updatedSources[sourceIndex].lastError =
          res.reason instanceof Error ? res.reason.message : 'Feed timeout or unreachable';
        updatedSources[sourceIndex].articleCount = 0;
        return;
      }

      for (const article of res.value) {
        const normalizedTitle = article.title
          .toLowerCase()
          .replace(/[^\p{L}\p{N}\s]/gu, '')
          .slice(0, 72);
        if (deduped.has(article.id) || (normalizedTitle.length > 10 && seenTitles.has(normalizedTitle))) {
          continue;
        }
        if (normalizedTitle.length > 10) seenTitles.add(normalizedTitle);
        deduped.set(article.id, article);
      }
    });
  }

  const sorted = Array.from(deduped.values()).sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return { articles: sorted, updatedSources };
}

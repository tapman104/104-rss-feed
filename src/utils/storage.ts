import { Feed, Article, Category, AppSettings } from "../types";
import { DEFAULT_CATEGORIES, DEFAULT_FEEDS } from "./initialData";

const STORAGE_KEYS = {
  FEEDS: "material_rss_feeds",
  CATEGORIES: "material_rss_categories",
  SETTINGS: "material_rss_settings",
  BOOKMARKS: "material_rss_bookmarks",
  READ_ARTICLES: "material_rss_read_list",
  CACHED_ARTICLES: "material_rss_cached_articles",
};

export function getLocalSettings(): AppSettings {
  const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (_) {}
  }
  return {
    darkMode: true,
    autoRefreshMinutes: 15,
    fontSize: "base",
    fontSerif: false,
    layoutMode: "grid",
    showReadArticles: true,
  };
}

export function saveLocalSettings(settings: AppSettings) {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

export function getLocalCategories(): Category[] {
  const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (_) {}
  }
  return DEFAULT_CATEGORIES;
}

export function saveLocalCategories(categories: Category[]) {
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
}

export function getLocalFeeds(): Feed[] {
  const data = localStorage.getItem(STORAGE_KEYS.FEEDS);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (_) {}
  }
  return DEFAULT_FEEDS;
}

export function saveLocalFeeds(feeds: Feed[]) {
  localStorage.setItem(STORAGE_KEYS.FEEDS, JSON.stringify(feeds));
}

export function getBookmarkedIds(): string[] {
  const data = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
  return data ? JSON.parse(data) : [];
}

export function saveBookmarkedIds(ids: string[]) {
  localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(ids));
}

export function getReadIds(): string[] {
  const data = localStorage.getItem(STORAGE_KEYS.READ_ARTICLES);
  return data ? JSON.parse(data) : [];
}

export function saveReadIds(ids: string[]) {
  localStorage.setItem(STORAGE_KEYS.READ_ARTICLES, JSON.stringify(ids));
}

export function getCachedArticles(): Article[] {
  const data = localStorage.getItem(STORAGE_KEYS.CACHED_ARTICLES);
  if (data) {
    try {
      const articles: Article[] = JSON.parse(data);
      const bookmarked = new Set(getBookmarkedIds());
      const read = new Set(getReadIds());
      
      // Map states back dynamically
      return articles.map(art => ({
        ...art,
        isBookmarked: bookmarked.has(art.id),
        isRead: read.has(art.id)
      }));
    } catch (_) {}
  }
  return [];
}

export function saveCachedArticles(articles: Article[]) {
  // Store only raw fields to save space, keeping states clean
  const stripped = articles.map(({ isRead, isBookmarked, ...rest }) => rest);
  localStorage.setItem(STORAGE_KEYS.CACHED_ARTICLES, JSON.stringify(stripped.slice(0, 500))); // Limit cache to 500 articles
}

/**
 * Merges freshly parsed feed articles into the local cached history.
 * Combines new articles, cleans duplicates, retains Read/Bookmark flags,
 * and maintains chronological order.
 */
export function mergeArticles(
  existingArticles: Article[],
  newArticles: Article[],
  feedId: string,
  feedTitle: string,
  readIds: Set<string>,
  bookmarkedIds: Set<string>
): Article[] {
  const newProcessed = newArticles.map(art => ({
    ...art,
    feedId,
    feedTitle,
    isRead: readIds.has(art.id),
    isBookmarked: bookmarkedIds.has(art.id)
  }));

  // Map to deduplicate by id
  const map = new Map<string, Article>();
  
  // Load existing articles first
  existingArticles.forEach(art => map.set(art.id, art));
  
  // Overwrite or append with new ones
  newProcessed.forEach(art => {
    const existing = map.get(art.id);
    if (existing) {
      // Keep Read and Bookmark flags from client state
      map.set(art.id, {
        ...art,
        isRead: existing.isRead,
        isBookmarked: existing.isBookmarked
      });
    } else {
      map.set(art.id, art);
    }
  });

  // Sort chronologically (newest first)
  return Array.from(map.values()).sort((a, b) => {
    return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
  });
}

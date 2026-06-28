export interface Feed {
  id: string;
  title: string;
  url: string;
  category: string; // The category name or ID
  description: string;
  link: string;
  isActive: boolean;
  lastUpdated?: string;
  logoUrl?: string | null;
}

export interface Article {
  id: string;
  feedId: string;
  feedTitle: string;
  title: string;
  link: string;
  pubDate: string;
  creator: string;
  content: string;
  snippet: string;
  imageUrl: string | null;
  categories: string[];
  isRead: boolean;
  isBookmarked: boolean;
}

export interface Category {
  id: string;
  name: string;
  iconName: string; // Lucide icon name string
  color?: string; // Hex or tailwind color class
}

export interface AppSettings {
  darkMode: boolean;
  autoRefreshMinutes: number; // 0 for manual
  fontSize: "sm" | "base" | "lg" | "xl"; // MD3 scale
  fontSerif: boolean; // serif vs sans-serif for article text
  layoutMode: "grid" | "list" | "split"; // MD3 list, bento grid, or multi-panel split
  showReadArticles: boolean;
}

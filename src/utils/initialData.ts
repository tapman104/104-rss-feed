import { Feed, Category } from "../types";

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "all", name: "All Feeds", iconName: "Layers", color: "bg-primary text-primary-foreground" },
  { id: "bookmarks", name: "Bookmarks", iconName: "Bookmark", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  { id: "tech", name: "Tech & Science", iconName: "Cpu", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
  { id: "news", name: "News & Culture", iconName: "Globe", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  { id: "design", name: "Design & Dev", iconName: "Palette", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300" },
  { id: "life", name: "Life & Health", iconName: "Heart", color: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300" },
];

export const DEFAULT_FEEDS: Feed[] = [
  {
    id: "techcrunch",
    title: "TechCrunch",
    url: "https://techcrunch.com/feed/",
    category: "tech",
    description: "Startup and technology news.",
    link: "https://techcrunch.com",
    isActive: true,
  },
  {
    id: "wired",
    title: "Wired",
    url: "https://www.wired.com/feed/rss",
    category: "tech",
    description: "Technology, science, and culture news.",
    link: "https://wired.com",
    isActive: true,
  },
  {
    id: "smashing",
    title: "Smashing Magazine",
    url: "https://www.smashingmagazine.com/feed/",
    category: "design",
    description: "Web development and design articles.",
    link: "https://www.smashingmagazine.com",
    isActive: true,
  },
  {
    id: "bbc",
    title: "BBC News",
    url: "https://feeds.bbci.co.uk/news/rss.xml",
    category: "news",
    description: "International news coverage from the BBC.",
    link: "https://www.bbc.com/news",
    isActive: true,
  },
];

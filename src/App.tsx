import React, { useState, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Search, RotateCw, CheckCheck, WifiOff, AlertTriangle, Plus, LayoutGrid, LayoutList, Layers, Bookmark, Rss, Info, Check, Sparkles, ArrowUpDown, ChevronDown, ArrowDownWideNarrow, ArrowUpWideNarrow, TrendingUp } from "lucide-react";
import { Feed, Article, Category, AppSettings } from "./types";
import {
  getLocalSettings,
  saveLocalSettings,
  getLocalCategories,
  saveLocalCategories,
  getLocalFeeds,
  saveLocalFeeds,
  getBookmarkedIds,
  saveBookmarkedIds,
  getReadIds,
  saveReadIds,
  getCachedArticles,
  saveCachedArticles,
  mergeArticles,
} from "./utils/storage";

// Components
import Sidebar, { renderIcon } from "./components/Sidebar";
import ArticleCard from "./components/ArticleCard";
import ArticleReader from "./components/ArticleReader";
import AddFeedDialog from "./components/AddFeedDialog";
import FeedManager from "./components/FeedManager";
import SettingsPanel from "./components/SettingsPanel";

export default function App() {
  // --- CORE STATE ---
  const [feeds, setFeeds] = useState<Feed[]>(() => getLocalFeeds());
  const [categories, setCategories] = useState<Category[]>(() => getLocalCategories());
  const [settings, setSettings] = useState<AppSettings>(() => getLocalSettings());
  const [articles, setArticles] = useState<Article[]>(() => getCachedArticles());

  // Reading States
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set(getReadIds()));
  const [bookmarkIds, setBookmarkIds] = useState<Set<string>>(() => new Set(getBookmarkedIds()));

  // Navigation / UI States
  const [currentSection, setCurrentSection] = useState<"feed" | "manage" | "settings">("feed");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isAddFeedOpen, setIsAddFeedOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "popular">("newest");
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  // Floating Toast Notifications state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    // Dismiss after 4 seconds
    setTimeout(() => {
      setToast(prev => prev && prev.message === message ? null : prev);
    }, 4000);
  };

  // --- ONLINE MONITORING ---
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast("Connection re-established. Syncing feeds...", "success");
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast("Internet connection lost. Switched to Offline Cache.", "info");
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // --- DARK MODE EFFECT ---
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settings.darkMode]);

  // --- PERSISTENCE SYNCHRONIZERS ---
  useEffect(() => {
    saveLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveLocalFeeds(feeds);
  }, [feeds]);

  useEffect(() => {
    saveLocalCategories(categories);
  }, [categories]);

  useEffect(() => {
    saveCachedArticles(articles);
  }, [articles]);

  useEffect(() => {
    saveReadIds(Array.from(readIds));
  }, [readIds]);

  useEffect(() => {
    saveBookmarkedIds(Array.from(bookmarkIds));
  }, [bookmarkIds]);

  // --- REFRESH / SYNC ROUTINES ---
  const handleRefresh = async (force = false) => {
    if (!isOnline) {
      showToast("Cannot refresh. You are currently offline.", "error");
      return;
    }
    
    const activeFeeds = feeds.filter(f => f.isActive);
    if (activeFeeds.length === 0) {
      showToast("No active feeds. Go to 'Manage Feeds' to activate some.", "info");
      return;
    }

    setIsLoading(true);
    let successCount = 0;
    let failedCount = 0;
    let updatedArticlesList = [...articles];

    // Read/bookmark maps for merge reference
    const currentRead = readIds;
    const currentBookmarks = bookmarkIds;

    // Fetch and parse active feeds concurrently
    await Promise.all(
      activeFeeds.map(async (feed) => {
        try {
          const res = await fetch(`/api/rss/parse?url=${encodeURIComponent(feed.url)}`);
          if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
          
          const data = await res.json();
          const parsedArticles: Article[] = data.items || [];

          updatedArticlesList = mergeArticles(
            updatedArticlesList,
            parsedArticles,
            feed.id,
            feed.title,
            currentRead,
            currentBookmarks
          );

          // Update feed last updated timestamp
          setFeeds(prevFeeds =>
            prevFeeds.map(f =>
              f.id === feed.id ? { ...f, lastUpdated: new Date().toISOString() } : f
            )
          );
          successCount++;
        } catch (err) {
          console.error(`Failed to refresh feed: ${feed.title}`, err);
          failedCount++;
        }
      })
    );

    setArticles(updatedArticlesList);
    setIsLoading(false);

    if (failedCount === 0) {
      showToast(`Successfully parsed and synced ${successCount} feeds!`, "success");
    } else {
      showToast(
        `Synced ${successCount} feeds. ${failedCount} feeds failed. Verify feed URLs.`,
        "info"
      );
    }
  };

  // --- BACKGROUND AUTO REFRESH TIMER ---
  useEffect(() => {
    if (settings.autoRefreshMinutes === 0) return;

    const interval = setInterval(() => {
      handleRefresh(false);
    }, settings.autoRefreshMinutes * 60 * 1000);

    return () => clearInterval(interval);
  }, [settings.autoRefreshMinutes, feeds, isOnline]);

  // Run on initial load to fetch feeds if cached articles are empty
  useEffect(() => {
    if (articles.length === 0 && feeds.length > 0 && isOnline) {
      handleRefresh(true);
    }
  }, []);

  // --- ARTIFACT DISPATCHERS ---

  // Add a brand-new customized RSS feed URL
  const handleAddFeed = async (url: string, customTitle: string, category: string): Promise<boolean> => {
    // Prevent duplicate feeds
    if (feeds.some(f => f.url.toLowerCase() === url.toLowerCase())) {
      showToast("Already subscribed to this feed URL.", "error");
      return false;
    }

    const newId = customTitle.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Math.random().toString(36).substring(2, 6);
    
    const newFeed: Feed = {
      id: newId,
      title: customTitle,
      url: url,
      category: category,
      description: "Custom user-subscribed feed",
      link: new URL(url).origin,
      isActive: true,
    };

    setFeeds(prev => [...prev, newFeed]);
    showToast(`Subscribed to '${customTitle}'!`, "success");

    // Instantly refresh the newly added feed to pull content
    setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/rss/parse?url=${encodeURIComponent(url)}`);
        if (res.ok) {
          const data = await res.json();
          const parsed: Article[] = data.items || [];
          setArticles(prev =>
            mergeArticles(prev, parsed, newFeed.id, newFeed.title, readIds, bookmarkIds)
          );
          showToast(`Successfully pulled articles for '${customTitle}'!`, "success");
        }
      } catch (err) {
        showToast(`Could not fetch items from '${customTitle}' right now. Added anyway.`, "info");
      } finally {
        setIsLoading(false);
      }
    }, 100);

    return true;
  };

  // Edit fields of existing subscription inline
  const handleUpdateFeed = (feedId: string, updatedFields: Partial<Feed>) => {
    setFeeds(prev => prev.map(f => f.id === feedId ? { ...f, ...updatedFields } : f));
    showToast("Feed configurations updated successfully.", "success");
  };

  // Toggle Feed activation state
  const handleToggleFeedActive = (feedId: string) => {
    setFeeds(prev =>
      prev.map(f => {
        if (f.id === feedId) {
          const nextState = !f.isActive;
          showToast(
            nextState ? `Muted state cleared. Feed activated.` : `Feed muted. Articles hidden from Stream.`,
            "info"
          );
          return { ...f, isActive: nextState };
        }
        return f;
      })
    );
  };

  // Delete feed entirely
  const handleDeleteFeed = (feedId: string) => {
    const deletedFeed = feeds.find(f => f.id === feedId);
    setFeeds(prev => prev.filter(f => f.id !== feedId));
    // Also strip deleted feed articles from cached stream
    setArticles(prev => prev.filter(art => art.feedId !== feedId));
    
    showToast(`Unsubscribed from '${deletedFeed?.title || "feed"}'!`, "success");
  };

  // --- CATEGORY DISPATCHERS ---

  const handleAddCategory = (name: string, iconName: string, color?: string) => {
    const newId = name.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Math.random().toString(36).substring(2, 6);
    const newCat: Category = {
      id: newId,
      name,
      iconName,
      color: color || "bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-300"
    };
    setCategories(prev => [...prev, newCat]);
    showToast(`Category '${name}' created!`, "success");
  };

  const handleUpdateCategory = (categoryId: string, name: string, iconName: string, color?: string) => {
    setCategories(prev => prev.map(cat => cat.id === categoryId ? { ...cat, name, iconName, color } : cat));
    showToast(`Category details updated.`, "success");
  };

  const handleDeleteCategory = (categoryId: string) => {
    // Check if any feed is in this category
    const assignable = categories.filter(c => c.id !== "all" && c.id !== "bookmarks" && c.id !== categoryId);
    const fallbackId = assignable.length > 0 ? assignable[0].id : "tech";

    // Move associated feeds to fallback category
    setFeeds(prevFeeds => prevFeeds.map(f => f.category === categoryId ? { ...f, category: fallbackId } : f));
    
    // Remove category
    setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    showToast(`Category deleted. Associated feeds reassigned.`, "info");
    
    if (selectedCategory === categoryId) {
      setSelectedCategory("all");
    }
  };

  // --- INTERACTION DISPATCHERS ---

  const handleSelectArticle = (art: Article) => {
    setSelectedArticle(art);
    // Mark as read instantly
    if (!readIds.has(art.id)) {
      const nextRead = new Set(readIds);
      nextRead.add(art.id);
      setReadIds(nextRead);
      setArticles(prev =>
        prev.map(a => (a.id === art.id ? { ...a, isRead: true } : a))
      );
    }
  };

  const handleToggleBookmarkState = (art: Article, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextBookmarks = new Set(bookmarkIds);
    let bookmarked = false;

    if (nextBookmarks.has(art.id)) {
      nextBookmarks.delete(art.id);
      bookmarked = false;
      showToast("Removed from bookmarks.", "info");
    } else {
      nextBookmarks.add(art.id);
      bookmarked = true;
      showToast("Article saved to bookmarks!", "success");
    }

    setBookmarkIds(nextBookmarks);
    setArticles(prev =>
      prev.map(a => (a.id === art.id ? { ...a, isBookmarked: bookmarked } : a))
    );
    if (selectedArticle && selectedArticle.id === art.id) {
      setSelectedArticle(prev => prev ? { ...prev, isBookmarked: bookmarked } : null);
    }
  };

  const handleToggleReadState = (art: Article, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextRead = new Set(readIds);
    let isRead = false;

    if (nextRead.has(art.id)) {
      nextRead.delete(art.id);
      isRead = false;
      showToast("Marked as unread.", "info");
    } else {
      nextRead.add(art.id);
      isRead = true;
      showToast("Marked as read.", "info");
    }

    setReadIds(nextRead);
    setArticles(prev =>
      prev.map(a => (a.id === art.id ? { ...a, isRead: isRead } : a))
    );
    if (selectedArticle && selectedArticle.id === art.id) {
      setSelectedArticle(prev => prev ? { ...prev, isRead: isRead } : null);
    }
  };

  const handleShareArticle = (art: Article, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: art.title,
        url: art.link,
      }).catch(() => {});
    } else {
      // Fallback
      navigator.clipboard.writeText(art.link);
      showToast("Article web-link copied to clipboard!", "success");
    }
  };

  // Mark current filtered set of articles as read (cleanup speed-reading)
  const handleMarkAllAsRead = () => {
    const nextRead = new Set(readIds);
    let count = 0;

    filteredArticles.forEach(art => {
      if (!nextRead.has(art.id)) {
        nextRead.add(art.id);
        count++;
      }
    });

    if (count === 0) {
      showToast("No new unread articles in this view.", "info");
      return;
    }

    setReadIds(nextRead);
    setArticles(prev =>
      prev.map(a => (nextRead.has(a.id) ? { ...a, isRead: true } : a))
    );
    showToast(`Marked ${count} articles as read.`, "success");
  };

  // Reset to default factory setting feeds
  const handleResetToDefaults = () => {
    localStorage.clear();
    window.location.reload();
  };

  // Import Backup JSON database
  const handleImportBackup = (
    importedFeeds: Feed[],
    importedSettings: AppSettings,
    importedReadIds: string[],
    importedBookmarkIds: string[]
  ): boolean => {
    try {
      setFeeds(importedFeeds);
      setSettings(importedSettings);
      setReadIds(new Set(importedReadIds));
      setBookmarkIds(new Set(importedBookmarkIds));
      
      // Clean up cached articles to reset list and force refresh
      setArticles([]);
      showToast("Backup restored! Fetching feed content...", "success");
      
      // Kick off background sync
      setTimeout(() => {
        handleRefresh(true);
      }, 500);

      return true;
    } catch (_) {
      return false;
    }
  };

  // --- ARTICLE FILTER CALCULATOR ---
  const filteredArticles = useMemo(() => {
    // Only display articles from ACTIVE subscriptions
    const activeFeedIds = new Set(feeds.filter(f => f.isActive).map(f => f.id));
    
    const result = articles
      .filter((art) => {
        // Feed must be active
        if (!activeFeedIds.has(art.feedId)) return false;

        // Apply Category/Bookmarks selection filter
        if (selectedCategory === "bookmarks") {
          if (!bookmarkIds.has(art.id)) return false;
        } else if (selectedCategory !== "all") {
          // Feed must belong to selected category
          const feedObj = feeds.find(f => f.id === art.feedId);
          if (!feedObj || feedObj.category !== selectedCategory) return false;
        }

        // Apply Preferences (hide read articles)
        if (!settings.showReadArticles && readIds.has(art.id)) {
          return false;
        }

        // Apply Search query
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          const matchTitle = art.title.toLowerCase().includes(query);
          const matchSnippet = art.snippet.toLowerCase().includes(query);
          const matchCreator = art.creator.toLowerCase().includes(query);
          const matchFeed = art.feedTitle.toLowerCase().includes(query);
          if (!matchTitle && !matchSnippet && !matchCreator && !matchFeed) return false;
        }

        return true;
      })
      .map(art => ({
        ...art,
        isRead: readIds.has(art.id),
        isBookmarked: bookmarkIds.has(art.id)
      }));

    // Sort according to sortBy state
    if (sortBy === "oldest") {
      result.sort((a, b) => new Date(a.pubDate).getTime() - new Date(b.pubDate).getTime());
    } else if (sortBy === "popular") {
      result.sort((a, b) => {
        // Unread priority: unread (false) before read (true)
        if (a.isRead !== b.isRead) {
          return a.isRead ? 1 : -1;
        }
        // Bookmark priority: bookmarked (true) before not-bookmarked (false)
        if (a.isBookmarked !== b.isBookmarked) {
          return a.isBookmarked ? -1 : 1;
        }
        // Then newest first
        return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
      });
    } else {
      // Default: newest first
      result.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    }

    return result;
  }, [articles, feeds, selectedCategory, bookmarkIds, readIds, settings.showReadArticles, searchQuery, sortBy]);

  // Dynamic Unread counter calculators for Sidebar badge displays
  const unreadCountMap = useMemo(() => {
    const counts: Record<string, number> = { all: 0, bookmarks: 0 };
    const activeFeedIds = new Set(feeds.filter(f => f.isActive).map(f => f.id));

    articles.forEach((art) => {
      if (!activeFeedIds.has(art.feedId)) return;
      
      const isUnread = !readIds.has(art.id);
      
      if (isUnread) {
        counts.all = (counts.all || 0) + 1;
        
        // Count category-specific unread
        const feedObj = feeds.find(f => f.id === art.feedId);
        if (feedObj && feedObj.category) {
          counts[feedObj.category] = (counts[feedObj.category] || 0) + 1;
        }
      }

      if (bookmarkIds.has(art.id)) {
        counts.bookmarks = (counts.bookmarks || 0) + 1;
      }
    });

    return counts;
  }, [articles, feeds, readIds, bookmarkIds]);

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col md:flex-row transition-colors duration-300">
      {/* Sidebar Navigation (Collapses to bottom bar on mobile) */}
      <Sidebar
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
        selectedCategory={selectedCategory}
        onCategoryChange={(catId) => {
          setSelectedCategory(catId);
          setCurrentSection("feed"); // Force transition to feed list view when category clicked
        }}
        categories={categories}
        feeds={feeds}
        settings={settings}
        onToggleDarkMode={() => setSettings(prev => ({ ...prev, darkMode: !prev.darkMode }))}
        onAddFeedClick={() => setIsAddFeedOpen(true)}
        unreadCountMap={unreadCountMap}
      />

      {/* Main Container Canvas */}
      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        
        {/* ================= TOP APP BAR ================= */}
        <header className="sticky top-0 bg-surface/90 backdrop-blur-md border-b border-outline-variant/60 px-4 md:px-6 h-16 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <h2 className="font-sans font-extrabold text-lg text-on-surface tracking-tight capitalize md:hidden">
              {currentSection === "feed" 
                ? (categories.find(c => c.id === selectedCategory)?.name || "Feed")
                : currentSection === "manage"
                ? "Manage Feeds"
                : "Preferences"
              }
            </h2>
            <div className="hidden md:flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-on-surface-variant/80 uppercase tracking-widest">
                Material Design 3 Engine
              </span>
            </div>
          </div>

          {/* Search, Action triggers in header bar */}
          <div className="flex items-center gap-2">
            {/* Header Feed Sort */}
            {currentSection === "feed" && (
              <div className="flex items-center gap-1">
                <div className="relative z-30" id="header-sort-dropdown-container">
                  <button
                    onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                    className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl hover:bg-surface-variant text-on-surface-variant hover:text-on-surface border border-outline/30 bg-surface/50 text-xs font-bold transition-all"
                    title="Sort Articles"
                    id="btn-sort-dropdown-toggle"
                  >
                    {sortBy === "newest" && <ArrowDownWideNarrow size={14} className="text-primary" />}
                    {sortBy === "oldest" && <ArrowUpWideNarrow size={14} className="text-amber-500" />}
                    {sortBy === "popular" && <TrendingUp size={14} className="text-rose-500" />}
                    <span className="hidden sm:inline">
                      {sortBy === "newest" && "Newest First"}
                      {sortBy === "oldest" && "Oldest First"}
                      {sortBy === "popular" && "Popular/Unread"}
                    </span>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${isSortDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isSortDropdownOpen && (
                    <>
                      {/* Backdrop to close on outside click */}
                      <div 
                        className="fixed inset-0 z-30 cursor-default" 
                        onClick={() => setIsSortDropdownOpen(false)} 
                      />
                      <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-surface-container-high border border-outline-variant shadow-lg py-1.5 z-40 animate-in fade-in slide-in-from-top-2 duration-150">
                        <div className="px-3.5 py-2 border-b border-outline-variant/60">
                          <span className="text-[10px] font-mono font-bold text-on-surface-variant/70 uppercase tracking-wider">
                            Sort Order
                          </span>
                        </div>
                        
                        <button
                          onClick={() => {
                            setSortBy("newest");
                            setIsSortDropdownOpen(false);
                            showToast("Sorting set to Newest First", "info");
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs font-medium transition-colors hover:bg-surface-variant ${
                            sortBy === "newest" ? "text-primary bg-primary/5 font-bold" : "text-on-surface-variant"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <ArrowDownWideNarrow size={14} className={sortBy === "newest" ? "text-primary" : "text-on-surface-variant/60"} />
                            <span>Newest First</span>
                          </div>
                          {sortBy === "newest" && <Check size={14} className="text-primary" />}
                        </button>

                        <button
                          onClick={() => {
                            setSortBy("oldest");
                            setIsSortDropdownOpen(false);
                            showToast("Sorting set to Oldest First", "info");
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs font-medium transition-colors hover:bg-surface-variant ${
                            sortBy === "oldest" ? "text-primary bg-primary/5 font-bold" : "text-on-surface-variant"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <ArrowUpWideNarrow size={14} className={sortBy === "oldest" ? "text-amber-500" : "text-on-surface-variant/60"} />
                            <span>Oldest First</span>
                          </div>
                          {sortBy === "oldest" && <Check size={14} className="text-primary" />}
                        </button>

                        <button
                          onClick={() => {
                            setSortBy("popular");
                            setIsSortDropdownOpen(false);
                            showToast("Sorting set to Popular/Unread Priority", "info");
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs font-medium transition-colors hover:bg-surface-variant ${
                            sortBy === "popular" ? "text-primary bg-primary/5 font-bold" : "text-on-surface-variant"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <TrendingUp size={14} className={sortBy === "popular" ? "text-rose-500" : "text-on-surface-variant/60"} />
                            <div className="flex flex-col">
                              <span>Popular/Unread Priority</span>
                              <span className="text-[9px] text-on-surface-variant/60 font-normal">Unread & Bookmarks first</span>
                            </div>
                          </div>
                          {sortBy === "popular" && <Check size={14} className="text-primary" />}
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Help Tooltip */}
                <div className="relative group" id="sort-help-tooltip">
                  <button
                    type="button"
                    className="p-2 rounded-xl text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-variant transition-all flex items-center justify-center cursor-help"
                    aria-label="How sorting works"
                  >
                    <Info size={14} />
                  </button>
                  {/* Tooltip card */}
                  <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-surface-container-high border border-outline-variant shadow-xl p-4 z-40 hidden group-hover:block animate-in fade-in slide-in-from-top-1 duration-150 pointer-events-none">
                    <h4 className="text-xs font-bold text-on-surface mb-2.5 flex items-center gap-1.5">
                      <Info size={12} className="text-primary" />
                      Feed Sort Strategies
                    </h4>
                    <div className="space-y-3 text-[11px] text-on-surface-variant leading-relaxed">
                      <div>
                        <strong className="text-primary font-bold flex items-center gap-1">
                          <ArrowDownWideNarrow size={11} /> Newest First
                        </strong>
                        <p className="mt-0.5 text-on-surface-variant/80">Default chronological flow. Most recently published articles appear at the top.</p>
                      </div>
                      <div>
                        <strong className="text-amber-500 font-bold flex items-center gap-1">
                          <ArrowUpWideNarrow size={11} /> Oldest First
                        </strong>
                        <p className="mt-0.5 text-on-surface-variant/80">Reverse-chronological flow. Ideal for reading serial content or catching up from archives.</p>
                      </div>
                      <div>
                        <strong className="text-rose-500 font-bold flex items-center gap-1">
                          <TrendingUp size={11} /> Popular / Unread
                        </strong>
                        <p className="mt-0.5 text-on-surface-variant/80">Smart priority queue. Keeps unread articles and bookmarked items pinned at the top, then sorts the rest chronologically.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Header Feed Refresh */}
            {currentSection === "feed" && (
              <button
                onClick={() => handleRefresh(true)}
                disabled={isLoading}
                className="p-2.5 rounded-full hover:bg-surface-variant text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-50"
                id="btn-header-refresh"
                title="Refresh All Feeds"
              >
                <RotateCw size={18} className={isLoading ? "animate-spin" : ""} />
              </button>
            )}

            {/* Offline indicator banner inside actions */}
            {!isOnline && (
              <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-900/30 text-xs font-semibold">
                <WifiOff size={13} />
                <span className="hidden sm:inline">Offline Cache</span>
              </div>
            )}
          </div>
        </header>

        {/* ================= OFFLINE WARNING BANNER ================= */}
        {!isOnline && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2 flex items-center gap-2 text-xs font-medium text-amber-800 dark:text-amber-400">
            <AlertTriangle size={14} className="shrink-0" />
            <span>Currently offline. Showing stored content. You can read, search and bookmark cached articles.</span>
          </div>
        )}

        {/* ================= APP PAGES CONTENT GRID ================= */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          
          {/* ================= PAGE: HOME FEED ================= */}
          {currentSection === "feed" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              
              {/* Upper Control Console: Search & Action buttons */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container/45 p-4 rounded-3xl border border-outline-variant/40">
                {/* Search box */}
                <div className="relative flex-1 max-w-lg">
                  <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                  <input
                    type="text"
                    placeholder="Search articles, authors, or blogs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-surface border border-outline text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    id="search-articles-input"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-on-surface-variant hover:text-on-surface bg-surface-variant px-1.5 py-0.5 rounded-lg"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Filters Row */}
                <div className="flex items-center justify-between sm:justify-start gap-3">
                  <p className="text-xs font-semibold text-on-surface-variant">
                    {filteredArticles.length} Article{filteredArticles.length === 1 ? "" : "s"}
                  </p>
                  
                  <div className="flex gap-2">
                    {/* Mark All As Read */}
                    <button
                      onClick={handleMarkAllAsRead}
                      className="flex items-center gap-1.5 py-2 px-3.5 bg-surface border border-outline text-on-surface-variant hover:bg-surface-variant/30 rounded-xl font-sans font-bold text-xs active:scale-95 transition-all"
                      id="btn-mark-all-read"
                    >
                      <CheckCheck size={14} />
                      <span className="hidden sm:inline">Mark read</span>
                    </button>

                    {/* Segmented layout switcher in card filters */}
                    <div className="hidden sm:flex bg-surface rounded-xl p-0.5 border border-outline">
                      {(["grid", "list"] as const).map((mode) => {
                        const isActive = settings.layoutMode === mode;
                        return (
                          <button
                            key={mode}
                            onClick={() => setSettings(prev => ({ ...prev, layoutMode: mode }))}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isActive ? "bg-primary/10 text-primary" : "text-on-surface-variant hover:bg-surface-variant/40"
                            }`}
                            title={`Switch to ${mode} layout`}
                          >
                            {mode === "grid" ? <LayoutGrid size={15} /> : <LayoutList size={15} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Category selector chips row (mobile filter shortcuts) */}
              <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-hide shrink-0 md:hidden">
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  const unread = unreadCountMap[cat.id] || 0;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all ${
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-surface-container border border-outline text-on-surface-variant"
                      }`}
                    >
                      {renderIcon(cat.iconName, "w-3.5 h-3.5")}
                      <span>{cat.name}</span>
                      {unread > 0 && (
                        <span className="text-[9px] bg-primary-container text-on-primary-container px-1.5 py-0.2 rounded-full">
                          {unread}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Loading Banner */}
              {isLoading && articles.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center space-y-4">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                    <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-sans font-bold text-base text-on-surface">Assembling feed stream...</p>
                    <p className="text-xs text-on-surface-variant font-mono">Parsing host XML feeds and media enclosures</p>
                  </div>
                </div>
              )}

              {/* Empty state: No active subscriptions */}
              {feeds.length === 0 ? (
                <div className="py-16 text-center max-w-md mx-auto space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                    <Rss size={32} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-sans font-bold text-lg text-on-surface">No Subscriptions</h3>
                    <p className="text-xs text-on-surface-variant max-w-sm mx-auto leading-relaxed">
                      You are not subscribed to any feeds yet. Subscribe to standard custom blogs or news networks in Settings to build your personalized feed.
                    </p>
                  </div>
                  <button
                    onClick={() => setCurrentSection("manage")}
                    className="py-3 px-6 bg-primary text-primary-foreground rounded-2xl font-sans font-bold text-xs hover:brightness-95 hover:shadow-md transition-all"
                  >
                    Manage Feeds
                  </button>
                </div>
              ) : filteredArticles.length === 0 && !isLoading ? (
                /* Empty state: Filtered out feeds */
                <div className="py-16 text-center max-w-md mx-auto bg-surface-container p-8 rounded-3xl border border-outline-variant/40 space-y-3">
                  <Info className="mx-auto text-on-surface-variant/60" size={32} />
                  <div className="space-y-1">
                    <h3 className="font-sans font-bold text-base text-on-surface">No articles found</h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      There are no unread articles matching this filter or search query. Try switching categories or checking preferences.
                    </p>
                  </div>
                  <div className="flex gap-2 justify-center pt-2">
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="px-4 py-2 bg-surface border border-outline text-xs font-semibold rounded-xl"
                      >
                        Clear Search
                      </button>
                    )}
                    {!settings.showReadArticles && (
                      <button
                        onClick={() => setSettings(prev => ({ ...prev, showReadArticles: true }))}
                        className="px-4 py-2 bg-primary/10 text-primary text-xs font-bold rounded-xl"
                      >
                        Show Read Articles
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* ARTICLES FEED OUTPUT CONTAINER */
                <div
                  className={
                    settings.layoutMode === "grid"
                      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                      : "space-y-4 max-w-4xl mx-auto"
                  }
                  id="articles-feed-output"
                >
                  {filteredArticles.map((art) => (
                    <motion.div
                      key={art.id}
                      layout="position"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ArticleCard
                        article={art}
                        layoutMode={settings.layoutMode}
                        onSelect={handleSelectArticle}
                        onToggleBookmark={handleToggleBookmarkState}
                        onToggleRead={handleToggleReadState}
                        onShare={handleShareArticle}
                        isSelected={selectedArticle?.id === art.id}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= PAGE: MANAGE SUBSCRIPTIONS ================= */}
          {currentSection === "manage" && (
            <FeedManager
              feeds={feeds}
              categories={categories}
              onToggleFeedActive={handleToggleFeedActive}
              onUpdateFeed={handleUpdateFeed}
              onDeleteFeed={handleDeleteFeed}
              onAddFeedClick={() => setIsAddFeedOpen(true)}
              onAddCategory={handleAddCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
            />
          )}

          {/* ================= PAGE: PREFERENCES ================= */}
          {currentSection === "settings" && (
            <SettingsPanel
              settings={settings}
              onUpdateSettings={setSettings}
              feeds={feeds}
              categories={categories}
              readIds={Array.from(readIds)}
              bookmarkIds={Array.from(bookmarkIds)}
              onResetToDefaults={handleResetToDefaults}
              onImportData={handleImportBackup}
            />
          )}
        </div>
      </main>

      {/* ================= GLOBAL FLOATING NOTIFICATION TOAST ================= */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md bg-surface-container-high/95 max-w-sm w-[90%] text-left"
            id="global-toast-notification"
          >
            {toast.type === "success" ? (
              <div className="p-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full shrink-0">
                <Check size={14} />
              </div>
            ) : toast.type === "error" ? (
              <div className="p-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full shrink-0">
                <AlertTriangle size={14} />
              </div>
            ) : (
              <div className="p-1.5 bg-primary/10 text-primary rounded-full shrink-0">
                <Info size={14} />
              </div>
            )}
            <span className="text-xs font-semibold text-on-surface-variant leading-normal">
              {toast.message}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= GLOBAL IMMERSIVE READER PANEL ================= */}
      <ArticleReader
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
        onToggleBookmark={handleToggleBookmarkState}
        onToggleRead={handleToggleReadState}
        onShare={handleShareArticle}
        settings={settings}
        onUpdateSettings={setSettings}
      />

      {/* ================= GLOBAL ADD SUBSCRIPTION DIALOG ================= */}
      <AddFeedDialog
        isOpen={isAddFeedOpen}
        onClose={() => setIsAddFeedOpen(false)}
        categories={categories}
        onAddFeed={handleAddFeed}
      />
    </div>
  );
}

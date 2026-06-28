import { useState } from "react";
import * as Icons from "lucide-react";
import { Category, Feed, AppSettings } from "../types";

// Helper to render Lucide Icons by name dynamically
export function renderIcon(name: string, className?: string) {
  const IconComponent = (Icons as any)[name];
  if (IconComponent) {
    return <IconComponent className={className} />;
  }
  return <Icons.Rss className={className} />; // Fallback
}

interface SidebarProps {
  currentSection: "feed" | "manage" | "settings";
  onSectionChange: (section: "feed" | "manage" | "settings") => void;
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
  categories: Category[];
  feeds: Feed[];
  settings: AppSettings;
  onToggleDarkMode: () => void;
  onAddFeedClick: () => void;
  unreadCountMap: Record<string, number>;
}

export default function Sidebar({
  currentSection,
  onSectionChange,
  selectedCategory,
  onCategoryChange,
  categories,
  feeds,
  settings,
  onToggleDarkMode,
  onAddFeedClick,
  unreadCountMap,
}: SidebarProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Helper to count feeds in category
  const getFeedCount = (catId: string) => {
    if (catId === "all") return feeds.length;
    if (catId === "bookmarks") return 0; // Handled separately if needed
    return feeds.filter(f => f.category === catId).length;
  };

  return (
    <>
      {/* ================= DESKTOP SIDEBAR / NAVIGATION RAIL ================= */}
      <aside className="hidden md:flex flex-col w-72 bg-surface text-on-surface border-r border-outline-variant h-screen sticky top-0 shrink-0 z-10 transition-colors duration-300">
        {/* App Branding */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-md">
              <Icons.Rss size={22} className="animate-pulse" />
            </div>
            <div>
              <h1 className="font-sans font-bold tracking-tight text-lg text-on-surface leading-tight">
                Material RSS
              </h1>
              <p className="font-sans text-xs text-on-surface-variant font-medium">
                V3 Reader
              </p>
            </div>
          </div>
          
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-full hover:bg-surface-variant transition-colors text-on-surface-variant hover:text-on-surface"
            title={settings.darkMode ? "Light Mode" : "Dark Mode"}
            id="desktop-theme-toggle"
          >
            {settings.darkMode ? <Icons.Sun size={18} /> : <Icons.Moon size={18} />}
          </button>
        </div>

        {/* FAB: Add Custom Feed */}
        <div className="px-4 mb-6">
          <button
            onClick={onAddFeedClick}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-primary-container text-on-primary-container rounded-2xl font-sans font-semibold text-sm hover:shadow-lg hover:brightness-95 active:scale-[0.98] transition-all"
            id="desktop-add-feed-fab"
          >
            <Icons.Plus size={18} />
            <span>Add Feed</span>
          </button>
        </div>

        {/* Main Sections (Feed, Manage, Config) */}
        <div className="px-3 space-y-1">
          <button
            onClick={() => onSectionChange("feed")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-sans text-sm font-semibold transition-all duration-200 ${
              currentSection === "feed"
                ? "bg-secondary-container text-on-secondary-container"
                : "text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface"
            }`}
            id="nav-section-feed"
          >
            <Icons.BookOpen size={18} />
            <span className="flex-1 text-left">My Feed</span>
          </button>

          <button
            onClick={() => onSectionChange("manage")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-sans text-sm font-semibold transition-all duration-200 ${
              currentSection === "manage"
                ? "bg-secondary-container text-on-secondary-container"
                : "text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface"
            }`}
            id="nav-section-manage"
          >
            <Icons.Settings2 size={18} />
            <span className="flex-1 text-left">Manage Feeds</span>
            <span className="text-xs bg-surface-variant/70 text-on-surface-variant px-2 py-0.5 rounded-full">
              {feeds.length}
            </span>
          </button>

          <button
            onClick={() => onSectionChange("settings")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-sans text-sm font-semibold transition-all duration-200 ${
              currentSection === "settings"
                ? "bg-secondary-container text-on-secondary-container"
                : "text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface"
            }`}
            id="nav-section-settings"
          >
            <Icons.Sliders size={18} />
            <span className="flex-1 text-left">Preferences</span>
          </button>
        </div>

        {/* Categories Dividor */}
        {currentSection === "feed" && (
          <>
            <div className="h-px bg-outline-variant mx-6 my-4" />
            
            {/* Scrollable Categories List */}
            <div className="flex-1 overflow-y-auto px-3 space-y-1 pb-4">
              <p className="px-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 font-mono">
                Categories
              </p>
              
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                const unread = unreadCountMap[cat.id] || 0;
                
                return (
                  <button
                    key={cat.id}
                    onClick={() => onCategoryChange(cat.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isSelected
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-on-surface-variant hover:bg-surface-variant/30 hover:text-on-surface"
                    }`}
                    id={`nav-category-${cat.id}`}
                  >
                    <div className="flex items-center justify-center shrink-0">
                      {renderIcon(cat.iconName, `w-4 h-4 ${isSelected ? 'text-primary' : 'text-on-surface-variant'}`)}
                    </div>
                    <span className="flex-1 text-left truncate">{cat.name}</span>
                    {unread > 0 && (
                      <span className="text-[10px] bg-primary text-primary-foreground font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                        {unread}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Footer / Offline Info */}
        <div className="p-4 border-t border-outline-variant text-center">
          <p className="text-[10px] text-on-surface-variant font-mono">
            Local SQLite/Storage Caching Active
          </p>
        </div>
      </aside>

      {/* ================= MOBILE BOTTOM NAVIGATION ================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface text-on-surface border-t border-outline-variant h-16 flex items-center justify-around px-2 z-40 shadow-lg transition-colors duration-300">
        <button
          onClick={() => {
            onSectionChange("feed");
            onCategoryChange("all");
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 gap-1 text-[11px] font-semibold transition-colors ${
            currentSection === "feed" && selectedCategory === "all"
              ? "text-primary"
              : "text-on-surface-variant"
          }`}
          id="mobile-nav-all"
        >
          <div className={`px-4 py-1 rounded-full transition-all ${
            currentSection === "feed" && selectedCategory === "all" ? "bg-primary/15" : ""
          }`}>
            <Icons.Layers size={18} />
          </div>
          <span>Feeds</span>
        </button>

        <button
          onClick={() => {
            onSectionChange("feed");
            onCategoryChange("bookmarks");
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 gap-1 text-[11px] font-semibold transition-colors ${
            currentSection === "feed" && selectedCategory === "bookmarks"
              ? "text-primary"
              : "text-on-surface-variant"
          }`}
          id="mobile-nav-bookmarks"
        >
          <div className={`px-4 py-1 rounded-full transition-all ${
            currentSection === "feed" && selectedCategory === "bookmarks" ? "bg-primary/15" : ""
          }`}>
            <Icons.Bookmark size={18} />
          </div>
          <span>Bookmarks</span>
        </button>

        {/* Centered Add FAB on Mobile */}
        <button
          onClick={onAddFeedClick}
          className="flex flex-col items-center justify-center w-12 h-12 -translate-y-4 bg-primary text-primary-foreground rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all z-50"
          id="mobile-add-feed-fab"
        >
          <Icons.Plus size={24} />
        </button>

        <button
          onClick={() => onSectionChange("manage")}
          className={`flex flex-col items-center justify-center flex-1 py-1 gap-1 text-[11px] font-semibold transition-colors ${
            currentSection === "manage" ? "text-primary" : "text-on-surface-variant"
          }`}
          id="mobile-nav-manage"
        >
          <div className={`px-4 py-1 rounded-full transition-all ${
            currentSection === "manage" ? "bg-primary/15" : ""
          }`}>
            <Icons.Settings2 size={18} />
          </div>
          <span>Manage</span>
        </button>

        <button
          onClick={() => onSectionChange("settings")}
          className={`flex flex-col items-center justify-center flex-1 py-1 gap-1 text-[11px] font-semibold transition-colors ${
            currentSection === "settings" ? "text-primary" : "text-on-surface-variant"
          }`}
          id="mobile-nav-settings"
        >
          <div className={`px-4 py-1 rounded-full transition-all ${
            currentSection === "settings" ? "bg-primary/15" : ""
          }`}>
            <Icons.Sliders size={18} />
          </div>
          <span>Settings</span>
        </button>
      </nav>
    </>
  );
}

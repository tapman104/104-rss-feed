import React, { useState } from "react";
import * as Icons from "lucide-react";
import { Feed, Category } from "../types";
import { renderIcon } from "./Sidebar";

interface FeedManagerProps {
  feeds: Feed[];
  categories: Category[];
  onToggleFeedActive: (feedId: string) => void;
  onUpdateFeed: (feedId: string, updatedFields: Partial<Feed>) => void;
  onDeleteFeed: (feedId: string) => void;
  onAddFeedClick: () => void;
  onAddCategory: (name: string, iconName: string, color?: string) => void;
  onUpdateCategory: (categoryId: string, name: string, iconName: string, color?: string) => void;
  onDeleteCategory: (categoryId: string) => void;
}

const COLOR_PRESETS = [
  { name: "Emerald", value: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300", dot: "bg-emerald-500" },
  { name: "Blue", value: "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-300", dot: "bg-blue-500" },
  { name: "Indigo", value: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-300", dot: "bg-indigo-500" },
  { name: "Rose", value: "bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-300", dot: "bg-rose-500" },
  { name: "Amber", value: "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300", dot: "bg-amber-500" },
  { name: "Purple", value: "bg-purple-100 text-purple-800 dark:bg-purple-950/30 dark:text-purple-300", dot: "bg-purple-500" },
  { name: "Teal", value: "bg-teal-100 text-teal-800 dark:bg-teal-950/30 dark:text-teal-300", dot: "bg-teal-500" },
  { name: "Orange", value: "bg-orange-100 text-orange-800 dark:bg-orange-950/30 dark:text-orange-300", dot: "bg-orange-500" },
];

const AVAILABLE_ICONS = [
  { name: "Cpu", label: "Technology" },
  { name: "Globe", label: "World News" },
  { name: "Palette", label: "Design & Dev" },
  { name: "Heart", label: "Life & Health" },
  { name: "Sparkles", label: "AI & Innovation" },
  { name: "Tv", label: "Entertainment" },
  { name: "Coins", label: "Business" },
  { name: "Flame", label: "Trending" },
  { name: "Award", label: "Sports" },
  { name: "Utensils", label: "Food" },
  { name: "Compass", label: "Travel" },
  { name: "Atom", label: "Science" },
  { name: "Gamepad2", label: "Gaming" },
  { name: "BookOpen", label: "Education" },
  { name: "Music", label: "Music" },
  { name: "Camera", label: "Art/Photo" },
  { name: "Folder", label: "General" },
];

export default function FeedManager({
  feeds,
  categories,
  onToggleFeedActive,
  onUpdateFeed,
  onDeleteFeed,
  onAddFeedClick,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}: FeedManagerProps) {
  // Tab State: "subscriptions" or "categories"
  const [activeTab, setActiveTab] = useState<"subscriptions" | "categories">("subscriptions");

  // --- FEEDS TAB STATE ---
  const [editingFeedId, setEditingFeedId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // --- CATEGORIES TAB STATE ---
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("Folder");
  const [newCategoryColor, setNewCategoryColor] = useState(COLOR_PRESETS[0].value);

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryIcon, setEditCategoryIcon] = useState("");
  const [editCategoryColor, setEditCategoryColor] = useState("");
  const [confirmDeleteCatId, setConfirmDeleteCatId] = useState<string | null>(null);

  // Filter categories to only those editable/assignable (exclude 'all' and 'bookmarks')
  const assignableCategories = categories.filter(c => c.id !== "all" && c.id !== "bookmarks");

  // Start feed editing
  const startEditingFeed = (feed: Feed) => {
    setEditingFeedId(feed.id);
    setEditTitle(feed.title);
    setEditCategory(feed.category);
  };

  const cancelEditingFeed = () => {
    setEditingFeedId(null);
    setEditTitle("");
    setEditCategory("");
  };

  const saveEditFeed = (feedId: string) => {
    if (!editTitle.trim()) return;
    onUpdateFeed(feedId, {
      title: editTitle.trim(),
      category: editCategory,
    });
    setEditingFeedId(null);
  };

  // Start category editing
  const startEditingCategory = (cat: Category) => {
    setEditingCategoryId(cat.id);
    setEditCategoryName(cat.name);
    setEditCategoryIcon(cat.iconName);
    setEditCategoryColor(cat.color || COLOR_PRESETS[0].value);
  };

  const cancelEditingCategory = () => {
    setEditingCategoryId(null);
    setEditCategoryName("");
    setEditCategoryIcon("");
    setEditCategoryColor("");
  };

  const saveEditCategory = (catId: string) => {
    if (!editCategoryName.trim()) return;
    onUpdateCategory(catId, editCategoryName.trim(), editCategoryIcon, editCategoryColor);
    setEditingCategoryId(null);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    onAddCategory(newCategoryName.trim(), newCategoryIcon, newCategoryColor);
    // Reset form
    setNewCategoryName("");
    setNewCategoryIcon("Folder");
    setNewCategoryColor(COLOR_PRESETS[0].value);
    setIsAddingCategory(false);
  };

  const getCategoryName = (catId: string) => {
    return categories.find(c => c.id === catId)?.name || "Uncategorized";
  };

  const getFeedsCountForCategory = (catId: string) => {
    return feeds.filter(f => f.category === catId).length;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16" id="feed-manager-section">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-sans font-extrabold text-2xl text-on-surface tracking-tight">
            Manage Content
          </h2>
          <p className="text-sm text-on-surface-variant font-medium">
            Customize, organize, and filter your feed sources and categories.
          </p>
        </div>

        {activeTab === "subscriptions" ? (
          <button
            onClick={onAddFeedClick}
            className="flex items-center gap-2 py-3 px-5 bg-primary text-primary-foreground rounded-2xl font-sans font-bold text-xs hover:brightness-95 hover:shadow-md active:scale-95 transition-all self-stretch sm:self-auto justify-center shadow-sm"
            id="manager-add-feed-button"
          >
            <Icons.Plus size={14} />
            <span>Subscribe to New Feed</span>
          </button>
        ) : (
          <button
            onClick={() => setIsAddingCategory(!isAddingCategory)}
            className="flex items-center gap-2 py-3 px-5 bg-primary text-primary-foreground rounded-2xl font-sans font-bold text-xs hover:brightness-95 hover:shadow-md active:scale-95 transition-all self-stretch sm:self-auto justify-center shadow-sm"
            id="manager-add-category-button"
          >
            <Icons.Plus size={14} />
            <span>Add Custom Category</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-outline-variant" id="feed-manager-tabs">
        <button
          onClick={() => setActiveTab("subscriptions")}
          className={`flex items-center gap-2 px-6 py-3 font-sans font-bold text-sm border-b-2 transition-all ${
            activeTab === "subscriptions"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
          id="tab-subscriptions"
        >
          <Icons.Rss size={16} />
          <span>Subscriptions</span>
        </button>
        <button
          onClick={() => setActiveTab("categories")}
          className={`flex items-center gap-2 px-6 py-3 font-sans font-bold text-sm border-b-2 transition-all ${
            activeTab === "categories"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
          id="tab-categories"
        >
          <Icons.FolderOpen size={16} />
          <span>Categories</span>
        </button>
      </div>

      {activeTab === "subscriptions" ? (
        /* ================= SUBSCRIPTIONS PANEL ================= */
        <div className="space-y-6 animate-fade-in">
          {/* Subscription Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-surface-container rounded-2xl border border-outline-variant/50 text-left">
              <p className="text-[11px] font-bold font-mono uppercase tracking-wider text-on-surface-variant">
                Total Feeds
              </p>
              <p className="text-2xl font-extrabold text-on-surface mt-1">{feeds.length}</p>
            </div>
            <div className="p-4 bg-surface-container rounded-2xl border border-outline-variant/50 text-left">
              <p className="text-[11px] font-bold font-mono uppercase tracking-wider text-on-surface-variant">
                Active
              </p>
              <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {feeds.filter((f) => f.isActive).length}
              </p>
            </div>
            <div className="p-4 bg-surface-container rounded-2xl border border-outline-variant/50 text-left">
              <p className="text-[11px] font-bold font-mono uppercase tracking-wider text-on-surface-variant">
                Disabled
              </p>
              <p className="text-2xl font-extrabold text-on-surface-variant/60 mt-1">
                {feeds.filter((f) => !f.isActive).length}
              </p>
            </div>
            <div className="p-4 bg-surface-container rounded-2xl border border-outline-variant/50 text-left">
              <p className="text-[11px] font-bold font-mono uppercase tracking-wider text-on-surface-variant">
                Categories
              </p>
              <p className="text-2xl font-extrabold text-primary mt-1">{assignableCategories.length}</p>
            </div>
          </div>

          {/* Empty State */}
          {feeds.length === 0 ? (
            <div className="p-12 text-center bg-surface-container rounded-3xl border border-dashed border-outline flex flex-col items-center justify-center space-y-4">
              <div className="p-4 bg-primary/10 text-primary rounded-full">
                <Icons.Globe size={40} className="animate-spin" style={{ animationDuration: "12s" }} />
              </div>
              <div className="space-y-1">
                <h3 className="font-sans font-bold text-lg text-on-surface">No feeds subscribed yet</h3>
                <p className="text-xs text-on-surface-variant max-w-sm mx-auto leading-relaxed">
                  Add your favorite publications, dev blogs, news channels, or forums to populate your news engine.
                </p>
              </div>
              <button
                onClick={onAddFeedClick}
                className="py-3 px-6 bg-primary-container text-on-primary-container rounded-2xl font-sans font-semibold text-xs hover:shadow-md transition-all"
              >
                Add Your First Feed
              </button>
            </div>
          ) : (
            /* Feeds list canvas */
            <div className="space-y-3">
              {feeds.map((feed) => {
                const isEditing = editingFeedId === feed.id;
                const isConfirmingDelete = confirmDeleteId === feed.id;
                const currentCat = categories.find((c) => c.id === feed.category);

                return (
                  <div
                    key={feed.id}
                    className={`p-4 rounded-3xl border transition-all text-left flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      feed.isActive
                        ? "bg-surface border-outline-variant hover:border-outline"
                        : "bg-surface-container-lowest border-outline-variant/40 opacity-70 hover:opacity-100"
                    }`}
                    id={`feed-row-${feed.id}`}
                  >
                    {/* Left: Feed Details or Edit Form */}
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="flex flex-col sm:flex-row gap-3">
                          {/* Edit Title */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <label className="text-[10px] font-bold font-mono uppercase text-on-surface-variant">
                              Feed Title
                            </label>
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="w-full px-3 py-2 bg-surface border border-primary rounded-xl text-sm text-on-surface font-sans font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                              id={`edit-feed-title-${feed.id}`}
                            />
                          </div>
                          
                          {/* Edit Category */}
                          <div className="w-full sm:w-48 shrink-0 space-y-1">
                            <label className="text-[10px] font-bold font-mono uppercase text-on-surface-variant">
                              Category
                            </label>
                            <select
                              value={editCategory}
                              onChange={(e) => setEditCategory(e.target.value)}
                              className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-sm text-on-surface font-semibold focus:outline-none"
                              id={`edit-feed-category-${feed.id}`}
                            >
                              {assignableCategories.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ) : (
                        /* Read-Only Mode */
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 bg-primary/10 text-primary rounded-2xl shrink-0 mt-0.5">
                            <Icons.Globe size={18} />
                          </div>
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-sans font-extrabold text-base text-on-surface truncate max-w-sm">
                                {feed.title}
                              </h3>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-sans flex items-center gap-1 ${
                                  currentCat?.color || "bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-300"
                                }`}
                              >
                                {currentCat ? renderIcon(currentCat.iconName, "w-3 h-3") : null}
                                <span>{getCategoryName(feed.category)}</span>
                              </span>
                            </div>
                            <p className="text-xs text-on-surface-variant font-mono truncate max-w-[280px] md:max-w-md">
                              {feed.url}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: Actions / Toggles */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-outline-variant/40">
                      {isConfirmingDelete ? (
                        /* Confirm Delete overlay layout */
                        <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/10 p-2 rounded-2xl border border-rose-200 dark:border-rose-900/40">
                          <Icons.ShieldAlert size={16} className="text-rose-600 dark:text-rose-400 shrink-0" />
                          <span className="text-xs text-rose-800 dark:text-rose-300 font-bold font-sans">
                            Confirm delete?
                          </span>
                          <button
                            onClick={() => onDeleteFeed(feed.id)}
                            className="p-1 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
                            id={`btn-delete-confirm-${feed.id}`}
                          >
                            <Icons.Check size={14} />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="p-1 bg-surface border border-outline rounded-lg text-on-surface hover:bg-surface-variant transition-colors"
                            id={`btn-delete-cancel-${feed.id}`}
                          >
                            <Icons.X size={14} />
                          </button>
                        </div>
                      ) : isEditing ? (
                        /* Editing controls */
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => saveEditFeed(feed.id)}
                            className="p-2 bg-primary text-primary-foreground rounded-xl hover:brightness-95 transition-all flex items-center justify-center"
                            id={`btn-save-edit-${feed.id}`}
                            title="Save Changes"
                          >
                            <Icons.Check size={16} />
                          </button>
                          <button
                            onClick={cancelEditingFeed}
                            className="p-2 bg-surface-container border border-outline text-on-surface-variant rounded-xl hover:bg-surface-variant/40 transition-all flex items-center justify-center"
                            id={`btn-cancel-edit-${feed.id}`}
                            title="Cancel"
                          >
                            <Icons.X size={16} />
                          </button>
                        </div>
                      ) : (
                        /* Default Actions (Edit, Delete, Toggle Active) */
                        <div className="flex items-center gap-2">
                          {/* Active/Inactive switch */}
                          <button
                            onClick={() => onToggleFeedActive(feed.id)}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-sans text-[11px] font-bold transition-all ${
                              feed.isActive
                                ? "bg-emerald-50 dark:bg-emerald-950/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30"
                                : "bg-surface-container-high border border-outline text-on-surface-variant"
                            }`}
                            id={`toggle-feed-active-${feed.id}`}
                            title={feed.isActive ? "Deactivate Feed" : "Activate Feed"}
                          >
                            {feed.isActive ? (
                              <>
                                <Icons.Eye size={13} />
                                <span>Active</span>
                              </>
                            ) : (
                              <>
                                <Icons.EyeOff size={13} />
                                <span>Muted</span>
                              </>
                            )}
                          </button>

                          {/* Edit button */}
                          <button
                            onClick={() => startEditingFeed(feed)}
                            className="p-2.5 rounded-xl hover:bg-surface-variant text-on-surface-variant transition-colors hover:text-on-surface"
                            id={`btn-edit-feed-${feed.id}`}
                            title="Edit Feed"
                          >
                            <Icons.Edit2 size={16} />
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => setConfirmDeleteId(feed.id)}
                            className="p-2.5 rounded-xl hover:bg-rose-100/50 dark:hover:bg-rose-950/20 text-on-surface-variant hover:text-rose-600 transition-colors"
                            id={`btn-delete-feed-${feed.id}`}
                            title="Delete Subscription"
                          >
                            <Icons.Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ================= CATEGORIES PANEL ================= */
        <div className="space-y-6 animate-fade-in">
          {/* Add Category Form */}
          {isAddingCategory && (
            <form
              onSubmit={handleCreateCategory}
              className="p-6 bg-surface-container rounded-3xl border border-outline border-primary/20 space-y-5 text-left animate-fade-in"
              id="add-category-form"
            >
              <div className="flex items-center justify-between border-b border-outline-variant/50 pb-3">
                <div className="flex items-center gap-2 text-primary">
                  <Icons.FolderPlus size={18} />
                  <span className="font-sans font-bold text-sm">Add Custom Category</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(false)}
                  className="p-1 rounded-full hover:bg-surface-variant/50 text-on-surface-variant"
                >
                  <Icons.X size={16} />
                </button>
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gaming, Business, Personal..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface border border-outline rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
                  id="new-category-name-input"
                />
              </div>

              {/* Icon Picker Grid */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant block">
                  Select Icon
                </label>
                <div className="grid grid-cols-6 sm:grid-cols-9 gap-2 p-3 bg-surface rounded-2xl border border-outline-variant max-h-48 overflow-y-auto">
                  {AVAILABLE_ICONS.map((ico) => {
                    const isSel = newCategoryIcon === ico.name;
                    return (
                      <button
                        key={ico.name}
                        type="button"
                        onClick={() => setNewCategoryIcon(ico.name)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                          isSel
                            ? "bg-primary/10 border-primary text-primary scale-105 shadow-sm"
                            : "border-transparent text-on-surface-variant hover:bg-surface-container-high"
                        }`}
                        title={ico.label}
                      >
                        {renderIcon(ico.name, "w-5 h-5")}
                        <span className="text-[9px] font-medium truncate max-w-full hidden sm:block">{ico.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Presets Picker */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant block">
                  Tag Style / Color
                </label>
                <div className="flex flex-wrap gap-2 p-3 bg-surface rounded-2xl border border-outline-variant">
                  {COLOR_PRESETS.map((col) => {
                    const isSel = newCategoryColor === col.value;
                    return (
                      <button
                        key={col.name}
                        type="button"
                        onClick={() => setNewCategoryColor(col.value)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${col.value} ${
                          isSel ? "ring-2 ring-primary border-primary scale-105" : "border-transparent opacity-80 hover:opacity-100"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                        <span>{col.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-3 border-t border-outline-variant/40">
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(false)}
                  className="px-4 py-2 border border-outline rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold shadow-md hover:brightness-95 transition-all"
                >
                  Create Category
                </button>
              </div>
            </form>
          )}

          {/* Categories list */}
          <div className="space-y-3">
            {categories.map((cat) => {
              const isSystem = cat.id === "all" || cat.id === "bookmarks";
              const isEditing = editingCategoryId === cat.id;
              const isConfirmingDelete = confirmDeleteCatId === cat.id;
              const feedsInCat = getFeedsCountForCategory(cat.id);

              return (
                <div
                  key={cat.id}
                  className="p-4 bg-surface rounded-3xl border border-outline-variant flex flex-col gap-4 text-left"
                  id={`cat-card-${cat.id}`}
                >
                  {isEditing ? (
                    /* Inline Editing Form */
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-outline-variant/40 pb-2">
                        <span className="text-xs font-bold font-mono uppercase text-primary">Edit Category</span>
                        <button onClick={cancelEditingCategory} className="text-on-surface-variant hover:text-on-surface">
                          <Icons.X size={15} />
                        </button>
                      </div>

                      {/* Name edit */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold font-mono uppercase text-on-surface-variant">Name</label>
                        <input
                          type="text"
                          value={editCategoryName}
                          onChange={(e) => setEditCategoryName(e.target.value)}
                          className="w-full px-3 py-1.5 bg-surface border border-primary rounded-xl text-sm text-on-surface font-semibold"
                        />
                      </div>

                      {/* Icon edit */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold font-mono uppercase text-on-surface-variant">Select Icon</label>
                        <div className="grid grid-cols-6 sm:grid-cols-9 gap-1.5 p-2 bg-surface-container rounded-xl border border-outline-variant max-h-36 overflow-y-auto">
                          {AVAILABLE_ICONS.map((ico) => {
                            const isSel = editCategoryIcon === ico.name;
                            return (
                              <button
                                key={ico.name}
                                type="button"
                                onClick={() => setEditCategoryIcon(ico.name)}
                                className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-0.5 transition-all ${
                                  isSel ? "bg-primary/10 border-primary text-primary" : "border-transparent text-on-surface-variant hover:bg-surface-variant/40"
                                }`}
                              >
                                {renderIcon(ico.name, "w-4 h-4")}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Color preset edit */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold font-mono uppercase text-on-surface-variant">Style Color</label>
                        <div className="flex flex-wrap gap-1.5 p-2 bg-surface-container rounded-xl border border-outline-variant">
                          {COLOR_PRESETS.map((col) => {
                            const isSel = editCategoryColor === col.value;
                            return (
                              <button
                                key={col.name}
                                type="button"
                                onClick={() => setEditCategoryColor(col.value)}
                                className={`px-2 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition-all ${col.value} ${
                                  isSel ? "ring-2 ring-primary border-primary" : "border-transparent opacity-85"
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
                                <span>{col.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Edit actions */}
                      <div className="flex gap-2 justify-end pt-2 border-t border-outline-variant/40">
                        <button
                          type="button"
                          onClick={cancelEditingCategory}
                          className="px-3 py-1.5 border border-outline rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => saveEditCategory(cat.id)}
                          className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Read-Only Category Display */
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-2xl flex items-center justify-center ${cat.color || "bg-surface-variant text-on-surface-variant"}`}>
                          {renderIcon(cat.iconName, "w-5 h-5")}
                        </div>
                        <div>
                          <h3 className="font-sans font-extrabold text-base text-on-surface flex items-center gap-2">
                            <span>{cat.name}</span>
                            {isSystem && (
                              <span className="px-2 py-0.2 bg-surface-container-high text-on-surface-variant text-[9px] font-bold font-mono rounded uppercase tracking-wider">
                                System
                              </span>
                            )}
                          </h3>
                          <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                            {isSystem
                              ? cat.id === "all"
                                ? "Primary aggregator of all parsed feeds"
                                : "Aggregator of user-saved reading content"
                              : `${feedsInCat} ${feedsInCat === 1 ? 'feed' : 'feeds'} configured`}
                          </p>
                        </div>
                      </div>

                      {/* Category Actions */}
                      <div className="flex items-center gap-1">
                        {isConfirmingDelete ? (
                          <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/10 p-2 rounded-2xl border border-rose-200 dark:border-rose-900/40">
                            <Icons.ShieldAlert size={14} className="text-rose-600 dark:text-rose-400" />
                            <span className="text-[10px] text-rose-800 dark:text-rose-300 font-bold font-sans">
                              Delete? ({feedsInCat} feeds will reassign)
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteCategory(cat.id);
                                setConfirmDeleteCatId(null);
                              }}
                              className="p-1 bg-rose-600 text-white rounded hover:bg-rose-700 transition-colors"
                            >
                              <Icons.Check size={11} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteCatId(null)}
                              className="p-1 bg-surface border border-outline rounded text-on-surface hover:bg-surface-variant"
                            >
                              <Icons.X size={11} />
                            </button>
                          </div>
                        ) : (
                          !isSystem && (
                            <>
                              <button
                                onClick={() => startEditingCategory(cat)}
                                className="p-2 rounded-xl hover:bg-surface-variant text-on-surface-variant hover:text-on-surface transition-colors"
                                title="Edit Category Details"
                              >
                                <Icons.Edit2 size={15} />
                              </button>
                              <button
                                onClick={() => setConfirmDeleteCatId(cat.id)}
                                className="p-2 rounded-xl hover:bg-rose-100/50 dark:hover:bg-rose-950/25 text-on-surface-variant hover:text-rose-600 transition-colors"
                                title="Delete Category"
                              >
                                <Icons.Trash2 size={15} />
                              </button>
                            </>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

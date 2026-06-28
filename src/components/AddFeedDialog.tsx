import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, Sparkles, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Category } from "../types";

interface AddFeedDialogProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAddFeed: (url: string, customTitle: string, category: string) => Promise<boolean>;
}

export default function AddFeedDialog({
  isOpen,
  onClose,
  categories,
  onAddFeed,
}: AddFeedDialogProps) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("tech");
  
  // Validation / Test status states
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [detectedFeed, setDetectedFeed] = useState<{ title: string; description: string; sampleItems: string[] } | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter categories for selector (exclude 'all' and 'bookmarks')
  const selectCategories = categories.filter(c => c.id !== "all" && c.id !== "bookmarks");

  // Synchronize selected category with available options when modal opens or categories change
  useEffect(() => {
    if (isOpen && selectCategories.length > 0) {
      const exists = selectCategories.some(c => c.id === selectedCategory);
      if (!exists) {
        setSelectedCategory(selectCategories[0].id);
      }
    }
  }, [isOpen, categories]);

  // Validate and parse the RSS URL before saving
  const handleValidateUrl = async () => {
    if (!url || !url.trim()) {
      setTestStatus("error");
      setErrorMessage("Please enter a feed URL.");
      return;
    }

    setTestStatus("testing");
    setErrorMessage("");
    setDetectedFeed(null);

    try {
      const response = await fetch(`/api/rss/parse?url=${encodeURIComponent(url.trim())}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not retrieve RSS feed. Verify the URL is correct.");
      }

      setTestStatus("success");
      setDetectedFeed({
        title: data.title,
        description: data.description || "No description provided.",
        sampleItems: data.items ? data.items.slice(0, 3).map((it: any) => it.title) : [],
      });
      
      // Auto-populate custom title with the detected feed title if blank
      if (!title) {
        setTitle(data.title);
      }
    } catch (error: any) {
      setTestStatus("error");
      setErrorMessage(error.message || "Failed to parse feed. Is it a valid RSS/Atom XML feed?");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsSubmitting(true);
    // Add feed
    const success = await onAddFeed(url.trim(), title.trim() || detectedFeed?.title || "Custom Feed", selectedCategory);
    setIsSubmitting(false);

    if (success) {
      // Reset and close
      setUrl("");
      setTitle("");
      setSelectedCategory(selectCategories[0]?.id || "tech");
      setTestStatus("idle");
      setDetectedFeed(null);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 15, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative w-full max-w-lg bg-surface text-on-surface rounded-3xl p-6 shadow-2xl border border-outline-variant z-10 max-h-[90vh] overflow-y-auto"
            id="add-feed-modal"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 text-primary rounded-xl">
                  <Sparkles size={20} />
                </div>
                <h2 className="font-sans font-bold text-xl tracking-tight text-on-surface">
                  Subscribe to RSS Feed
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-surface-variant transition-colors text-on-surface-variant"
                id="close-add-feed-dialog"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="space-y-5">
              {/* URL input + Validation CTA */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-on-surface-variant font-sans">
                  Feed URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    required
                    placeholder="https://example.com/feed.xml"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-2xl bg-surface-container border border-outline text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-on-surface"
                    id="add-feed-url-input"
                  />
                  <button
                    type="button"
                    onClick={handleValidateUrl}
                    disabled={testStatus === "testing"}
                    className="px-4 py-3 bg-secondary-container text-on-secondary-container font-sans font-semibold text-xs rounded-2xl hover:brightness-95 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1 shrink-0"
                    id="validate-feed-url-button"
                  >
                    {testStatus === "testing" ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      "Test Feed"
                    )}
                  </button>
                </div>
              </div>

              {/* Status Display Area */}
              {testStatus === "testing" && (
                <div className="p-4 rounded-2xl bg-surface-container-high flex items-center gap-3 border border-outline-variant">
                  <Loader2 size={18} className="text-primary animate-spin" />
                  <span className="text-xs text-on-surface-variant font-medium">
                    Contacting feed host and parsing RSS schemas...
                  </span>
                </div>
              )}

              {testStatus === "error" && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold font-sans">Connection Failed</p>
                    <p className="text-xs font-medium leading-relaxed">{errorMessage}</p>
                  </div>
                </div>
              )}

              {testStatus === "success" && detectedFeed && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle size={18} className="shrink-0 mt-0.5" />
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="text-xs font-bold font-sans">Valid Feed Detected!</p>
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 truncate">
                        {detectedFeed.title}
                      </p>
                      <p className="text-[11px] leading-snug opacity-90 truncate">
                        {detectedFeed.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Sample Items Preview */}
                  {detectedFeed.sampleItems.length > 0 && (
                    <div className="pl-6 border-l border-emerald-300/30 space-y-1.5">
                      <p className="text-[10px] font-mono tracking-wider uppercase opacity-85">
                        Latest Headlines:
                      </p>
                      {detectedFeed.sampleItems.map((item, i) => (
                        <p key={i} className="text-[11px] font-medium truncate opacity-90">
                          • {item}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Feed Title Customization */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-on-surface-variant font-sans">
                  Custom Feed Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder={detectedFeed?.title || "e.g. My Tech Daily"}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-surface-container border border-outline text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-on-surface"
                  id="add-feed-title-input"
                />
              </div>

              {/* Category selector */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-on-surface-variant font-sans">
                  Assign Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {selectCategories.map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-4 py-2.5 rounded-2xl border text-xs font-semibold font-sans transition-all text-center ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-surface-container border-outline text-on-surface-variant hover:bg-surface-variant/40"
                        }`}
                        id={`select-category-option-${cat.id}`}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-outline-variant justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-3 rounded-2xl border border-outline font-sans font-semibold text-xs text-on-surface-variant hover:bg-surface-variant/30 active:scale-95 transition-all"
                  id="add-feed-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !url.trim()}
                  className="px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-sans font-bold text-xs hover:brightness-95 hover:shadow-md active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1.5"
                  id="add-feed-submit"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Subscribe</span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

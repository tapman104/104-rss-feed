import { X, Bookmark, Share2, ExternalLink, Type, Eye, EyeOff, Minus, Plus } from "lucide-react";
import { Article, AppSettings } from "../types";
import { formatTimeAgo } from "./ArticleCard";

interface ArticleReaderProps {
  article: Article | null;
  onClose: () => void;
  onToggleBookmark: (article: Article) => void;
  onToggleRead: (article: Article) => void;
  onShare: (article: Article) => void;
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
}

export default function ArticleReader({
  article,
  onClose,
  onToggleBookmark,
  onToggleRead,
  onShare,
  settings,
  onUpdateSettings,
}: ArticleReaderProps) {
  if (!article) return null;

  const timeAgo = formatTimeAgo(article.pubDate);

  // Text size scaler
  const increaseFontSize = () => {
    const scales: AppSettings["fontSize"][] = ["sm", "base", "lg", "xl"];
    const idx = scales.indexOf(settings.fontSize);
    if (idx < scales.length - 1) {
      onUpdateSettings({ ...settings, fontSize: scales[idx + 1] });
    }
  };

  const decreaseFontSize = () => {
    const scales: AppSettings["fontSize"][] = ["sm", "base", "lg", "xl"];
    const idx = scales.indexOf(settings.fontSize);
    if (idx > 0) {
      onUpdateSettings({ ...settings, fontSize: scales[idx - 1] });
    }
  };

  const toggleSerif = () => {
    onUpdateSettings({ ...settings, fontSerif: !settings.fontSerif });
  };

  // Map font scale size to classes
  const fontClass = {
    sm: "text-xs md:text-sm",
    base: "text-sm md:text-base",
    lg: "text-base md:text-lg",
    xl: "text-lg md:text-xl",
  }[settings.fontSize];

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      id={`reader-container-${article.id}`}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/30 backdrop-blur-xs transition-opacity"
      />

      {/* Slideout Content Drawer */}
      <div className="relative w-full max-w-2xl bg-surface text-on-surface h-full shadow-2xl flex flex-col border-l border-outline-variant z-10 transition-transform duration-300 transform ease-in-out">
        {/* Top Control Bar */}
        <header className="sticky top-0 bg-surface border-b border-outline-variant/60 px-4 py-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-1">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-surface-variant transition-colors text-on-surface-variant hover:text-on-surface"
              id="reader-close-button"
            >
              <X size={20} />
            </button>
            <span className="hidden sm:inline-block text-xs font-semibold text-on-surface-variant truncate max-w-[180px] font-mono uppercase tracking-wider">
              {article.feedTitle}
            </span>
          </div>

          {/* Typography & Actions Controllers */}
          <div className="flex items-center gap-1.5">
            {/* Font Style Toggle */}
            <button
              onClick={toggleSerif}
              className={`p-2 rounded-full hover:bg-surface-variant transition-colors flex items-center justify-center gap-0.5 ${
                settings.fontSerif ? "text-primary bg-primary/10" : "text-on-surface-variant"
              }`}
              title={settings.fontSerif ? "Switch to Sans-Serif font" : "Switch to Serif font"}
              id="reader-serif-toggle"
            >
              <Type size={16} />
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono px-0.5">
                {settings.fontSerif ? "Serif" : "Sans"}
              </span>
            </button>

            {/* Font Sizers */}
            <div className="flex items-center bg-surface-container rounded-full px-1 py-0.5 border border-outline-variant/40">
              <button
                onClick={decreaseFontSize}
                disabled={settings.fontSize === "sm"}
                className="p-1.5 rounded-full hover:bg-surface-variant transition-colors text-on-surface-variant disabled:opacity-30"
                title="Decrease font size"
                id="reader-font-minus"
              >
                <Minus size={13} />
              </button>
              <span className="text-[10px] font-bold font-mono uppercase px-1.5 text-on-surface-variant">
                {settings.fontSize.toUpperCase()}
              </span>
              <button
                onClick={increaseFontSize}
                disabled={settings.fontSize === "xl"}
                className="p-1.5 rounded-full hover:bg-surface-variant transition-colors text-on-surface-variant disabled:opacity-30"
                title="Increase font size"
                id="reader-font-plus"
              >
                <Plus size={13} />
              </button>
            </div>

            <div className="w-px h-6 bg-outline-variant mx-1" />

            {/* General Actions */}
            <button
              onClick={() => onToggleRead(article)}
              className="p-2 rounded-full hover:bg-surface-variant text-on-surface-variant transition-colors"
              title={article.isRead ? "Mark as Unread" : "Mark as Read"}
              id="reader-toggle-read"
            >
              {article.isRead ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>

            <button
              onClick={() => onToggleBookmark(article)}
              className={`p-2 rounded-full hover:bg-surface-variant transition-colors ${
                article.isBookmarked ? "text-amber-500" : "text-on-surface-variant"
              }`}
              title={article.isBookmarked ? "Remove Bookmark" : "Bookmark"}
              id="reader-toggle-bookmark"
            >
              <Bookmark size={18} fill={article.isBookmarked ? "currentColor" : "none"} />
            </button>

            <button
              onClick={() => onShare(article)}
              className="p-2 rounded-full hover:bg-surface-variant text-on-surface-variant transition-colors"
              title="Share Link"
              id="reader-share"
            >
              <Share2 size={18} />
            </button>
          </div>
        </header>

        {/* Scrollable Reader Canvas */}
        <div className="flex-1 overflow-y-auto px-6 py-8 md:px-8 space-y-6">
          {/* Feed Title & Publisher Meta */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-on-surface-variant">
            <span className="text-primary font-bold tracking-widest uppercase font-mono">
              {article.feedTitle}
            </span>
            <span>•</span>
            <span className="font-mono">{timeAgo}</span>
            {article.creator && (
              <>
                <span>•</span>
                <span className="font-sans font-normal">By {article.creator}</span>
              </>
            )}
          </div>

          {/* Article Title */}
          <h1 className="font-sans font-extrabold text-2xl md:text-3xl text-on-surface tracking-tight leading-tight">
            {article.title}
          </h1>

          {/* Optional Hero Banner Image */}
          {article.imageUrl && (
            <div className="w-full max-h-80 rounded-3xl overflow-hidden bg-surface-container border border-outline-variant/35 shadow-sm">
              <img
                src={article.imageUrl}
                alt=""
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).parentElement!.style.display = "none";
                }}
              />
            </div>
          )}

          {/* Clean Divider */}
          <div className="h-px bg-outline-variant/60 w-full" />

          {/* Full Parsed Content container */}
          <div
            className={`font-sans ${fontClass} ${
              settings.fontSerif ? "font-serif" : "font-sans"
            } text-on-surface/90 leading-relaxed max-w-none space-y-4
              [&_p]:mb-4 [&_p]:leading-relaxed [&_p]:text-on-surface/90
              [&_a]:text-primary [&_a]:underline [&_a]:font-semibold [&_a:hover]:text-primary/80
              [&_img]:rounded-2xl [&_img]:my-6 [&_img]:max-w-full [&_img]:mx-auto [&_img]:h-auto [&_img]:border [&_img]:border-outline-variant/20
              [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul_li]:mb-1.5
              [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol_li]:mb-1.5
              [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-5 [&_blockquote]:text-on-surface-variant/90 [&_blockquote]:bg-surface-container-low [&_blockquote]:py-1 [&_blockquote]:pr-3 [&_blockquote]:rounded-r-xl
              [&_h1]:text-xl [&_h1]:font-extrabold [&_h1]:mt-8 [&_h1]:mb-3 [&_h1]:tracking-tight
              [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:tracking-tight
              [&_h3]:text-base [&_h3]:font-bold [&_h3]:mt-5 [&_h3]:mb-1.5
              [&_pre]:bg-surface-container-high [&_pre]:p-4 [&_pre]:rounded-2xl [&_pre]:overflow-x-auto [&_pre]:my-4 [&_pre]:font-mono [&_pre]:text-xs
              [&_code]:font-mono [&_code]:bg-surface-container-high [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:text-xs
            `}
            dangerouslySetInnerHTML={{
              __html: article.content || `<p>${article.snippet}</p>`,
            }}
          />

          {/* Spacing spacer */}
          <div className="h-12" />
        </div>

        {/* Floating Action Button / Bar at Bottom */}
        <footer className="sticky bottom-0 bg-surface border-t border-outline-variant p-4 flex items-center justify-between z-10">
          <span className="text-xs text-on-surface-variant font-mono">
            Source: {new URL(article.link || "https://example.com").hostname}
          </span>
          
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 py-3 px-6 bg-primary text-primary-foreground rounded-2xl font-sans font-bold text-xs hover:brightness-95 hover:shadow-md active:scale-95 transition-all"
            id="reader-open-original"
          >
            <span>Open Website</span>
            <ExternalLink size={14} />
          </a>
        </footer>
      </div>
    </div>
  );
}

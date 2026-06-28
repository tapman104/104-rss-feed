import React from "react";
import { Bookmark, Check, Eye, EyeOff, Share2, ExternalLink } from "lucide-react";
import { Article } from "../types";

export function formatTimeAgo(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (isNaN(diffMs)) return "Recent";

    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch (_) {
    return "Recent";
  }
}

interface ArticleCardProps {
  article: Article;
  layoutMode: "grid" | "list" | "split";
  onSelect: (article: Article) => void;
  onToggleBookmark: (article: Article, e: React.MouseEvent) => void;
  onToggleRead: (article: Article, e: React.MouseEvent) => void;
  onShare: (article: Article, e: React.MouseEvent) => void;
  isSelected?: boolean;
}

export default function ArticleCard({
  article,
  layoutMode,
  onSelect,
  onToggleBookmark,
  onToggleRead,
  onShare,
  isSelected = false,
}: ArticleCardProps) {
  const timeAgo = formatTimeAgo(article.pubDate);
  const cardId = `article-card-${article.id}`;

  // Helper to strip long domain or feed titles
  const cleanFeedTitle = article.feedTitle.length > 20 
    ? article.feedTitle.substring(0, 18) + "..." 
    : article.feedTitle;

  // ================= COMPACT SPLIT LIST ITEM =================
  if (layoutMode === "split") {
    return (
      <div
        onClick={() => onSelect(article)}
        className={`p-3.5 rounded-2xl cursor-pointer border transition-all text-left flex flex-col gap-2 relative ${
          isSelected
            ? "bg-primary/10 border-primary shadow-sm"
            : article.isRead
            ? "bg-surface-container-lowest border-outline-variant/60 opacity-75 hover:opacity-100"
            : "bg-surface border-outline-variant hover:border-outline hover:shadow-sm"
        }`}
        id={cardId}
      >
        {/* Top Meta Line */}
        <div className="flex items-center justify-between text-[11px] font-semibold text-on-surface-variant/85">
          <span className="text-primary tracking-wide uppercase font-mono truncate max-w-[130px]">
            {cleanFeedTitle}
          </span>
          <span className="font-sans shrink-0">{timeAgo}</span>
        </div>

        {/* Title */}
        <h3
          className={`font-sans leading-snug tracking-tight line-clamp-2 ${
            article.isRead 
              ? "font-normal text-on-surface-variant text-sm" 
              : "font-bold text-on-surface text-sm"
          }`}
        >
          {article.title}
        </h3>

        {/* Bottom Actions Row */}
        <div className="flex items-center justify-between mt-1 pt-2 border-t border-outline-variant/40">
          <span className="text-[10px] text-on-surface-variant/60 font-medium truncate max-w-[120px]">
            {article.creator}
          </span>

          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => onToggleRead(article, e)}
              className={`p-1.5 rounded-full hover:bg-surface-variant transition-all text-on-surface-variant`}
              title={article.isRead ? "Mark as Unread" : "Mark as Read"}
              id={`btn-read-split-${article.id}`}
            >
              {article.isRead ? <EyeOff size={13} /> : <Check size={13} />}
            </button>
            <button
              onClick={(e) => onToggleBookmark(article, e)}
              className={`p-1.5 rounded-full hover:bg-surface-variant transition-all ${
                article.isBookmarked 
                  ? "text-amber-500 hover:text-amber-600" 
                  : "text-on-surface-variant"
              }`}
              title={article.isBookmarked ? "Remove Bookmark" : "Bookmark Article"}
              id={`btn-bookmark-split-${article.id}`}
            >
              <Bookmark size={13} fill={article.isBookmarked ? "currentColor" : "none"} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ================= DETAILED STREAM LIST ITEM =================
  if (layoutMode === "list") {
    return (
      <article
        onClick={() => onSelect(article)}
        className={`p-4 rounded-3xl border cursor-pointer transition-all flex gap-4 text-left relative overflow-hidden group ${
          article.isRead
            ? "bg-surface-container-lowest border-outline-variant/50 opacity-80 hover:opacity-100"
            : "bg-surface border-outline-variant hover:border-outline hover:shadow-md"
        }`}
        id={cardId}
      >
        {/* Left Side: Details */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div className="space-y-1.5">
            {/* Meta tags */}
            <div className="flex items-center gap-2 flex-wrap text-xs font-semibold text-on-surface-variant">
              <span className="text-primary font-bold uppercase tracking-wider text-[10px] font-mono">
                {article.feedTitle}
              </span>
              <span>•</span>
              <span>{timeAgo}</span>
              {article.creator && (
                <>
                  <span>•</span>
                  <span className="truncate max-w-[120px] font-normal">{article.creator}</span>
                </>
              )}
            </div>

            {/* Title */}
            <h3
              className={`font-sans leading-snug tracking-tight group-hover:text-primary transition-colors ${
                article.isRead
                  ? "font-medium text-on-surface-variant text-base"
                  : "font-extrabold text-on-surface text-base md:text-lg"
              }`}
            >
              {article.title}
            </h3>

            {/* Snippet */}
            <p className="text-xs text-on-surface-variant/90 leading-relaxed font-sans line-clamp-2 md:line-clamp-3">
              {article.snippet}
            </p>
          </div>

          {/* Quick Actions Footer */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-outline-variant/30">
            {/* Categories tags if present */}
            <div className="flex gap-1.5 overflow-hidden max-w-[60%]">
              {article.categories.slice(0, 2).map((cat, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-surface-variant text-[10px] text-on-surface-variant font-medium font-mono"
                >
                  #{cat.toLowerCase()}
                </span>
              ))}
              {article.categories.length === 0 && (
                <span className="text-[10px] text-on-surface-variant/40 font-mono italic">
                  no tags
                </span>
              )}
            </div>

            {/* Actions button strip */}
            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={(e) => onToggleRead(article, e)}
                className="p-2 rounded-full hover:bg-surface-variant text-on-surface-variant transition-colors"
                title={article.isRead ? "Mark as Unread" : "Mark as Read"}
                id={`btn-read-list-${article.id}`}
              >
                {article.isRead ? <EyeOff size={15} /> : <Check size={15} />}
              </button>
              <button
                onClick={(e) => onToggleBookmark(article, e)}
                className={`p-2 rounded-full hover:bg-surface-variant transition-colors ${
                  article.isBookmarked 
                    ? "text-amber-500 hover:text-amber-600" 
                    : "text-on-surface-variant"
                }`}
                title={article.isBookmarked ? "Remove Bookmark" : "Bookmark Article"}
                id={`btn-bookmark-list-${article.id}`}
              >
                <Bookmark size={15} fill={article.isBookmarked ? "currentColor" : "none"} />
              </button>
              <button
                onClick={(e) => onShare(article, e)}
                className="p-2 rounded-full hover:bg-surface-variant text-on-surface-variant transition-colors"
                title="Share Article Link"
                id={`btn-share-list-${article.id}`}
              >
                <Share2 size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Image Thumbnail (if present) */}
        {article.imageUrl && (
          <div className="w-24 h-24 md:w-32 md:h-32 shrink-0 rounded-2xl overflow-hidden bg-surface-container border border-outline-variant/30 shadow-sm self-center">
            <img
              src={article.imageUrl}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                // If image fails, hide container or use placeholder
                (e.currentTarget as HTMLElement).style.display = "none";
              }}
            />
          </div>
        )}
      </article>
    );
  }

  // ================= STANDARD ELEVATED BENTO GRID CARD =================
  return (
    <article
      onClick={() => onSelect(article)}
      className={`rounded-3xl border cursor-pointer transition-all flex flex-col text-left overflow-hidden relative group h-full justify-between ${
        article.isRead
          ? "bg-surface-container-lowest border-outline-variant/50 opacity-80 hover:opacity-100 shadow-sm"
          : "bg-surface border-outline-variant hover:border-outline hover:shadow-lg shadow-sm"
      }`}
      id={cardId}
    >
      <div>
        {/* Top Cover Image */}
        {article.imageUrl ? (
          <div className="h-44 w-full bg-surface-container relative overflow-hidden border-b border-outline-variant/30">
            <img
              src={article.imageUrl}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                (e.currentTarget as HTMLElement).parentElement!.style.display = "none";
              }}
            />
            {/* Overlay tag for Feed name */}
            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider font-mono">
              {cleanFeedTitle}
            </span>
          </div>
        ) : (
          /* Text-only banner spacer */
          <div className="p-4 pt-5 pb-1 flex justify-between items-center">
            <span className="px-2.5 py-1 rounded-xl bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider font-mono">
              {cleanFeedTitle}
            </span>
          </div>
        )}

        {/* Content Area */}
        <div className="p-4 space-y-2">
          {/* Metadata */}
          <div className="flex items-center justify-between text-[11px] font-semibold text-on-surface-variant">
            <span>{timeAgo}</span>
            <span className="truncate max-w-[130px] font-normal">{article.creator}</span>
          </div>

          {/* Title */}
          <h3
            className={`font-sans leading-snug tracking-tight line-clamp-2 group-hover:text-primary transition-colors ${
              article.isRead
                ? "font-medium text-on-surface-variant text-base"
                : "font-extrabold text-on-surface text-base"
            }`}
          >
            {article.title}
          </h3>

          {/* Snippet */}
          <p className="text-xs text-on-surface-variant/90 leading-relaxed font-sans line-clamp-2 md:line-clamp-3">
            {article.snippet}
          </p>
        </div>
      </div>

      {/* Footer Area with tags and CTA strip */}
      <div className="p-4 pt-2">
        <div className="flex items-center justify-between pt-3 border-t border-outline-variant/30">
          <div className="flex gap-1 overflow-hidden max-w-[50%]">
            {article.categories.slice(0, 1).map((cat, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md bg-surface-variant text-[9px] text-on-surface-variant font-medium font-mono"
              >
                #{cat.toLowerCase()}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => onToggleRead(article, e)}
              className="p-1.5 rounded-full hover:bg-surface-variant text-on-surface-variant transition-all"
              title={article.isRead ? "Mark as Unread" : "Mark as Read"}
              id={`btn-read-grid-${article.id}`}
            >
              {article.isRead ? <EyeOff size={14} /> : <Check size={14} />}
            </button>
            <button
              onClick={(e) => onToggleBookmark(article, e)}
              className={`p-1.5 rounded-full hover:bg-surface-variant transition-all ${
                article.isBookmarked 
                  ? "text-amber-500 hover:text-amber-600" 
                  : "text-on-surface-variant"
              }`}
              title={article.isBookmarked ? "Remove Bookmark" : "Bookmark Article"}
              id={`btn-bookmark-grid-${article.id}`}
            >
              <Bookmark size={14} fill={article.isBookmarked ? "currentColor" : "none"} />
            </button>
            <button
              onClick={(e) => onShare(article, e)}
              className="p-1.5 rounded-full hover:bg-surface-variant text-on-surface-variant transition-all"
              title="Share Article Link"
              id={`btn-share-grid-${article.id}`}
            >
              <Share2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

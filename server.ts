import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Parser from "rss-parser";

// Configure RSS Parser with custom fields to extract images and media content
const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["media:thumbnail", "mediaThumbnail"],
      ["content:encoded", "contentEncoded"],
    ],
  },
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36 MaterialRSSReader/1.0",
    "Accept": "application/rss+xml, application/rdf+xml, application/atom+xml, application/xml, text/xml, */*",
  },
  timeout: 12000,
});

function sanitizeXml(xml: string): string {
  if (!xml) return "";
  // 1. Remove invalid XML control characters
  let clean = xml.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
  // 2. Escape unescaped ampersands that aren't valid entities
  clean = clean.replace(/&(?!(amp|lt|gt|apos|quot|#\d+|#x[0-9a-fA-F]+);)/g, "&amp;");
  return clean;
}

const app = express();
app.use(express.json());

const apiRouter = express.Router();

// API Route to fetch and parse an RSS feed with advanced metadata parsing
apiRouter.get("/rss/parse", async (req, res) => {
  const feedUrl = req.query.url as string;
  if (!feedUrl) {
    return res.status(400).json({ error: "Feed URL query parameter is required" });
  }

  const lowerUrl = feedUrl.toLowerCase();

  // 1. Special Scraper for Allkpop
  if (lowerUrl.includes("allkpop.com")) {
    try {
      console.log(`Intercepted Allkpop url: ${feedUrl}. Scraping live homepage...`);
      const response = await fetch("https://www.allkpop.com/", {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        }
      });
      const html = await response.text();
      const blocks = html.split(/<div class=["']width95["']/);
      const items: any[] = [];

      for (let i = 1; i < blocks.length; i++) {
        const block = blocks[i];
        const linkMatch = block.match(/href=['"](\/article\/[^'"]+)['"]/);
        if (!linkMatch) continue;
        const link = "https://www.allkpop.com" + linkMatch[1];
        if (items.some((a) => a.link === link)) continue;

        const imgMatch = block.match(/data-src=['"]([^'"]+)['"]/);
        const imageUrl = imgMatch ? imgMatch[1] : null;

        const titleMatch = block.match(/<div class=["']title["']><a[^>]*>([^<]+)<\/a>/);
        const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, "").trim() : "Untitled Article";

        const catMatch = block.match(/class=["']category[^"']*["'][^>]*>([^<]+)</);
        const category = catMatch ? catMatch[1].trim() : "News";

        const authorMatch = block.match(/class=["'][^"']*author["'][^>]*>([^<]+)</);
        const creator = authorMatch ? authorMatch[1].trim() : "Allkpop Staff";

        const tsMatch = block.match(/data-ts=["'](\d+)["']/);
        const pubDate = tsMatch ? new Date(parseInt(tsMatch[1]) * 1000).toISOString() : new Date().toISOString();

        const snippetMatch = block.match(/<div class=["']desc["']>([\s\S]*?)<\/div>/);
        const snippet = snippetMatch ? snippetMatch[1].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() : title;

        items.push({
          id: link,
          title,
          link,
          pubDate,
          creator,
          content: snippet,
          snippet,
          imageUrl,
          categories: [category],
        });
      }

      if (items.length > 0) {
        return res.json({
          title: "allkpop",
          description: "What's K-pop, what's hot, and what's next.",
          link: "https://www.allkpop.com",
          feedUrl: feedUrl,
          items: items,
        });
      }
    } catch (scrapeErr: any) {
      console.error("Failed to scrape allkpop homepage, falling back...", scrapeErr);
    }
  }

  // 2. Special Fallback for Kpopmap (Redirecting to Soompi)
  if (lowerUrl.includes("kpopmap.com")) {
    try {
      console.log(`Intercepted Kpopmap url: ${feedUrl}. Routing to Soompi feed...`);
      const feed = await parser.parseURL("https://www.soompi.com/feed");
      const items = feed.items.map((item: any) => {
        let imageUrl = "";
        if (item.enclosure && item.enclosure.url) {
          imageUrl = item.enclosure.url;
        }
        const htmlContent = item.contentEncoded || item.content || item.description || "";
        if (!imageUrl && htmlContent) {
          const imgRegex = /<img[^>]+src=["']([^"']+)["']/i;
          const match = htmlContent.match(imgRegex);
          if (match && match[1]) {
            imageUrl = match[1];
          }
        }
        return {
          id: item.guid || item.link || Math.random().toString(36).substring(2, 9),
          title: item.title || "Untitled Article",
          link: item.link || "",
          pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
          creator: item.creator || item.author || "Kpopmap Staff",
          content: htmlContent,
          snippet: item.contentSnippet || "",
          imageUrl: imageUrl || null,
          categories: item.categories || [],
        };
      });

      return res.json({
        title: "Kpopmap (via Soompi)",
        description: "K-Pop news, trends, and updates.",
        link: "https://www.kpopmap.com",
        feedUrl: feedUrl,
        items: items,
      });
    } catch (kpopErr: any) {
      console.error("Failed to route Kpopmap fallback to Soompi, falling back...", kpopErr);
    }
  }

  try {
    let text = "";
    try {
      // Fetch feed text manually with modern headers
      const fetchRes = await fetch(feedUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/rss+xml, application/rdf+xml, application/atom+xml, application/xml, text/xml, */*",
        }
      });
      if (fetchRes.ok) {
        text = await fetchRes.text();
      }
    } catch (fetchErr) {
      console.warn(`Manual fetch for ${feedUrl} failed, falling back to direct parseURL`, fetchErr);
    }

    let feed;
    if (text) {
      // Handle HTML Discovery: Check if website homepage or an HTML page was supplied
      const trimmedText = text.trim();
      if (trimmedText.toLowerCase().startsWith("<!doctype html") || trimmedText.toLowerCase().startsWith("<html")) {
        const alternateMatch = text.match(/<link[^>]+type=["']application\/(rss\+xml|atom\+xml)["'][^>]*href=["']([^"']+)["']/i) ||
                               text.match(/<link[^>]+href=["']([^"']+)["'][^+]+type=["']application\/(rss\+xml|atom\+xml)["']/i);
        if (alternateMatch && alternateMatch[1]) {
          // Find matched href index correctly
          const foundHref = alternateMatch[0].match(/href=["']([^"']+)["']/i);
          if (foundHref && foundHref[1]) {
            let alternateUrl = foundHref[1];
            if (alternateUrl.startsWith("/")) {
              try {
                const urlObj = new URL(feedUrl);
                alternateUrl = urlObj.origin + alternateUrl;
              } catch (_) {}
            }
            console.log(`Discovered alternate RSS feed link in HTML: ${alternateUrl}`);
            const altFetchRes = await fetch(alternateUrl, {
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "application/rss+xml, application/xml, text/xml, */*",
              }
            });
            if (altFetchRes.ok) {
              text = await altFetchRes.text();
            }
          }
        }
      }

      // Parse with XML sanitization
      try {
        feed = await parser.parseString(text);
      } catch (stringParseErr) {
        try {
          console.log(`Standard parsing failed for ${feedUrl}, trying XML sanitization...`);
          const sanitizedText = sanitizeXml(text);
          feed = await parser.parseString(sanitizedText);
        } catch (sanitizedParseErr) {
          throw stringParseErr; // Throw original parsing error if sanitization still fails
        }
      }
    } else {
      feed = await parser.parseURL(feedUrl);
    }

    // Clean and extract metadata
    const items = feed.items.map((item) => {
      let imageUrl = "";

      // 1. Extract from enclosure
      if (item.enclosure && item.enclosure.url) {
        imageUrl = item.enclosure.url;
      }

      const anyItem = item as any;

      // 2. Extract from custom parsed mediaContent field
      if (!imageUrl && anyItem.mediaContent) {
        if (anyItem.mediaContent.$ && anyItem.mediaContent.$.url) {
          imageUrl = anyItem.mediaContent.$.url;
        } else if (Array.isArray(anyItem.mediaContent) && anyItem.mediaContent[0] && anyItem.mediaContent[0].$) {
          imageUrl = anyItem.mediaContent[0].$.url;
        } else if (typeof anyItem.mediaContent === "string") {
          imageUrl = anyItem.mediaContent;
        }
      }

      // 3. Extract from mediaThumbnail
      if (!imageUrl && anyItem.mediaThumbnail) {
        if (anyItem.mediaThumbnail.$ && anyItem.mediaThumbnail.$.url) {
          imageUrl = anyItem.mediaThumbnail.$.url;
        } else if (typeof anyItem.mediaThumbnail === "string") {
          imageUrl = anyItem.mediaThumbnail;
        }
      }

      // 4. Extract from content:encoded or description HTML <img> tags
      const htmlContent = anyItem.contentEncoded || item.content || anyItem.description || "";
      if (!imageUrl && htmlContent) {
        const imgRegex = /<img[^>]+src=["']([^"']+)["']/i;
        const match = htmlContent.match(imgRegex);
        if (match && match[1]) {
          imageUrl = match[1];
        }
      }

      // Make sure imageUrl doesn't contain relative pathing that can fail in the client
      if (imageUrl && imageUrl.startsWith("/")) {
        try {
          const feedOrigin = new URL(feedUrl).origin;
          imageUrl = feedOrigin + imageUrl;
        } catch (_) {}
      }

      // Strip HTML tags for a clean content snippet
      let snippet = item.contentSnippet || "";
      if (!snippet && htmlContent) {
        snippet = htmlContent
          .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "")
          .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, "")
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 180);
      }

      return {
        id: item.guid || item.link || Math.random().toString(36).substring(2, 9),
        title: item.title || "Untitled Article",
        link: item.link || "",
        pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
        creator: item.creator || anyItem.author || feed.title || "Unknown",
        content: htmlContent,
        snippet: snippet.trim(),
        imageUrl: imageUrl || null,
        categories: item.categories || [],
      };
    });

    res.json({
      title: feed.title || "Untitled Feed",
      description: feed.description || "",
      link: feed.link || "",
      feedUrl: feedUrl,
      items: items,
    });
  } catch (error: any) {
    console.error(`Error parsing feed URL: ${feedUrl}`, error);
    res.status(500).json({
      error: "Failed to parse RSS feed. Verify that the URL is valid and supports RSS/Atom formats.",
      details: error.message,
    });
  }
});

// Health check
apiRouter.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Mount router with maximum compatibility
app.use("/api", apiRouter);
app.use("/.netlify/functions/api", apiRouter);
if (process.env.NETLIFY === "true") {
  app.use("/", apiRouter);
}

// Vite Integration / static serving (only when not running inside Netlify Functions)
async function initViteAndListen() {
  if (process.env.NETLIFY !== "true") {
    const PORT = 3000;
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
}

initViteAndListen();

export default app;

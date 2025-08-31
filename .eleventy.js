import pluginAsciiDoc from "eleventy-plugin-asciidoc";
import fs from "node:fs";
import path from "node:path";

/** @type {import("@11ty/eleventy/src/UserConfig")} */
export default function (eleventyConfig) {
  // Helper to parse top-of-file AsciiDoc attributes
  function readAdocAttrs(data) {
    try {
      if (!data || !data.page || typeof data.page.inputPath !== "string") return null;
      const input = data.page.inputPath;
      if (!input.endsWith(".adoc")) return null;
      const raw = fs.readFileSync(path.join(process.cwd(), input), "utf8");
      const lines = raw.split(/\r?\n/);
      const out = {};
      for (let i = 0; i < Math.min(lines.length, 80); i++) {
        const line = lines[i].trim();
        if (!line) continue;
        // Stop once content begins (a paragraph under a blank line after attrs)
        if (line && !line.startsWith(":") && !line.startsWith("=") && i > 0) break;
        // Parse attribute lines like ":author: Jane Doe"
        if (line.startsWith(":")) {
          const m = line.match(/^:([^:]+):\s*(.*)$/);
          if (m) {
            const key = m[1].trim();
            const val = m[2].trim();
            out[key] = val;
          }
        }
      }
      return out;
    } catch {
      return null;
    }
  }
  // Simple HTML -> text excerpt filter
  eleventyConfig.addFilter("excerpt", function(content) {
    if (!content) return "";
    const text = String(content).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    if (text.length <= 180) return text;
    return text.slice(0, 180).trimEnd() + "…";
  });
  // Readable date
  eleventyConfig.addFilter("readableDate", function(date) {
    try {
      const d = new Date(date);
      return new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric" }).format(d);
    } catch {
      return String(date);
    }
  });
  // Reading time in minutes (approx 200 wpm)
  eleventyConfig.addFilter("readingTime", function(content) {
    if (!content) return "";
    const text = String(content).replace(/<[^>]*>/g, " ");
    const words = (text.match(/\S+/g) || []).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return `${minutes} min read`;
  });
  // Slug util for tags/urls
  eleventyConfig.addFilter("slug", function(str) {
    return String(str || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  });
  // Unique tag list collection (excluding utility tags)
  eleventyConfig.addFilter("tagsFor", function(item) {
    if (!item) return [];
    const d = item.data || {};
    let tags = d.tags;
    if (!tags) {
      const pt = d["page-tags"] || d.pageTags;
      if (pt) tags = pt;
    }
    if (!tags) {
      const attrs = readAdocAttrs(d);
      const raw = attrs && (attrs.tags || attrs.tag || attrs["page-tags"] || attrs.pageTags);
      if (raw) tags = String(raw).split(",");
    }
    const arr = Array.isArray(tags) ? tags : (tags ? [String(tags)] : []);
    return arr.map(s => String(s).trim()).filter(Boolean);
  });
  eleventyConfig.addFilter("hasTag", function(item, tag) {
    if (!item || !tag) return false;
    const d = item.data || {};
    let tags = d.tags || d["page-tags"] || d.pageTags;
    if (!tags) {
      const attrs = readAdocAttrs(d);
      const raw = attrs && (attrs.tags || attrs.tag);
      if (raw) tags = String(raw).split(",");
    }
    const arr = Array.isArray(tags) ? tags : (tags ? [String(tags)] : []);
    return arr.map(s => String(s).trim()).includes(String(tag));
  });
  eleventyConfig.addCollection("tagList", function(collectionApi) {
    const set = new Set();
    collectionApi.getAll().forEach(item => {
      const d = item.data || {};
      let tags = d.tags || d["page-tags"] || d.pageTags;
      if (!tags) {
        const attrs = readAdocAttrs(d);
        const raw = attrs && (attrs.tags || attrs.tag || attrs["page-tags"] || attrs.pageTags);
        if (raw) tags = String(raw).split(",");
      }
      const arr = Array.isArray(tags) ? tags : (tags ? [String(tags)] : []);
      arr.map(s => String(s).trim()).filter(Boolean).forEach(t => set.add(t));
    });
    ["all", "adoc"].forEach(t => set.delete(t));
    return Array.from(set).sort();
  });
  // Map AsciiDoc :tags: (comma-separated) into array handled below in eleventyComputed
  // Cache-busting helper for static assets (based on file mtime)
  const assetHelper = function(filePath) {
    try {
      const rel = String(filePath || "").replace(/^\//, "");
      const abs = path.join(process.cwd(), "public", rel);
      const stat = fs.statSync(abs);
      const v = stat.mtime.getTime();
      return `/${rel}?v=${v}`;
    } catch {
      // Fallback to the raw path if anything goes wrong
      return filePath;
    }
  };
  eleventyConfig.addShortcode("asset", assetHelper);
  eleventyConfig.addFilter("asset", assetHelper);
  // Ensure .adoc posts use the post layout and support :page-layout:
  eleventyConfig.addGlobalData("eleventyComputed", {
    layout: (data) => {
      // Respect explicit layout if already set
      if (data && data.layout) return data.layout;
      // Map AsciiDoc attribute :page-layout: or :pageLayout:
      const adocLayout = data && (data["page-layout"] || data.pageLayout);
      if (adocLayout) return adocLayout;
      // Default all files under src/posts/ to post.njk
      const input = data && data.page && data.page.inputPath;
      if (typeof input === "string" && input.includes("/src/posts/")) {
        return "post.njk";
      }
      return data && data.layout;
    },
    author: (data) => {
      if (data && data.author) return data.author;
      const attrs = (data && data._adocAttrs) || readAdocAttrs(data);
      if (data) data._adocAttrs = attrs;
      return attrs?.author || attrs?.authors || data?.byline;
    },
    description: (data) => {
      if (data && data.description) return data.description;
      const attrs = (data && data._adocAttrs) || readAdocAttrs(data);
      if (data) data._adocAttrs = attrs;
      return attrs?.description || attrs?.summary || attrs?.abstract || data?.excerpt;
    },
    image: (data) => {
      if (data && (data.image || data.cover || data.hero || data.thumbnail)) return data.image || data.cover || data.hero || data.thumbnail;
      const attrs = (data && data._adocAttrs) || readAdocAttrs(data);
      if (data) data._adocAttrs = attrs;
      return attrs?.image || attrs?.cover || attrs?.hero || attrs?.thumbnail;
    },
    github: (data) => {
      if (data && (data.github || data.gh || data.githubUsername)) return data.github || data.gh || data.githubUsername;
      const attrs = (data && data._adocAttrs) || readAdocAttrs(data);
      if (data) data._adocAttrs = attrs;
      return attrs?.github || attrs?.gh || attrs?.github_username || attrs?.author_github;
    },
    tags: (data) => {
      if (data && (Array.isArray(data.tags) || typeof data.tags === "string")) return data.tags;
      // Support AsciiDoc :page-tags: which AsciiDoc plugin maps into data as "page-tags"
      const pageTags = data && (data["page-tags"] || data.pageTags);
      if (pageTags) {
        const arr = Array.isArray(pageTags) ? pageTags : String(pageTags).split(",");
        return arr.map(s => String(s).trim()).filter(Boolean);
      }
      const attrs = (data && data._adocAttrs) || readAdocAttrs(data);
      if (data) data._adocAttrs = attrs;
      const raw = attrs && (attrs.tags || attrs.tag);
      if (!raw) return data && data.tags;
      return String(raw).split(",").map(s => s.trim()).filter(Boolean);
    }
  });
  eleventyConfig.addPlugin(pluginAsciiDoc, {
    options: { safe: "unsafe", attributes: { "source-highlighter": "rouge", "sectanchors": true, "toc": "macro" } },
    extensions: [".adoc"]
  });
  eleventyConfig.addPassthroughCopy({ "public": "/" });
  eleventyConfig.addWatchTarget("public");
  // Custom collection for AsciiDoc posts
  eleventyConfig.addCollection("adoc", function(collectionApi) {
    return collectionApi
      .getFilteredByGlob("src/posts/**/*.adoc")
      .sort((a, b) => b.date - a.date);
  });

  // Local-only API to read/write config.json when running `npm run dev`
  if (process.env.ELEVENTY_ENV === "development") {
    const rootConfigPath = path.join(process.cwd(), "config.json");
    eleventyConfig.setServerOptions({
      middleware: [
        function(req, res, next) {
          // Only allow localhost access for these endpoints
          const remote = req.socket?.remoteAddress || "";
          const isLocal = remote === "127.0.0.1" || remote === "::1" || remote === "::ffff:127.0.0.1";
          if (!isLocal && (req.url === "/api/save-config" || req.url === "/config.json")) {
            res.writeHead(403, { "content-type": "text/plain" });
            res.end("Forbidden");
            return;
          }

          // Serve current config.json for preview
          if (req.method === "GET" && req.url === "/config.json") {
            try {
              const json = fs.readFileSync(rootConfigPath, "utf8");
              res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
              res.end(json);
            } catch {
              res.writeHead(404, { "content-type": "application/json" });
              res.end(JSON.stringify({ error: "config.json not found" }));
            }
            return;
          }

          // Save posted config to repo root (tracked by git)
          if (req.method === "POST" && req.url === "/api/save-config") {
            let body = "";
            req.on("data", chunk => { body += chunk; });
            req.on("end", () => {
              try {
                const data = JSON.parse(body || "{}");
                const pretty = JSON.stringify(data, null, 2) + "\n";
                fs.writeFileSync(rootConfigPath, pretty, "utf8");
                res.writeHead(200, { "content-type": "application/json" });
                res.end(JSON.stringify({ ok: true }));
              } catch (e) {
                res.writeHead(400, { "content-type": "application/json" });
                res.end(JSON.stringify({ ok: false, error: e?.message || "Invalid request" }));
              }
            });
            return;
          }

          next();
        }
      ]
    });
  }
  return {
    dir: { input: "src", includes: "_includes", output: "_site" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",
    templateFormats: ["njk", "adoc"]
  };
}

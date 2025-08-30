import pluginAsciiDoc from "eleventy-plugin-asciidoc";
import fs from "node:fs";
import path from "node:path";

/** @type {import("@11ty/eleventy/src/UserConfig")} */
export default function (eleventyConfig) {
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
    return collectionApi.getFilteredByGlob("src/posts/**/*.adoc");
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

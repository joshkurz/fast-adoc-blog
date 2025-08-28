import pluginAsciiDoc from "eleventy-plugin-asciidoc";

/** @type {import("@11ty/eleventy/src/UserConfig")} */
export default function (eleventyConfig) {
  eleventyConfig.addPlugin(pluginAsciiDoc, {
    options: { safe: "unsafe", attributes: { "source-highlighter": "rouge", "sectanchors": true, "toc": "macro" } },
    extensions: [".adoc"]
  });
  eleventyConfig.addPassthroughCopy({ "public": "/" });
  return {
    dir: { input: "src", includes: "_includes", output: "_site" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",
    templateFormats: ["njk", "adoc"]
  };
}

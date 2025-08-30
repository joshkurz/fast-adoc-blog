import fs from "node:fs";

export default (() => {
  try {
    const raw = JSON.parse(fs.readFileSync("config.json", "utf8"));
    // Normalize a top-level theme for templates to use consistently
    if (!raw.theme) {
      raw.theme = (raw.giscus && raw.giscus.theme) || "light";
    }
    return raw;
  } catch {
    return {
      commentsProvider: "off",        // "off" | "giscus" | "waline"
      theme: "light",
      giscus: {
        repo: "",
        repoId: "",
        category: "",
        categoryId: "",
        mapping: "pathname",
        theme: "light",
        lang: "en"
      },
      waline: { serverURL: "" }
    };
  }
})();

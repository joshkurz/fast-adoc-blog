import fs from "node:fs";

export default (() => {
  try {
    const raw = JSON.parse(fs.readFileSync("config.json", "utf8"));
    // Ensure a theme name is available for templates
    if (!raw.theme) {
      raw.theme = "moonstomp";
    }
    return raw;
  } catch {
    return {
      commentsProvider: "off",        // "off" | "giscus" | "waline"
      theme: "moonstomp",
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

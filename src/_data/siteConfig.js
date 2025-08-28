import fs from "node:fs";

export default (() => {
  try {
    return JSON.parse(fs.readFileSync("config.json", "utf8"));
  } catch {
    return {
      commentsProvider: "off",        // "off" | "giscus" | "waline"
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

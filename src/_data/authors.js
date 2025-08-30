import fs from "node:fs";

export default (() => {
  try {
    const cfg = JSON.parse(fs.readFileSync("config.json", "utf8"));
    return cfg.authors || {};
  } catch {
    return {};
  }
})();


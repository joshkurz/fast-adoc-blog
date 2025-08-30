const el = document.getElementById("setup");
const preview = document.getElementById("commentsPreview");

const defaultCfg = {
  theme: "light",
  commentsProvider: "off",
  giscus: { repo:"", repoId:"", category:"", categoryId:"", mapping:"pathname", theme:"light", lang:"en" },
  waline: { serverURL:"" }
};

let cfg = defaultCfg;

// load current config.json (if exists)
fetch("/config.json", { cache: "no-store" })
  .then(r => r.ok ? r.json() : defaultCfg)
  .catch(() => defaultCfg)
  .then(c => {
    const incoming = { ...defaultCfg, ...c };
    // Initialize theme from config.theme or fallback to giscus.theme, else default
    incoming.theme = (c && (c.theme || (c.giscus && c.giscus.theme))) || defaultCfg.theme;
    cfg = incoming;
    // Apply immediately so the page matches initial selection
    if (cfg.theme) document.body.setAttribute("data-theme", cfg.theme);
    render();
  });

function render(){
  el.innerHTML = `
    <fieldset>
      <legend>Theme</legend>
      <label for=\"themeSelect\">Site theme</label>
      <select id=\"themeSelect\">${[
        "light",
        "light_high_contrast",
        "light_tritanopia",
        "preferred_color_scheme",
        "dark",
        "dark_dimmed",
        "dark_high_contrast",
        "dark_tritanopia",
        "transparent_dark",
        "noborder_dark",
        "dark_no_border",
        "nolanlawson"
      ].map(t => `<option value=\"${t}\" ${cfg.theme===t?"selected":""}>${t}</option>`).join("")}</select>
    </fieldset>

    <fieldset>
      <legend>Comments Provider</legend>
      <label><input type="radio" name="p" value="off" ${cfg.commentsProvider==="off"?"checked":""}> Off</label>
      <label><input type="radio" name="p" value="giscus" ${cfg.commentsProvider==="giscus"?"checked":""}> GitHub (giscus)</label>
      <label><input type="radio" name="p" value="waline" ${cfg.commentsProvider==="waline"?"checked":""}> Waline</label>
    </fieldset>

    <div id="giscusFields" style="display:${cfg.commentsProvider==='giscus'?'block':'none'}">
      <h3>giscus</h3>
      <p><small>Paste the full <code>&lt;script ...&gt;</code> snippet from <a href="https://giscus.app" target="_blank" rel="noreferrer">giscus.app</a>. We’ll parse the required values.</small></p>
      <label>
        Paste giscus script
        <textarea id="g_paste" rows="6" style="width:100%" placeholder="&lt;script src=\"https://giscus.app/client.js\" data-repo=\"...\" data-repo-id=\"...\" data-category=\"...\" data-category-id=\"...\" ... async&gt;&lt;/script&gt;"></textarea>
      </label>
    </div>

    <div id="walineFields" style="display:${cfg.commentsProvider==='waline'?'block':'none'}">
      <h3>Waline</h3>
      <label>serverURL <input id="w_url" value="${cfg.waline.serverURL}" placeholder="https://your-waline.vercel.app"></label>
      <p><small><a href="https://waline.js.org/en/guide/deploy/vercel.html" target="_blank" rel="noreferrer">Deploy Waline on Vercel</a></small></p>
    </div>

    <div style="margin-top:1rem;">
      <button id="saveLocal">Save (preview only)</button>
      <button id="saveRepo">Save to repo</button>
      <span id="status" style="margin-left:.5rem;"></span>
    </div>
  `;

  el.querySelectorAll('input[name="p"]').forEach(r =>
    r.addEventListener("change", e => {
      cfg.commentsProvider = e.target.value;
      render();
      showPreview();
    })
  );

  const ids = ["g_paste","w_url"];
  ids.forEach(id => {
    const node = document.getElementById(id);
    if (node) node.addEventListener("input", () => {
      if (id === "g_paste") {
        parseGiscus(node.value);
      } else { cfg.waline.serverURL = node.value.trim(); }
      showPreview();
    });
  });

  const themeSelect = document.getElementById("themeSelect");
  if (themeSelect) {
    themeSelect.addEventListener("change", () => {
      cfg.theme = themeSelect.value;
      document.body.setAttribute("data-theme", cfg.theme);
      showPreview();
    });
  }

  document.getElementById("saveLocal").onclick = () => {
    localStorage.setItem("asciBlogConfig", JSON.stringify(cfg));
    msg("Saved locally (preview mode). Use Save to repo to persist.");
  };

  document.getElementById("saveRepo").onclick = async () => {
    const r = await fetch("/api/save-config", {
      method: "POST",
      headers: { "content-type":"application/json" },
      body: JSON.stringify(cfg)
    });
    msg(r.ok ? "Saved to repo 👌 (site will use it on next build)" : "Failed to save (check token)");
  };

  showPreview();
}

function msg(t){ document.getElementById("status").textContent = t; }

function showPreview(){
  preview.innerHTML = "";
  if (cfg.theme) {
    document.body.setAttribute("data-theme", cfg.theme);
  }
  if (cfg.commentsProvider === "giscus" && cfg.giscus.repo) {
    const s = document.createElement("script");
    s.src = "https://giscus.app/client.js";
    s.async = true;
    s.crossOrigin = "anonymous";
    s.setAttribute("data-repo", cfg.giscus.repo);
    if (cfg.giscus.repoId) s.setAttribute("data-repo-id", cfg.giscus.repoId);
    if (cfg.giscus.category) s.setAttribute("data-category", cfg.giscus.category);
    if (cfg.giscus.categoryId) s.setAttribute("data-category-id", cfg.giscus.categoryId);
    s.setAttribute("data-mapping", cfg.giscus.mapping || "pathname");
    s.setAttribute("data-input-position","bottom");
    s.setAttribute("data-reactions-enabled","1");
    s.setAttribute("data-theme", cfg.theme || cfg.giscus.theme || "light");
    s.setAttribute("data-lang", cfg.giscus.lang || "en");
    preview.appendChild(s);
  } else if (cfg.commentsProvider === "waline" && cfg.waline.serverURL) {
    const d = document.createElement("div");
    d.id = "walinePreview"; preview.appendChild(d);
    const css = document.createElement("link");
    css.rel="stylesheet"; css.href="https://unpkg.com/@waline/client@v3/dist/waline.css";
    const js = document.createElement("script");
    js.src = "https://unpkg.com/@waline/client@v3/dist/waline.js";
    js.onload = () => { window.Waline?.init({ el:"#walinePreview", serverURL:cfg.waline.serverURL, login:"force", reaction:true, pageview:true }); };
    preview.append(css, js);
  } else {
    preview.innerHTML = "<em>No provider selected.</em>";
  }
}

function parseGiscus(text){
  const tmp = document.createElement("div");
  tmp.innerHTML = text;
  const s = tmp.querySelector('script[src*="giscus.app/client.js"]');
  if (!s) return;
  const pick = (name) => s.getAttribute(name) || "";
  const fromData = (k) => pick(`data-${k}`);
  cfg.giscus.repo = fromData('repo');
  cfg.giscus.repoId = fromData('repo-id');
  cfg.giscus.category = fromData('category');
  cfg.giscus.categoryId = fromData('category-id');
  cfg.giscus.mapping = fromData('mapping') || cfg.giscus.mapping;
  cfg.giscus.theme = fromData('theme') || cfg.giscus.theme;
  cfg.giscus.lang = fromData('lang') || cfg.giscus.lang;
}

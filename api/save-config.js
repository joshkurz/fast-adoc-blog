// Requires: VERCEL_GITHUB_TOKEN with "repo" scope, and GITHUB_REPO like "user/repo"
export default async function handler(req, res){
  try {
    if (req.method !== "POST") return res.status(405).end();
    const token = process.env.VERCEL_GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPO;
    if (!token || !repo) return res.status(400).json({ error:"Missing server config" });

    // Read body (Next.js/edge-compatible)
    const bodyText = await new Response(req.body).text();
    const cfg = bodyText || "{}";
    const get = await fetch(`https://api.github.com/repos/${repo}/contents/config.json`, {
      headers: { Authorization: `token ${token}`, "User-Agent": "fast-adoc-blog" }
    });
    const { sha } = get.ok ? await get.json() : { sha: undefined };

    const putBody = {
      message: "chore: update blog config",
      content: Buffer.from(cfg).toString("base64"),
      sha
    };
    const put = await fetch(`https://api.github.com/repos/${repo}/contents/config.json`, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "fast-adoc-blog"
      },
      body: JSON.stringify(putBody)
    });
    return res.status(put.ok ? 200 : 500).end();
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

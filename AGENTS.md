# Repository Guidelines

## Project Structure & Modules
- `src/`: Eleventy input.
  - `posts/`: AsciiDoc posts (`.adoc`) with `:page-layout: post.njk`.
  - `_includes/`: Nunjucks templates (`base.njk`, `post.njk`, comments).
  - `_data/siteConfig.js`: reads `config.json` if present.
- `public/`: static assets (`styles.css`, `js/`).
- `api/`: Vercel serverless functions (e.g., `save-config.js`).
- `_site/`: build output (do not edit).
- `.eleventy.js`: 11ty + AsciiDoc plugin config.

## Build, Test, Develop
- `npm run dev`: starts Eleventy with live reload at `http://localhost:8080`.
- `npm run build`: renders site to `_site/`.
- `npm run clean`: removes `_site/`.

Before PRs: run `npm run build` and spot-check pages (home, a post, `/setup`).

## Coding Style & Naming
- Indentation: 2 spaces for JS, Nunjucks, JSON, CSS.
- JS: ES Modules (`type: module`), keep functions small and pure in `api/`.
- Templates: Nunjucks in `_includes/`; prefer simple filters/loops over complex logic.
- AsciiDoc posts: use clear headers and attributes. Example top matter:
  ```adoc
  = My Post Title
  :page-layout: post.njk
  :toc:
  ```
- Filenames: kebab-case (`my-post.adoc`, `feature-toggle.js`).

## Testing Guidelines
- No formal test suite. Validate locally by:
  - `npm run build` completes without errors.
  - Open `_site/` output or use `npm run dev` to review pages.
  - If changing comments or config flow, verify `/setup` preview and provider embed.

## Commit & PR Guidelines
- Commits: short, imperative, scoped (e.g., `feat: add waline preview`, `fix: handle missing config.json`). Commit changes in small, focused increments to keep reviews quick and diffs clear.
- PRs should include:
  - Summary of changes and rationale.
  - Screenshots or GIFs for UI/template changes.
  - Steps to verify (commands + pages to check).
  - Linked issues where applicable.

## Security & Configuration
- Never commit secrets. `VERCEL_GITHUB_TOKEN` and `GITHUB_REPO` must be set as environment variables for `api/save-config.js`.
- `config.json` contains non-secret display settings; review before committing.
- Do not edit `_site/`; it is generated.

## Architecture Notes
- Static site via Eleventy 3 + `eleventy-plugin-asciidoc` (Asciidoctor). Nunjucks templates; AsciiDoc posts under `src/posts/`. Optional serverless endpoints under `api/` for repo-backed config.

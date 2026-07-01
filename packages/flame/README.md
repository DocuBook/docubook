<h1 align="center" style="font-size: 32px;">
  DocuBook Flame 🔥
</h1>
<h3 align="center" style="font-size: 20px;">
  Fast as flame — a Bun-native framework for modern documentation experiences.
</h3>

<p align="center">
    <strong>@docubook/flame</strong> is a lightweight runtime for building documentation websites using React, MDX, and filesystem-based routing — all running on Bun.<br/>
    No heavy abstractions. No complex tooling. Just a minimal layer between your content and the browser.
</p>

---

## Quick Start

```bash
mkdir my-docs && cd my-docs
bun add @docubook/flame
bunx flame init
bun run dev
```

> **Lightweight** — 📦 ~57 kB packed, ~207 kB unpacked. No bloat, just fire.

## Features

- **Bun-native** — instant startup, native TypeScript, fast builds
- **React-first** — JSX/TSX, hooks, component composition
- **MDX content** — write Markdown with embedded React components
- **Filesystem routing** — auto-detect routes from `docs/` folder
- **Lightweight SSR** — React server-side rendering without a heavy framework
- **Client hydration** — interactive islands for sidebar, TOC, and MDX components
- **HMR** — instant reload on docs changes during development
- **Static build** — pre-render all pages to static HTML for deployment

---

## Project Structure

After `flame init`, your project looks like:

```
my-docs/
├── docs/              # Your MDX content
│   └── index.mdx     # Home page
├── docu.json          # Site configuration (navbar, routes, meta)
├── package.json       # Dependencies
└── .docu/
    └── dist/          # Build output (after `bun run build`)
```

---

## Commands

```bash
bun run dev       # Start dev server with HMR
bun run build     # Static build to .docu/dist/
bun run preview   # Serve built output locally
bun run deploy    # Build + prepare for GitHub Pages
```

---

## Configuration

`docu.json` controls your site. Full example:

```json
{
  "$schema": "https://cdn.jsdelivr.net/npm/@docubook/flame/docu.schema.json",
  "meta": {
    "title": "My Docs",
    "description": "Documentation powered by DocuBook Flame",
    "baseURL": "https://example.com",
    "favicon": "/docs/assets/images/favicon.ico"
  },
  "home": {
    "hero": {
      "tagline": "#MyDocs",
      "headline": "Documentation",
      "description": "Welcome to your documentation site.",
      "actions": [
        { "text": "Get Started", "link": "/docs", "theme": "primary" },
        { "text": "GitHub", "link": "https://github.com", "theme": "ghost", "icon": "github" }
      ]
    },
    "features": [
      { "icon": "Zap", "title": "Fast", "description": "Instant builds.", "link": "/docs" }
    ]
  },
  "navbar": {
    "logo": { "src": "/docs/assets/logo.svg", "alt": "Logo" },
    "logoText": "My Docs",
    "menu": [
      { "title": "Home", "href": "/" },
      { "title": "Docs", "href": "/docs" }
    ]
  },
  "footer": {
    "social": [
      { "name": "github", "url": "https://github.com/you" }
    ]
  },
  "repo": {
    "url": "https://github.com/you/repo",
    "edit": true
  },
  "routes": []
}
```

### Repo & Edit Links

The `repo` section enables **"Edit this page"** links on every doc page, pointing directly to the source file in your repository.

```json
{
  "repo": {
    "url": "https://github.com/you/repo",
    "edit": true
  }
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `url` | `string` (URI) | ✅ Yes | Base URL of your repository |
| `edit` | `boolean` | ✅ Yes | Show or hide the edit link on pages |
| `path` | `string` | No | Path template override — see below |

#### Platform Auto-Detection

When `path` is omitted, Flame detects the correct path format from `url` automatically:

| Platform | Domain | Auto-generated path |
|----------|--------|---------------------|
| GitHub | `github.com` | `blob/main/{filePath}` |
| GitLab | `gitlab.com` | `-/blob/main/{filePath}` |
| Bitbucket | `bitbucket.org` | `src/main/{filePath}` |
| Gitea Cloud | `gitea.com` | `src/branch/main/{filePath}` |
| Codeberg (Forgejo) | `codeberg.org` | `src/branch/main/{filePath}` |
| Gogs / self-hosted Gitea / Forgejo | any other host | `src/branch/main/{filePath}` |

For most single-repo projects this is all you need — just set `url` and `edit: true`.

#### When to set `path` manually

Override `path` when auto-detection is not enough. The value must contain `{filePath}` as a placeholder:

**Monorepo** — docs live in a subdirectory, not the repo root:

```json
{
  "repo": {
    "url": "https://github.com/org/monorepo",
    "path": "blob/main/apps/docs/{filePath}",
    "edit": true
  }
}
```

**Non-default branch** — your default branch is not `main`:

```json
{
  "repo": {
    "url": "https://github.com/you/repo",
    "path": "blob/master/{filePath}",
    "edit": true
  }
}
```

**Self-hosted GitLab on a custom domain** — auto-detect falls back to Gitea format, which is wrong for GitLab:

```json
{
  "repo": {
    "url": "https://git.mycompany.com/team/repo",
    "path": "-/blob/main/{filePath}",
    "edit": true
  }
}
```

> **Rule of thumb:** if your docs are at the root of the repo and the branch is `main`, skip `path` — auto-detect handles it. Add `path` only when you need to point to a subdirectory, a different branch, or a self-hosted platform with a non-standard URL format.



### Homepage

The `home` section configures your landing page with a hero section and feature cards:

|      Property      |                             Description                             |
| ------------------ | ------------------------------------------------------------------- |
| `hero.tagline`     | Small text above the headline (e.g., product name)                  |
| `hero.headline`    | **Required.** Main heading text                                     |
| `hero.description` | Description below the headline                                      |
| `hero.actions`     | Array of CTA buttons with `text`, `link`, `theme`, `icon` |
| `features`         | Array of feature cards with `icon`, `title`, `description`, `link`  |

### Theme Colors

Flame uses `@docubook/themes-colors` for its config-driven color system. Configure via `docu.json`:

```json
{
  "themes": {
    "colors": "default"
  }
}
```

#### Preset Themes

Use a preset name as a string. Three built-in presets are available:

|     Name      |    Description    |  Hue   |
| ------------- | ----------------- | ------ |
| `"default"`   | Modern Blue theme | ~210   |
| `"freshlime"` | Fresh Lime theme  | ~85    |
| `"coffee"`    | Rich Coffee theme | ~25–35 |

```json
{
  "themes": {
    "colors": "freshlime"
  }
}
```

#### Custom Hex Colors

Define a custom primary color as a hex value. The full 24-variable palette is auto-generated from it:

```json
{
  "themes": {
    "colors": {
      "primary": "#FF5733"
    }
  }
}
```

| Property  |      Type      | Required |                            Description                            |
| --------- | -------------- | -------- | ----------------------------------------------------------------- |
| `primary` | `string` (hex) | ✅ Yes    | Primary brand color. A full light + dark scale is auto-generated. |

##### What gets auto-generated from `primary`

A single hex color generates **24 CSS variables × 2 modes** (light `:root` + dark `.dark`) plus **12 syntax highlighting tokens × 2 modes** — all derived from the primary color.

|                    Token                     |        Description         |
| -------------------------------------------- | -------------------------- |
| `--background` / `--foreground`              | Page background & text     |
| `--card` / `--card-foreground`               | Card surface & text        |
| `--popover` / `--popover-foreground`         | Popover surface & text     |
| `--primary` / `--primary-foreground`         | Primary brand color & text |
| `--secondary` / `--secondary-foreground`     | Secondary color & text     |
| `--muted` / `--muted-foreground`             | Muted surface & text       |
| `--accent` / `--accent-foreground`           | Accent color & text        |
| `--destructive` / `--destructive-foreground` | Destructive action & text  |
| `--border`                                   | Border color               |
| `--input`                                    | Input field border         |
| `--ring`                                     | Focus ring color           |
| `--radius`                                   | Border radius value        |
| `--base-100` / `--base-200` / `--base-300`   | DaisyUI surface layers     |
| `--base-content`                             | DaisyUI content color      |

#### CLI Override

Override any theme without editing `docu.json`:

```bash
flame dev --theme freshlime
flame build --theme coffee
flame preview --theme default
```

#### Priority

Theme resolution follows this order (first match wins):
1. `--theme` CLI flag (e.g., `flame dev --theme coffee`)
2. `docu.json` → `themes.colors`
3. Falls back to `default` preset

---

### Sidebar

Controls how documentation sections appear in the sidebar. Defaults to **dropdown** mode when not configured.

To switch to **separator** mode, add `sidebar` to the top level of your `docu.json`:

```json
{
  "sidebar": {
    "context": "separator"
  }
}
```

| Mode | Description |
|------|-------------|
| `"dropdown"` (default) | Compact view — a dropdown at the top of the sidebar lets users switch between sections. Only the active section's items are shown. |
| `"separator"` | All sections visible — group header (icon + title) with tree connector line. Items nest under their section. |

```
  Default (dropdown)              Separator
  ┌──────────────────┐       📖 Guides
  │  📖 Guides  ▼    │       │
  ├──────────────────┤       ├─ Introduction
  │  Introduction    │       ├─ Installation
  │  Installation    │       │
  └──────────────────┘       🧩 Markdown
                              │
                              ├─ Accordion
                              ├─ Button
                              └─ Card
```

> Omit `sidebar` entirely → dropdown mode. Set `"context": "separator"` → separator mode. Mode is static per page, no runtime switching.

---

### Routes

When `routes` is an empty array `[]`, Flame automatically scans your `docs/` folder at build-time and generates the sidebar navigation from the directory structure. Folders become collapsible sections, and `.mdx`/`.md` files become links — sorted alphabetically.

To define navigation manually, populate the `routes` array:

```json
{
  "routes": [
    {
      "title": "Getting Started",
      "href": "/getting-started",
      "noLink": true,
      "context": {
        "icon": "BookOpen",
        "title": "Guides",
        "description": "Set up your Documentation"
      },
      "items": [
        { "title": "Introduction", "href": "/introduction" },
        { "title": "Installation", "href": "/installation" }
      ]
    }
  ]
}
```

> Manual routes take priority — if `routes` has entries, folder scanning is skipped entirely.

> Context on a route (`icon`, `title`, `description`) provides metadata for the sidebar context switcher. In **dropdown** mode it fills the dropdown; in **separator** mode it renders the group header + tree. The icon name must match a [Lucide icon](https://lucide.dev/icons) export (e.g., `"BookOpen"`, `"Layers"`).

---

## Routing

```
docs/
├── index.mdx                    → /docs
├── getting-started/
│   ├── introduction.mdx         → /docs/getting-started/introduction
│   └── installation.mdx         → /docs/getting-started/installation
└── components/
    ├── button.mdx               → /docs/components/button
    └── card.mdx                 → /docs/components/card
```

---

## Assets

Place images and static files in `docs/assets/`. They are copied to the build output and accessible at `/docs/assets/`.

```
docs/
├── assets/
│   └── images/
│       ├── logo.svg
│       └── screenshot.png
└── getting-started/
    └── introduction.mdx
```

Reference in MDX:

```mdx
![Screenshot](/docs/assets/images/screenshot.png)
```

> The `docs/assets/` directory is excluded from route scanning — files inside it won't appear in the sidebar.

---

## Plugins

Flame supports a plugin system to extend the build pipeline and dev server. Plugins can inject head/body HTML, transform content, add remark/rehype plugins, intercept API requests, and more.

### Usage in `docu.json`

```json
{
  "plugins": [
    "@docubook/plugin-sitemap",
    ["./plugins/analytics", { "id": "G-XXXXXXX" }]
  ]
}
```

String = npm package or relative path. Tuple `["name", opts]` = factory with options.

### Available Hooks

|               Hook                |                      Purpose                      |
| --------------------------------- | ------------------------------------------------- |
| `onStart`                         | Validate config before build                      |
| `onEnd`                           | Generate files after build (sitemap, RSS)         |
| `onLoad`                          | Transform raw file content before MDX compilation |
| `transformFrontmatter`            | Mutate frontmatter (reading time, SEO)            |
| `transformHtml`                   | Modify final HTML before writing to disk          |
| `injectHead` / `injectBody`       | Inject HTML into `<head>` or before `</body>`     |
| `remarkPlugins` / `rehypePlugins` | Add remark/rehype plugins to the MDX pipeline     |
| `handleRequest`                   | Intercept dev server requests (custom API)        |

### Quick Example

```typescript
import type { DocuBookPlugin } from "@docubook/flame";

export default {
  name: "reading-time",
  setup(build) {
    build.transformFrontmatter((fm, ctx) => ({
      ...fm,
      readingTime: `${Math.ceil((ctx.content ?? "").split(/\s+/).length / 200)} min read`,
    }));
  },
} satisfies DocuBookPlugin;
```

See the [full plugin guide](docs/getting-started/plugins.mdx) for step-by-step instructions.

## Architecture

- **Bun** — runtime, bundler, file watcher
- **React + React DOM** — rendering (SSR + client hydration)
- **@docubook/core** — MDX compilation, rehype/remark plugins
- **@docubook/mdx-content** — pre-built MDX components
- **Tailwind CSS + daisyUI** — styling

---

## Comparison

|      Framework      | Runtime |    UI     |          Approach           |
| ------------------- | ------- | --------- | --------------------------- |
| Docusaurus          | Node.js | React     | Full-featured, plugin-heavy |
| VitePress           | Node.js | Vue       | Lightweight, Vue-only       |
| Nextra              | Node.js | React     | Next.js-based               |
| **@docubook/flame** | **Bun** | **React** | **Minimal, Bun-native SSR** |

---

## Deployment

### GitHub Pages

```bash
bun run deploy
```

This will:
1. Run production build → output to `.docu/dist/`
2. Add `.nojekyll` file
3. Generate `.github/workflows/deploy.yml` (first run only)

Then push to GitHub and enable Pages:
**Settings → Pages → Source: GitHub Actions**

### Manual / Other Hosts

```bash
bun run build
```

Upload the contents of `.docu/dist/` to any static hosting (Netlify, Cloudflare Pages, Vercel, S3, etc).

---

## Environment Variables

Copy `.env.example` to `.env` to customize:

```env
# Server port (default: 3000)
PORT=3000

# Theme preset (optional — overrides docu.json themes.colors)
# FLAME_THEME=default
# FLAME_THEME=freshlime
# FLAME_THEME=coffee

# Error Monitoring (optional)
SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

---

## Error Monitoring (Optional)

Flame has built-in [Sentry](https://sentry.io) support for error tracking. To enable:

```bash
bun add @sentry/bun
```

Then set environment variables:

```env
SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

Errors during dev server and build will be automatically captured. No configuration needed beyond the DSN.

---

## Requirements

- [Bun](https://bun.sh) >= 1.1.0

---

## License

MIT

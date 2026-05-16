<p align="center">
  <img
    src="../../apps/web/public/images/docu.svg"
    alt="DocuBook Logo"
    width="60"
    height="60"
  />
  <span style="font-size:40px">+</span>
  <img
    src="../../apps/web/public/images/bun.svg"
    alt="Bun Logo"
    width="60"
    height="60"
  />
</p>

<h1 align="center" style="font-size: 32px;">
  DocuBook Flame 🔥
</h1>
<h3 align="center" style="font-size: 20px;">
  Fast as flame — a Bun-native framework for modern documentation experiences.
</h3>

<p align="center">
    <strong>@docubook/flame</strong> is a lightweight runtime for building documentation websites using React, MDX, and filesystem-based routing — all running on Bun.</br>
    No heavy abstractions. No complex tooling. Just a minimal layer between your content and the browser.
</p>

---

## Features

- **Bun-native** — instant startup, native TypeScript, fast builds
- **React-first** — JSX/TSX, hooks, component composition, no framework lock-in
- **MDX content** — write Markdown with embedded React components
- **Filesystem routing** — powered by Bun FileSystemRouter (Next.js-style conventions)
- **Lightweight SSR** — React server-side rendering without a heavy application framework
- **Client hydration** — interactive islands for sidebar, TOC, and MDX components
- **HMR** — instant reload on docs changes during development
- **Static build** — pre-render all pages to static HTML for deployment

---

## Project Structure

```
your-project/
├── docs/              # MDX content (user writes here)
├── docu.json          # site configuration
└── .docu/             # framework internals (hidden)
    ├── lib/           # server, build, hydration, utilities
    ├── pages/         # route components
    ├── components/    # UI components
    ├── styles/        # global styles
    └── dist/          # build output
```

---

## Routing

```
.docu/pages/
├── index.tsx              → /
├── 404.tsx                → 404 page
└── docs/
    └── [[...slug]].tsx    → /docs/*
```

| Route              | Example                          |
| ------------------ | -------------------------------- |
| `/`                | Landing page                     |
| `/docs/`           | Docs index                       |
| `/docs/intro`      | Single doc page                  |
| `/docs/api/users`  | Nested doc page                  |

---

## Commands

```bash
bun dev       # start dev server with HMR
bun run build # static build to .docu/dist
bun preview   # serve built output locally
bun deploy    # build + prepare for GitHub Pages
```

---

## Architecture

Core stack:

- **Bun** — runtime, bundler, file watcher
- **React + React DOM** — rendering (SSR + client hydration)
- **@docubook/core** — MDX compilation, rehype/remark plugins
- **@docubook/mdx-content** — pre-built MDX components
- **Bun FileSystemRouter** — route matching
- **Tailwind CSS + daisyUI** — styling

---

## Package Ecosystem

```
@docubook/core          # MDX pipeline (parse, compile, plugins)
@docubook/flame         # runtime framework (this package)
@docubook/mdx-content   # MDX components (framework-agnostic)
@docubook/cli           # project scaffolding
```

---

## Use Cases

- Documentation websites
- Component library docs
- Design system references
- Internal developer portals
- API documentation
- Knowledge bases

---

## Comparison

|     Framework     | Runtime |  UI   |          Approach           |
| ----------------- | ------- | ----- | --------------------------- |
| Docusaurus        | Node.js | React | Full-featured, plugin-heavy |
| VitePress         | Node.js | Vue   | Lightweight, Vue-only       |
| Nextra            | Node.js | React | Next.js-based               |
| `@docubook/flame` | Bun     | React | Minimal, Bun-native SSR     |

---

## License

MIT

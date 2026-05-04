---
name: docubook-native
description: DocuBook Native static documentation template - Bun + daisyUI + MDX. Use when scaffolding, building, or serving DocuBook documentation sites.
---

# DocuBook Native

Lightweight documentation starter kit using Bun + daisyUI + MDX.

## When to Use This Skill

Use this skill when the user wants to:
- Create a new documentation site
- Build documentation from MDX files
- Scaffold a docs project
- Run a local dev server
- Deploy static docs to production

## Project Structure

```
project/
├── .docu/                    # DocuBook core
│   ├── build.ts              # Build pipeline
│   ├── server.ts             # Dev server
│   ├── markdown.ts           # MDX service
│   ├── hydrate.ts            # Client bundle
│   ├── ...                   # any files
│   ├── components/           # UI components
│   |    └── base/            # daisyUI with wrapper react
│   |    ├── Breadcumb.tsx    # react UI components consume - base
│   |    └── ...              # any files
│   └── dist/                 # Build output
├── docs/                     # MDX source files
│   ├── index.mdx
│   └── getting-started/
│       └── introduction.mdx
├── docu.config.ts           # Config file
├── docu.json                # Settings
├── package.json
└── tailwind.config.ts
```

## Key Files

|        File         |                                  Purpose                                   |
| ------------------- | -------------------------------------------------------------------------- |
| `.docu/build.ts`    | Build: parse MDX → serialize → compile → output static HTML                |
| `.docu/server.ts`   | Dev server using Bun.serve                                                 |
| `.docu/markdown.ts` | MDX service using @docubook/core + next-mdx-remote + @docubook/mdx-content |
| `.docu/hydrate.ts`  | Client-side React hydration                                                |
| `docu.json`         | Site config (navbar, meta, menu)                                           |

## Commands

```bash
# Start dev server (HMR)
bun dev

# Build static site
bun build

# Clean dist
bun clean
```

## Dependencies

- `bun` - Runtime, dev server, bundler
- `@docubook/core` - MDX serialization
- `@docubook/mdx-content` - MDX components
- `daisyui` - UI components (via CDN for simplicity)
- `react` / `react-dom` - Client hydration

## Build Pipeline

1. **Parse MDX** - Read files from `/docs`
2. **Serialize** - next-mdx-remote serialize
3. **Compile** - Generate static HTML
4. **Output** - Write to `/dist`

## Deployment

Output goes to `.docu/dist/` — deploy to:
- Cloudflare Pages
- Vercel
- Netlify

## Caveats

- SSG only — no backend
- Uses CDN for React/daisyUI in dev
- No hot module replacement in true sense — rebuild on change
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
├── .docu/                    # core directory
│   ├── build.ts              # Build pipeline
│   ├── server.ts             # Dev server
│   ├── prerender.ts          # MDX service as prerender static
│   ├── hydrate.ts            # Client bundle
│   ├── ...                   # any files
│   ├── components/           # UI components
│   |    └── base/            # daisyUI with wrapper react
│   |    ├── Breadcumb.tsx    # react UI components consume - base
│   |    └── ...              # any files
│   └── dist/                 # Build output
├── docs/                     # MDX source files
│   ├── .assets               # static images
│   └── index.mdx
│   └── getting-started/
│       └── introduction.mdx
├── docu.json                # Settings
├── package.json
└── ...
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
- `tailwindcss` - token based color via variable (colors) via [jsdelivr](https://www.jsdelivr.com/) build by native

## Colors - via [jsdelivr](https://www.jsdelivr.com/) for tokens color based

```css
/* CSS variables - Modern Blue Theme + daisyUI tokens */
@layer base {
  :root {
    --base-100: 100% 0 0;
    --base-200: 98% 0 2;
    --base-300: 95% 0 4;
    --base-content: 222% 47% 11%;
    --background: 210 40% 98%;
    --foreground: 220 30% 15%;
    --card: 0 0% 100%;
    --card-foreground: 220 30% 15%;
    --popover: 0 0% 100%;
    --popover-foreground: 220 30% 15%;
    --primary: 210 81% 56%;
    --primary-foreground: 0 0% 100%;
    --secondary: 210 30% 90%;
    --secondary-foreground: 220 30% 15%;
    --muted: 210 20% 92%;
    --muted-foreground: 220 15% 50%;
    --accent: 200 100% 40%;
    --accent-foreground: 0 0% 100%;
    --destructive: 0 85% 60%;
    --destructive-foreground: 0 0% 100%;
    --border: 210 20% 85%;
    --input: 210 20% 85%;
    --ring: 210 81% 56%;
    --radius: 0.5rem;
  }

  .dark {
    --base-100: 35% 15% 8%;
    --base-200: 33% 12% 10%;
    --base-300: 30% 14% 14%;
    --base-content: 210 30% 96%;
    --background: 220 25% 10%;
    --foreground: 210 30% 96%;
    --card: 220 25% 15%;
    --card-foreground: 210 30% 96%;
    --popover: 220 25% 15%;
    --popover-foreground: 210 30% 96%;
    --primary: 210 100% 65%;
    --primary-foreground: 220 25% 10%;
    --secondary: 215 25% 20%;
    --secondary-foreground: 210 30% 96%;
    --muted: 215 20% 25%;
    --muted-foreground: 215 20% 65%;
    --accent: 200 100% 60%;
    --accent-foreground: 0 0% 100%;
    --destructive: 0 85% 70%;
    --destructive-foreground: 0 0% 100%;
    --border: 215 20% 25%;
    --input: 215 20% 25%;
    --ring: 210 100% 65%;
    --radius: 0.5rem;
  }
}
```

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
# DocuBook – Copilot Instructions

## Build & Dev Commands

Run from the monorepo root unless noted:

```bash
pnpm dev              # Start all dev servers (Turborepo)
pnpm dev:web          # Start only the web app (apps/web)
pnpm build            # Build all packages
pnpm lint             # Lint all packages
pnpm lint:fix         # Auto-fix lint issues
pnpm format           # Format with Prettier
pnpm format:check     # Check formatting without writing
pnpm typecheck        # Type-check all packages
pnpm clean            # Remove build artifacts
```

From `apps/web`:

```bash
pnpm dev              # next dev
pnpm build            # next build
pnpm lint             # eslint .
```

There are no tests configured in this project.

## Architecture Overview

This is a pnpm + Turborepo monorepo with one active app (`apps/web`) and shared packages (`packages/eslint-config`, `packages/typescript-config`, `packages/ui`).

### Content System

- MDX files live in `apps/web/docs/`
- The catch-all route `apps/web/app/docs/[[...slug]]/page.tsx` handles all doc pages
- Content is compiled server-side with `next-mdx-remote/rsc`
- Supported file patterns: `docs/{slug}.mdx` or `docs/{slug}/index.mdx`
- YAML frontmatter (via `gray-matter`) provides `title`, `description`, `image`, `date`

### Navigation & Route Config

All navigation, sidebar structure, metadata, and Algolia search config are defined in a single file: `apps/web/docu.json`. The file is validated against a JSON schema (`"$schema": "https://docubook.pro/docu.schema.json"`).

Route entries use this shape (defined in `lib/routes.ts`):

```typescript
type EachRoute = {
  title: string;
  href: string;       // relative segment, e.g. "/introduction"
  noLink?: true;      // section header — no clickable page
  context?: { icon: string; description: string; title?: string };
  items?: EachRoute[];
};
```

`ROUTES` (exported from `lib/routes.ts`) is the full tree; `page_routes` is its flattened list used for prev/next pagination. Both are derived directly from `docu.json` — editing the JSON is all that's needed to change navigation.

### MDX Component Registration

Custom MDX components are registered in `apps/web/lib/markdown.ts` in the `components` object. When adding a new MDX component, export it from `apps/web/components/markdown/` and add it to the `components` map in `markdown.ts`.

MDX component files follow the naming pattern `{ComponentName}Mdx.tsx` (e.g., `CardMdx.tsx`, `NoteMdx.tsx`).

Available MDX components (usable directly in `.mdx` files):

| Component | Source file |
|---|---|
| `<Note>` | `NoteMdx.tsx` |
| `<Card>`, `<CardGroup>` | `CardMdx.tsx`, `CardGroupMdx.tsx` |
| `<Accordion>`, `<AccordionGroup>` | `AccordionMdx.tsx`, `AccordionGroupMdx.tsx` |
| `<Stepper>`, `<StepperItem>` | `StepperMdx.tsx` |
| `<Tabs>`, `<TabsList>`, `<TabsTrigger>`, `<TabsContent>` | `ui/tabs` |
| `<Button>` | `ButtonMdx.tsx` |
| `<Kbd>` | `KeyboardMdx.tsx` |
| `<Youtube>` | `YoutubeMdx.tsx` |
| `<Tooltip>` | `TooltipsMdx.tsx` |
| `<File>`, `<Files>`, `<Folder>` | `FileTreeMdx.tsx` |
| `<Release>`, `<Changes>` | `ReleaseMdx.tsx` |
| `<Outlet>` | `OutletMdx.tsx` — renders child route cards for a `noLink` section |

`<img>`, `<a>`, `<pre>`, and all `<table>` elements are also overridden globally.

### Search

Powered by Algolia DocSearch. Config comes entirely from environment variables:

```
NEXT_PUBLIC_ALGOLIA_DOCSEARCH_APP_ID
NEXT_PUBLIC_ALGOLIA_DOCSEARCH_API_KEY
NEXT_PUBLIC_ALGOLIA_DOCSEARCH_INDEX_NAME
NEXT_PUBLIC_ALGOLIA_DOCSEARCH_ASKAI_ASSISTANT_ID
```

### Layouts

- `app/layout.tsx` — Root: provides `ThemeProvider`, `SearchProvider`, `Navbar`, `Footer`
- `app/docs/layout.tsx` — Docs: adds `Leftbar` (sidebar) and `DocsNavbar`
- `app/docs/[[...slug]]/page.tsx` — Renders MDX content with breadcrumb, TOC, edit link, and prev/next pagination

## Key Conventions

### TypeScript

- Strict mode throughout; avoid `any` (use `unknown`)
- Prefer `interface` for component props; use `type` for unions and utility types
- Prefix intentionally unused params with `_` (e.g., `_event`)

### UI Components (Radix-based)

The canonical pattern for `components/ui/` components:

```typescript
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva("base-classes", {
  variants: { variant: { default: "..." }, size: { default: "..." } },
  defaultVariants: { variant: "default", size: "default" },
})

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

Key points: extend the native HTML element's attributes, expose `asChild` via `Slot`, always set `displayName`.

### Components

- Use `React.forwardRef` for components accepting refs; set `displayName`
- Use `class-variance-authority` (CVA) for variant-based props
- Use `cn()` (from `lib/utils.ts`) to merge Tailwind classes — `cn` wraps `clsx` + `tailwind-merge`

### Client vs Server Components

Default to Server Components. Add `"use client"` only when using hooks, browser APIs, or client-side event handlers.

### Lucide Icons in MDX

Icon names in MDX props are string-based and resolved dynamically:

```typescript
const Icon = icon ? (Icons[icon] as React.FC<{ className?: string }>) : null;
```

Pass the exact Lucide icon name as a string (e.g., `icon="BookOpen"`).

### Imports

Order: external packages → internal aliases (`@/`) → relative paths. Use named exports throughout.

### Styling

Use Tailwind CSS exclusively. Use `@tailwindcss/typography` (`prose` classes) for MDX body content. Custom overrides go in `apps/web/styles/override.css`.

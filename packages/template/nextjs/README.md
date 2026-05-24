# DocuBook — Next.js (Vercel)

A documentation starter template optimized for **zero-config deployment on Vercel**. Built on Next.js App Router with automatic static optimization and edge-ready performance.

## Features

- **Vercel-optimized** — deploys with zero configuration via `vercel` or Git integration
- **Automatic Static Optimization** — pages pre-rendered at build time for instant loads
- **Edge & ISR Support** — incremental static regeneration for content updates without full rebuilds
- **Built-in Analytics** — compatible with Vercel Analytics and Speed Insights
- **MDX Content** — write documentation in Markdown/MDX with full component support
- **SEO Friendly** — automatic sitemap, meta tags, and structured data
- **Responsive Design** — optimized for desktop and mobile devices
- **Quick Search** — fast client-side documentation search

## Installation

```bash
npx @docubook/cli@latest
```

#### command output

![command output](https://github.com/DocuBook/docubook/blob/main/docubook-cli.png)

---

## Deployment

Push to GitHub and connect to [Vercel](https://vercel.com) — no additional configuration needed. The framework is auto-detected and deployed.

For Docker-based or self-hosted deployments, use the [`nextjs-docker`](../nextjs-docker) template instead.

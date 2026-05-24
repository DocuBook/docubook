# DocuBook — Next.js (Docker)

A documentation starter template with a **production-ready Docker setup** using multi-stage builds and Next.js standalone output. Designed for self-hosted and containerized environments.

## Features

- **Multi-stage Dockerfile** — build stage compiles, production stage runs on minimal Alpine base
- **Standalone Output** — only runtime artifacts in the final image (~100MB vs ~1GB full node_modules)
- **Container-native** — single-process design compatible with any orchestrator
- **Platform-agnostic** — works with Coolify, Kubernetes, Railway, Fly.io, Render, or any Docker host
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

Build and run the Docker image:

```bash
docker build -t docubook:latest .
docker run -p 3000:3000 -e NODE_ENV=production docubook:latest
```

### Platform notes

| Platform | Notes |
|----------|-------|
| **Coolify / Docker VPS** | Push image to registry, deploy as standard container (PORT=3000) |
| **Kubernetes** | Create Deployment + Service; image runs single process on PORT |
| **Railway / Fly.io / Render** | Auto-detected from Dockerfile; set env vars via provider panel |

For Vercel deployment (no Docker needed), use the [`nextjs`](../nextjs) template instead.

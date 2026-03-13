# DocuBook

**DocuBook** is a documentation web project designed to provide a simple and user-friendly interface for accessing various types of documentation. This site is crafted for developers and teams who need quick access to references, guides, and essential documents.

## Features

- **Easy Navigation**: Simple layout for quick navigation between pages.
- **Quick Search**: Easily find documentation using a search function.
- **Responsive Theme**: Responsive design optimized for devices ranging from desktops to mobile.
- **Markdown Content**: Support for markdown-based documents.
- **SEO Friendly**: Optimized structure for search visibility, enhancing accessibility on search engines.

## Installation

```bash
npx @docubook/cli@latest
```

#### command output

![command output](https://github.com/DocuBook/docubook/blob/main/cli-docubook.png)

---

## Docker & Deployment (template notes)

This template includes an opinionated Docker setup optimized for building a small, production-ready Next.js standalone image using multi-stage builds and an Alpine base. It's intended for hosting on environments such as Coolify, generic Docker VPS, Kubernetes, Railway, Fly.io, and Render.

Key points:

- Uses Next.js "standalone" build (next build + next export/standalone) so only runtime artifacts are copied into the final image.
- Multi-stage Dockerfile: build stage (node toolchain) → production stage (lightweight Alpine / node runtime).
- Final image is minimal (Alpine-based) to reduce size and attack surface.
- Works with container platforms that expect a single-process container (node server) and supports common env vars (PORT, NODE_ENV).

Quick usage (from project root):

```bash
docker build -t docubook:latest -f packages/template/nextjs-docker/Dockerfile .
docker run -p 3000:3000 -e NODE_ENV=production docubook:latest
```

Notes for specific platforms:

- Coolify / Docker VPS: push this image to your registry and deploy as a standard container. Ensure PORT is set (default 3000).
- Kubernetes: create a Deployment and Service — the image expects a single process on PORT.
- Railway / Fly.io / Render: use the image or the build commands; these providers typically detect and run the exported server. Use the provider's env var panel to set NEXT_PUBLIC or backend secrets.

Authoring tips:

- Keep NODE_ENV=production when building the runtime image.
- If you need native dependencies, install them in the build stage only.
- For smaller images, prefer node:alpine for the final stage and remove dev dependencies early.

This section augments the existing README with deployment guidance specifically for the Next.js Docker template; it does not replace the template's Dockerfile or other files — it documents the intended usage and hosting targets.

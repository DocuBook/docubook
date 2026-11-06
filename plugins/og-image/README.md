# @docubook/plugin-og-image

Social preview cards for [DocuBook Flame](https://github.com/DocuBook/docubook/tree/main/packages/flame). Every page gets a 1200×630 OpenGraph image built from its frontmatter, with your logo, site name and theme colours. Authors write nothing extra: `title` and `description` are enough.

Cards are rendered at build time with [Takumi](https://github.com/kane50613/takumi), a native renderer that needs no browser. A card takes a few milliseconds, and a build only renders the cards whose text or branding changed.

## Install

```bash
npm install -D @docubook/plugin-og-image
```

```json
{
  "meta": {
    "baseURL": "https://docs.example.com"
  },
  "plugins": ["@docubook/plugin-og-image"]
}
```

Set `meta.baseURL`: social sites only read absolute image URLs.

## What it does

- Sets each docs page's `image` to its card, so Flame writes the `og:image` tag as it does for an image you set yourself.
- Adds `og:image:width`, `og:image:height`, `og:image:type` and `og:image:alt`.
- Gives the landing page a card too, unless `meta.ogImage` already sets its image.
- Writes the cards to `<docs prefix>/assets/og/`, e.g. `/docs/assets/og/guides/setup.1a2b3c4d.png`. The hash in the name changes with the card's text, so social sites fetch the new card instead of a cached one.
- Serves the same cards from `flame dev`.

A page keeps its own image when its frontmatter sets `image`. `og: false` turns the card off for one page; `og.title` and `og.description` change the card's text without touching the page.

```yaml
---
title: Configuration reference for docu.json
description: Every option in docu.json.
og:
  title: Configuration
---
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `layout` | `"card"` \| `"minimal"` | `"card"` | `card` adds the section name, a page-kind chip, a logo tile and a brand bar. `minimal` shows logo, title, description and domain on a plain background. |
| `logo` | string \| `false` | `navbar.logo.src` | Logo file: a project path (`brand/logo.svg`) or a site path (`/docs/assets/logo.svg`). SVG, PNG, JPEG or WebP, at most 1 MB. `false` renders no logo. |
| `siteName` | string | `navbar.logoText`, then `meta.title` | Name in the card's top row. |
| `pages` | `{ docs?, index?, home? }` | all `true` | Which pages get a card. |
| `fonts` | `{ path, weight?, style? }[]` | none | Fonts tried before the built-in Geist, which covers Latin-1 only. Add one for titles in other scripts. |

The build warns when a title has characters no loaded font can draw, and names the pages.

## How it works

`transformFrontmatter` sets `image: ./assets/og/<slug>.<hash>.png`, which Flame resolves against `meta.baseURL` and the docs prefix. `onEnd` reads every page's frontmatter, renders the cards that are missing or out of date, deletes cards of removed pages, and records what it wrote in `.docu/og-image.json`. Takumi's `render()` never touches the network: the logo and fonts are read from disk.

## Development

```bash
pnpm --filter @docubook/plugin-og-image build
pnpm --filter @docubook/plugin-og-image test
UPDATE_GOLDEN=1 pnpm --filter @docubook/plugin-og-image test   # after an intended layout change
```

The golden-image tests compare against `src/__tests__/__golden__/` on Linux x64 only, where CI runs.

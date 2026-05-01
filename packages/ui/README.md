# @docubook/ui

React UI base components for the DocuBook ecosystem.

## Goals

- Provide importable React components for DocuBook apps and templates.
- Keep visual styling token-based with Tailwind CSS classes and CSS variables.
- Use Base UI as the primary headless foundation for component behavior.
- Preserve shadcn-like ergonomics for common components such as `Button`, `Card`, and `Dialog`.

## Usage

```tsx
import { Button, Card, Dialog, DialogContent, DialogTrigger } from "@docubook/ui"
```

Subpath exports are also available:

```tsx
import { Button } from "@docubook/ui/base"
import { cn } from "@docubook/ui/utils"
```

## Styling Contract

This package does not ship a global theme. Consumers provide Tailwind CSS and
semantic CSS variables such as `--background`, `--foreground`, `--primary`,
`--border`, and `--ring`.

## Scope

This package owns reusable base components. App-specific layout, docs navigation,
search, theme providers, config-aware logos, and route-aware links stay in the
consuming app or template.

---
"@docubook/core": minor
"@docubook/markdown": minor
---

GFM alerts now render as DocuBook callouts, and the callout palette gains a dedicated `important` variant with GitHub's styling.

### `@docubook/core` — feat

- **feat(core):** new `remarkGithubAlert` remark plugin, wired into the default remark chain (`createDefaultRemarkPlugins`) and exported from the package root: GitHub alert blockquotes (`> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`, `> [!CAUTION]`) are converted into callout components before MDX compilation, so pages authored for GitHub render with DocuBook's callout styling instead of a plain blockquote with a literal `[!NOTE]` marker. The marker must be the first line of the blockquote (a marker on a later line stays a plain quote), matching is case-insensitive, the marker is stripped from the body, and rich body content (inline markup, lists, multiple paragraphs) is preserved. Works in both `mdx` and `md` formats.

### `@docubook/markdown` — feat

- **feat(markdown):** GFM alert mapping — `[!NOTE]` renders as `Info`, `[!TIP]` as `Tip`, `[!WARNING]` as `Warning`, and `[!CAUTION]` as `Danger`, each with the GitHub label as the callout title ("Note", "Caution", …).
- **feat(markdown):** new `important` callout variant, registered as `GfmImportant` — GitHub's purple accent (`#8250df`) and the `MessageSquareWarning` icon, so `[!IMPORTANT]` no longer reuses the blue `Info` callout. It is deliberately not registered as `Important`: `:::important` stays a non-existent directive, and `GfmImportant` exists for GFM alerts only.

### `@docubook/markdown` — fix

- **fix(markdown):** `success` is now visually distinct from `tip` — emerald `hsl(160 84% 30%)` instead of the shared green `hsl(137 50% 35%)`. Previously the two variants were indistinguishable by colour and differed only by icon.

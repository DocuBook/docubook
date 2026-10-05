---
"@docubook/core": patch
"@docubook/flame": patch
"@docubook/markdown": patch
"@docubook/themes-colors": patch
"@docubook/ui-react": patch
---

Refresh the DocuBook toolchain and align every package on React 19.3.

The workspace-wide React override now pins `react`, `react-dom`, `@types/react`, and `@types/react-dom` to `19.3.0`, and the packages that shipped their own copies (some as stale exact pins) now declare matching `^19.3.0` ranges. Internal minor/patch dependency drift is cleaned up at the same time; no public API changes.

### `@docubook/core`
- Runtime: `@mdx-js/mdx` and `@mdx-js/react` → `^3.1.1`, `tailwind-merge` → `^3.7.0`, `vfile` → `^6.0.3`, `vfile-matter` → `^5.0.1`, `zod` → `^4.6.5`.
- Dev: `@types/react` moves from a pinned `19.2.18` to `^19.3.0`, `react` → `^19.3.0`, `mdast-util-directive` → `^3.1.1`, `unified` → `^11.0.5`, `vite` → `^8.3.2`.

### `@docubook/flame`
- Runtime: `@mdx-js/react` → `^3.1.1`, `daisyui` → `^5.7.47`, `lucide-react` → `^1.52.0`, `react`/`react-dom` → `^19.3.0`, `unified` → `^11.0.5`, `vite` → `^8.3.2`, `zod` → `^4.6.5`.
- Unpinned the Tailwind tooling: `@tailwindcss/cli` and `@tailwindcss/typography` move from exact pins (`4.3.0`/`0.5.16`) to `^4.3.3`/`^0.5.20`. This removes a duplicate `tailwindcss` install — the CLI previously pulled in `4.3.0` while the rest of the workspace used `4.3.3` — so the build now resolves a single `tailwindcss@4.3.3`.
- Dev: `@types/node` → `^22.20.5`, `@types/react`/`@types/react-dom` → `^19.3.0`, `bun-types` → `^1.4.2`, `tailwindcss` → `^4.3.3`.

### `@docubook/markdown`
- Runtime: `mermaid` → `^11.17.2`.
- Dev: `@testing-library/jest-dom` → `^6.10.0`, `@testing-library/react` → `^16.3.3`, `lucide-react` → `^1.52.0`, `react-icons` → `^5.7.0`, `react`/`react-dom` → `^19.3.0`, `@types/react`/`@types/react-dom` unpinned to `^19.3.0`, `vite` → `^8.3.2`.

### `@docubook/ui-react`
- Dev only: `@testing-library/jest-dom` → `^6.10.0`, `@testing-library/react` → `^16.3.3`, `react`/`react-dom` → `^19.3.0`, `@types/react` → `^19.3.0`, `vite` → `^8.3.2`.

### `@docubook/themes-colors`
- Dev only: `@types/node` → `^25.9.9`, `@vitest/coverage-v8` → `^4.1.11`, `vite` → `^8.3.2`.

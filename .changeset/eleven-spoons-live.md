---
"@docubook/flame": minor
---

Add `sidebar.context` configuration with two modes: "dropdown" (default) and "separator"

**Schema & types:**
- Add `sidebar` object to `docu.schema.json` with `context` enum `["dropdown", "separator"]`, default `"dropdown"`
- Add `DocuSidebar` interface and optional `sidebar` field to `DocuConfig`

**Separator mode components:**
- New `SidebarGroupHeader` — renders icon (Lucide) + title for each context section
- Separator branch in `Menu.tsx` — filters routes with `context`, renders headers + tree connector + nav items
- `Context.tsx` returns `null` in separator mode (context switcher not needed)

**Visual:**
- Icon wrapped in styled span matching Context.tsx dropdown pattern
- Padding aligned with level-0 Sublink items
- Tree connector line (`border-l-2`) connecting section header to its items
- Tight spacing between header and items

**Backward compatible:**
- Absent `sidebar` or `sidebar.context === "dropdown"` preserves existing behavior
- Dropdown mode code path unchanged
- Sublink.tsx behavior unchanged

---

Expand `detectPlatformPath` platform support and improve `repo` schema

**Platform detection (`node/helpers.ts`):**
- Add explicit cases for `gitea.com` (Gitea Cloud) and `codeberg.org` (Forgejo)
- Update JSDoc comment — fallback now described as "Gogs, Forgejo, or any self-hosted Gitea-compatible forge"
- Previously only GitHub, GitLab, Bitbucket were explicit; all others fell through to GitHub-style fallback (incorrect for Gitea-based platforms)

**Schema (`docu.schema.json`):**
- `repo.url`: add `format: "uri"`, expand description to list all supported platforms, add `examples` for GitHub / GitLab / Bitbucket / Gitea / Codeberg
- `repo.path`: add `pattern: \{filePath\}` for editor validation, expand description with format guide and auto-detect note, add `examples` covering root repo + monorepo + non-default branch for all platforms

**Documentation (`README.md`):**
- Add dedicated `### Repo & Edit Links` section with platform auto-detection table, property table, and three annotated override examples (monorepo, non-default branch, self-hosted GitLab on custom domain)
- Update full config example — remove hardcoded `path` to reflect that it is optional for root repos

**Tests:**
- `helpers.test.ts`: add unit tests for `gitea.com` and `codeberg.org` in `detectPlatformPath` and platform integration loop (22 tests total)
- `schema.test.ts`: add `docu.schema.json — repo.url field` and `docu.schema.json — repo.path field` describe blocks covering `format`, `pattern`, `examples`, and `description` content (22 schema tests total)

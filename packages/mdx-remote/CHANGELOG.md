# @docubook/mdx-remote

## 1.0.0

### Initial Release

- [#293](https://github.com/DocuBook/docubook/pull/293) [`e80009d`](https://github.com/DocuBook/docubook/commit/e80009d03dd7c33e0825ebc5c05def76fd749008) Thanks [@gitfromwildan](https://github.com/gitfromwildan)! - Rewrite `next-mdx-remote` as `@docubook/mdx-remote` (MPL-2.0)

  - New `@docubook/mdx-remote` package with `serialize()`, `compileMDX()`, and `<MDXRemote>` (RSC + client)
  - Default `blockJS:true` strips JS expressions; defense-in-depth sanitizer audits dangerous patterns in all modes
  - Fixes `_jsxDEV` / `_jsxs` crash by merging both `react/jsx-runtime` and `react/jsx-dev-runtime` into scope
  - Removes `useDynamicImport` from public API (no callers, missing `baseUrl`)
  - Removes dead `parsePositionFromMessage` code
  - Adds unit test coverage (serialize + sanitizer paths)

  Wire `@docubook/core` to consume the new local package instead of `next-mdx-remote`

  - Update imports in `compile.ts` to use `@docubook/mdx-remote/rsc`, `/serialize`, and the main entry
  - Bump `@11ty/gray-matter` to `^2.1.0`

  Remove unused Next.js adapter from `@docubook/mdx-content`

  - Deletes `src/adapters/next/` (ButtonMdx, CardMdx, ImageMdx, LinkMdx)
  - Removes `./next` export and `peerDependenciesMeta.next` from package.json
  - Cleans up tsup build config

  Drop `mdx-jsx-runtime` esbuild/Bun plugin from flame hydrate

  - Plugin was only needed for `next-mdx-remote`'s CJS jsx-runtime shim; our ESM package resolves natively

  Flame build improvements

  - Remove build summary feature (poor DX)
  - Fix runtime detection for Deno npm compat (`process.execPath.includes("deno")` before `typeof Bun`)
  - Generate `deno.json` with `nodeModulesDir: auto` on Deno scaffold
  - Update scaffold next-steps message with Deno freshness policy hint
  - Format `card.mdx` docs section headings + props table

  Stale doc updates

  - `packages/core/README.md`: replace `next-mdx-remote` → `@docubook/mdx-remote`
  - `packages/mdx-content/README.md`: remove `./next` subpath docs
  - `ARCHITECTURE.md`: replace `next-mdx-remote` → `@docubook/mdx-remote` (CSP note, hydration note)

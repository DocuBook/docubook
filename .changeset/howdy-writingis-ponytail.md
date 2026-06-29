---
"@docubook/flame": patch
---

Security hardening: plugin specifier validation, path traversal defense-in-depth, and DRY refactor

This changeset consolidates seven files worth of security fixes, type safety improvements, and code deduplication for the Flame dev server and plugin system.

### Security fixes

- **Plugin specifier validation**: `resolveSpecifier()` now validates npm package names against the standard npm naming regex before passing to dynamic `import()`. Invalid specifiers (uppercase letters, spaces, special characters) throw a clear `[plugin-loader] Invalid plugin specifier` error instead of silently being passed to Bun's module loader. Path specifiers (relative/absolute) are unaffected.

- **Path traversal guard in `getDocsForSlug()`**: Replaced `join()` + `startsWith(DOCS_DIR)` with `resolve()` + strict guard using `resolvedDocsDir + "/"`. This closes a bypass where a directory named similarly to `DOCS_DIR` (e.g. `/docs-extra`) could sneak past the old prefix check.

- **Decode-before-validate in `serveStatic()`**: `decodeURIComponent()` now runs **before** `isPathSafe()`, ensuring encoded traversal sequences like `%2F` or `%252F` are fully decoded before the path safety check. Previously, validation ran on the raw encoded pathname, leaving a window for double-encoding attacks.

- **Malformed URI graceful degradation**: `decodeURIComponent()` is now wrapped in try/catch. Malformed percent sequences (`%ZZ`, `%GG`) no longer crash the server — they return 404 instead.

- **`/docs/assets/` prefix stripping**: Replaced `string.replace("/docs/assets/", "")` with `string.slice(prefix.length)`. The old approach matched the first occurrence anywhere in the string; `slice` strips exactly N characters from the start, which is semantically correct after a `startsWith` check has already passed.

### Type safety

- **`PORT` environment variable**: Changed from `process.env.PORT ?? "3000"` (yielding a `string`) to `Number(process.env.PORT ?? 3000)` (yielding a `number`), matching `Bun.serve()`'s type expectation.

- **Removed non-null assertions**: Replaced `server.port!` and `server.hostname!` with `server.port ?? PORT` and `server.hostname ?? "localhost"` — proper fallbacks instead of lying to the type checker.

### DRY refactor

- **`wrapPluginResponse()` extracted**: The 13-line plugin response security header wrapping logic (applying `SECURITY_HEADERS` defaults + CSP for HTML responses) was duplicated between `server.ts` and `__tests__/server.test.ts`. Now lives as a single exported function in `security.ts` with a `PluginResponseLike` interface. Both the dev server and the test suite import from one source of truth.

### Documentation fixes

- Corrected JSDoc on `PluginBuilder.remarkPlugins()` and `PluginBuilder.rehypePlugins()`: replaced ambiguous "Plugins from all plugins" with "Plugins from all registered callbacks".

### Test coverage

Added 15 new tests across two test files:

`plugin-loader.test.ts` (8 tests):
- Invalid npm specifiers: uppercase, spaces, special characters
- Valid npm specifiers: scoped, unscoped, dots, tildes

`server.test.ts` (7 tests):
- Decode-before-validate semantics for `serveStatic`
- Malformed URI try/catch pattern
- `slice` vs `replace` prefix stripping
- Resolved path stays within `DOCS_DIR/assets`

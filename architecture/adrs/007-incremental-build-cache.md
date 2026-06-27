# ADR-007: Incremental Build with Content Hashing

## Status

Accepted

## Context

`@docubook/flame` generates static HTML pages from MDX content. On a site with hundreds of pages, rebuilding every page on every deploy is wasteful — most content doesn't change between commits without corresponding MDX edits. Options considered:

1. **Full rebuild every time** — simple but slow for large sites
2. **Build cache with file modification time** — fast but mtime can be unreliable (git checkout restores old mtimes)
3. **Build cache with content hash** — reliable, skips rebuild only when actual content changes

## Decision

Use SHA-256 content hashing with a persistent `build-cache.json` file:

```typescript
interface BuildCache {
  [path: string]: {
    hash: string;     // SHA-256 of MDX content (first 16 hex chars)
    mtime: number;    // File mtime from filesystem
    builtAt: number;  // Timestamp of last build
  };
}
```

**Key behaviors:**
- `shouldRebuild()` returns `true` if path not in cache OR mtime is newer than `builtAt`
- `--force` / `-f` flag skips cache entirely (full rebuild)
- `--clean` / `-c` flag removes `dist/` before build
- Client bundle hash is stored as `__assets__` cache key — if JS/CSS changed, all pages rebuild regardless of MDX caching
- Cache is persisted to `build-cache.json` after each build

## Rationale

- Content hash is deterministic — same content always produces same hash, regardless of filesystem state
- mtime check is a quick first filter (avoids reading file when clearly unchanged)
- Asset hash invalidation ensures visual consistency: if client bundle changed, every page gets the new bundle
- Concurrency (`BUILD_CONCURRENCY`, default 4) runs page builds in parallel for maximum throughput

## Consequences

- Cache file must be committed or regenerated per environment (recommended: committed, as it's small text)
- `--force` is required when cache is stale but content hasn't changed (rare — happens on CI cache miss)
- First build is always full (no cache) — subsequent builds are incremental
- MDX error on one page doesn't block other pages, but build exits with code 1 at the end

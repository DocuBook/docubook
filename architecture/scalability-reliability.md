# Scalability & Reliability

> Growth handling and failure modes for DocuBook.

## Scalability Model

### Per-Framework Scaling Strategy

| Framework | Architecture | Scaling Approach | Bottleneck |
|-----------|-------------|-----------------|------------|
| **flame** | Static HTML on CDN | Infinite horizontal — CDN edge caching | Build time (content volume) — mitigated by incremental builds + concurrency |
| **Next.js/Vercel** | Edge + ISR | On-demand regeneration, edge functions | Cold starts on new pages |
| **react-router** | Stateless Node.js | Horizontal pod scaling | In-memory search index rebuild |

### Build-Time Scalability (flame)

| Mechanism | Implementation | Purpose |
|-----------|---------------|---------|
| **Content hashing** | SHA-256 per MDX file, stored in `build-cache.json` | Skip recompilation for unchanged files |
| **Build cache** | `{ path: { hash, mtime, builtAt } }` persisted between builds | Avoid full rebuild on every `bun run build` |
| **Concurrency** | `BUILD_CONCURRENCY` env var (default 10) — `Promise.all` batched | Parallel MDX compilation + HTML generation |
| **Git dates** | Single `git log --format=%cI --name-only` spawn for all files | Avoid per-file git calls |
| **Asset hash** | Client bundle hash compared (`__assets__` cache key); all pages rebuild only if assets changed | Skip rebuild when only content changes |
| **Turborepo caching** | Content-hash based — skip unchanged package builds | Avoid rebuilding core/mdx-content when unrelated packages change |
| **Parallel execution** | Turborepo runs independent tasks concurrently | Faster CI pipeline |

### Content Growth Projections

| Scale | Pages | Build Time (flame) | Search Index Size |
|-------|-------|-------------------|-------------------|
| Small | < 50 | < 5s | < 100 KB |
| Medium | 50–500 | 5–30s | 100 KB – 1 MB |
| Large | 500–5000 | 30s–5min | 1–10 MB |

**Mitigation for large sites:**
- flame: `BUILD_CONCURRENCY=N` for parallel MDX compilation; incremental builds skip unchanged files
- Next.js: ISR avoids full rebuild — only changed pages regenerate
- react-router: Search index loaded once at startup, rebuilt on deploy

## Reliability

### Failure Modes & Recovery

| Failure | Impact | Recovery |
|---------|--------|----------|
| CDN edge down (flame) | Regional outage | CDN failover to next-nearest PoP |
| Vercel function timeout | Single page 504 | ISR serves stale, regenerates in background |
| Node.js crash (react-router) | Full site down | Process manager restart (PM2/systemd) |
| MDX compilation error | Build fails on that page | Error reported with file path + message; other pages still build; CI blocks deploy |
| Search index corruption | Search returns no results | Rebuild on next deploy |
| Sentry SDK failure | No error reporting | Opt-in, graceful degradation (site still works) |
| `@sentry/bun` not installed | No Sentry integration | Silently skipped — no build error |

### Plugin System Scalability

| Factor | Impact | Mitigation |
|--------|--------|------------|
| **Plugin load time** | `import()` per plugin at build start | Negligible — plugin packages are small (<10KB); 3-5 plugins add <50ms |
| **Hook execution** | Per-page loop over plugin hooks | Sequential loop over <5 plugins + 9 hooks = negligible (<1ms per page) |
| **Plugin memory** | Plugins hold references to config, pages | Plugins are stateless per design — no memory leak risk |
| **Plugin errors** | Fail-fast per design | Build stops with plugin name + error message; CI blocks deploy |
| **Plugin `handleRequest`** | Dev server request path | First-response-wins — plugins return `Response` or `void`; no middleware chain overhead |

**Recommendation:** Plugin count per project should stay <10. Beyond that, consider extracting heavy plugins into separate services (e.g., Algolia indexer as standalone worker).

### Build Reliability

```
Source Change
     │
     ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Lint/Type  │────►│  Unit Tests  │────►│    Build    │
│   Check     │     │   (Vitest)   │     │  (Turbo)    │
└─────────────┘     └──────────────┘     └─────────────┘
     │                     │                     │
     ▼                     ▼                     ▼
  Fail fast           Fail fast           Deploy only
  on errors           on failures         if all pass

CI Matrix Strategy:
  Three jobs run in parallel: lint, typecheck, build, test
  All must pass before merge
  Build uses Bun for flame packages, Node.js for others
  Plugin unit tests run alongside build tests
```

### Availability Targets

| Component | Target | Rationale |
|-----------|--------|-----------|
| Static sites (flame) | 99.99% | CDN-backed, no server logic |
| Production site (Vercel) | 99.95% | Vercel SLA + ISR fallback |
| Self-hosted (react-router/Docker) | 99.9% | Depends on operator infrastructure |

### Graceful Degradation

| Feature | Degraded State | User Impact |
|---------|---------------|-------------|
| Search (Algolia down) | Built-in client search fallback | Slower, less accurate results |
| Theme toggle (JS disabled) | System preference via `prefers-color-scheme` | No manual toggle |
| Sentry (DSN not set) | No error reporting | Zero user impact |
| Social links (API down) | Static fallback from docu.json | Links still work |
| MDX component (import missing) | Component render returns null | That section missing, rest of page works |

## Caching Strategy

| Layer | Cache Type | TTL | Invalidation |
|-------|-----------|-----|--------------|
| CDN (flame) | Edge cache | Long (immutable assets with content hash) | Deploy = full purge |
| Vercel ISR | Stale-while-revalidate | Configurable per page | On-demand revalidation |
| Turborepo | Content-addressed (file hash) | Until source changes | Hash mismatch |
| Browser | Standard HTTP cache | Version bump via asset hash | Changed URL = new cache entry |
| flame `build-cache.json` | File hash map (`{ hash, mtime, builtAt }`) | Until content mtime changes | Hash comparison |
| flame `__assets__` cache | JS + CSS hash comparison | Until client bundle rebuilds | Different hash triggers full rebuild |
| flame plugin cache | Plugin-managed (stateless by design) | N/A | Plugins encouraged to manage their own file-based caches |

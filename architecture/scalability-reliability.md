# Scalability & Reliability

> Growth handling and failure modes for DocuBook.

## Scalability Model

### Per-Framework Scaling Strategy

| Framework | Architecture | Scaling Approach | Bottleneck |
|-----------|-------------|-----------------|------------|
| **flame** | Static HTML on CDN | Infinite horizontal — CDN edge caching | Build time (content volume) |
| **Next.js/Vercel** | Edge + ISR | On-demand regeneration, edge functions | Cold starts on new pages |
| **rerouter** | Stateless Node.js | Horizontal pod scaling | In-memory search index rebuild |

### Build-Time Scalability

| Mechanism | Purpose |
|-----------|---------|
| **Turborepo caching** | Skip unchanged package builds via content hashing |
| **Content hashing** (flame `build-cache.json`) | Skip MDX recompilation for unchanged files |
| **Parallel execution** | Turborepo runs independent tasks concurrently |
| **Incremental builds** | Only recompile changed `.mdx` files |

### Content Growth Projections

| Scale | Pages | Build Time (flame) | Search Index Size |
|-------|-------|-------------------|-------------------|
| Small | < 50 | < 5s | < 100 KB |
| Medium | 50–500 | 5–30s | 100 KB – 1 MB |
| Large | 500–5000 | 30s–5min | 1–10 MB |

**Mitigation for large sites:**
- flame: Concurrency flag (`--concurrency=N`) for parallel MDX compilation
- Next.js: ISR avoids full rebuild — only changed pages regenerate
- rerouter: Search index loaded once at startup, rebuilt on deploy

## Reliability

### Failure Modes & Recovery

| Failure | Impact | Recovery |
|---------|--------|----------|
| CDN edge down (flame) | Regional outage | CDN failover to next-nearest PoP |
| Vercel function timeout | Single page 504 | ISR serves stale, regenerates in background |
| Node.js crash (rerouter) | Full site down | Process manager restart (PM2/systemd) |
| MDX compilation error | Build fails | CI blocks deploy, previous version stays live |
| Search index corruption | Search returns no results | Rebuild on next deploy |
| Sentry SDK failure | No error reporting | Opt-in, graceful degradation (site still works) |

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
```

### Availability Targets

| Component | Target | Rationale |
|-----------|--------|-----------|
| Static sites (flame) | 99.99% | CDN-backed, no server logic |
| Production site (Vercel) | 99.95% | Vercel SLA + ISR fallback |
| Self-hosted (rerouter/Docker) | 99.9% | Depends on operator infrastructure |

### Graceful Degradation

| Feature | Degraded State | User Impact |
|---------|---------------|-------------|
| Search (Algolia down) | Built-in client search fallback | Slower, less accurate results |
| Theme toggle (JS disabled) | System preference via `prefers-color-scheme` | No manual toggle |
| Sentry (DSN not set) | No error reporting | Zero user impact |
| Social links (API down) | Static fallback from docu.json | Links still work |

## Caching Strategy

| Layer | Cache Type | TTL | Invalidation |
|-------|-----------|-----|--------------|
| CDN (flame) | Edge cache | Long (immutable assets) | Deploy = full purge |
| Vercel ISR | Stale-while-revalidate | Configurable per page | On-demand revalidation |
| Turborepo | Content-addressed | Until source changes | Hash mismatch |
| Browser | Service worker (optional) | Session | Version bump |
| flame build-cache | File hash map | Until content changes | Hash comparison |

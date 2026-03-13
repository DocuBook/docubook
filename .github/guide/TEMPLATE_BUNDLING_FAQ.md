# Template Bundling - Frequently Asked Questions

## How Templates Work

### Q1: Where do templates live?
**A:** Two places, depending on the stage:

- **Development:** `packages/template/nextjs-vercel/` (source of truth)
- **After build:** `packages/cli/dist/nextjs-vercel/` (bundled copy)
- **Published:** Included in @docubook/cli npm package

### Q2: Does the CLI download templates from GitHub?
**A:** **NO!** Templates are bundled at build time, not downloaded at runtime.

The CLI scans `packages/cli/dist/` for templates, which are already included in the npm package.

### Q3: What happens when I edit a template?

```
1. Edit packages/template/nextjs-vercel/
2. Run pnpm build
   ↓
   build.js copies to packages/cli/dist/
3. Locally test: node src/index.js
4. Commit & tag
5. GitHub Action publishes to npm
6. Users download new version
```

### Q4: Can templates be updated without republishing the CLI?
**A:** No, with the current bundled approach. But this is intentional because:
- Templates are tightly coupled to the CLI
- Version compatibility matters
- Clean release cycle

Alternative (not used):
- Could download templates from GitHub at runtime
- But then requires internet and is slower

### Q5: How does the build process work?

```bash
pnpm build
  ↓
Turbo invokes CLI build script
  ↓
packages/cli/build.js runs:
  - Scans packages/template/
  - Finds all directories with template.config.json
  - Copies each to packages/cli/dist/{template-id}/
  ↓
Result:
  packages/cli/dist/nextjs-vercel/
  packages/cli/dist/react-router/
```

### Q6: What should be in packages/template/{template-id}/?

```
template-id/
├── template.config.json     ← Required metadata
├── package.json            ← Template dependencies
├── tsconfig.json           ← TypeScript config
├── app/                    ← Your template structure
├── components/
├── docs/
├── public/
├── styles/
├── next.config.mjs         ← For Next.js templates
└── README.md              ← Template documentation
```

### Q7: What goes in template.config.json?

```json
{
  "name": "Next.js (Vercel)",
  "id": "nextjs-vercel",
  "description": "Modern documentation with Next.js",
  "framework": "nextjs",
  "packageManagers": ["npm", "yarn", "pnpm", "bun"],
  "features": ["Next.js 16", "React 19", "TypeScript"],
  "author": "DocuBook Team",
  "homepage": "https://docubook.pro"
}
```

### Q8: How does the CLI discover templates?

```javascript
// packages/cli/src/utils/templateDetect.js

function getAvailableTemplates() {
  const templateDir = path.join(__dirname, '../../dist');
  
  // Scan dist/ for directories
  // For each, check if template.config.json exists
  // Load and return template metadata
  
  return [
    { id: "nextjs-vercel", name: "Next.js (Vercel)", ... },
    { id: "react-router", name: "React Router", ... }
  ];
}
```

### Q9: Can I add a new template without code changes?

**A:** Yes! Just add to `packages/template/`:

```bash
mkdir packages/template/astro-docs
touch packages/template/astro-docs/template.config.json
# Add your Astro template files

pnpm build  # Bundles it
```

No code changes needed! The template is auto-discovered.

### Q10: What happens if I update a template before publishing?

```
packages/template/nextjs-vercel/
  ↓ (edit file)
pnpm build
  ↓ (copies to dist/)
packages/cli/dist/nextjs-vercel/
  ↓ (bundles, ready)
```

Changes are immediately reflected in the bundled version. Test locally with:
```bash
cd packages/cli
node src/index.js --version
node src/index.js test-project
```

### Q11: How large is the final npm package?

Approximate sizes:
- CLI code: ~100 KB
- Bundled templates: ~50 MB (with node_modules)
- Total: ~150 MB

Can optimize with `.npmignore` to exclude node_modules from bundled templates.

### Q12: Can I reference templates from external sources?

**Currently:** No, not implemented.

**Could do:** With modification, the CLI could:
- Download from GitHub
- Reference from CDN
- Use git submodules

But this would require internet and be slower.

### Q13: What's the benefit of bundling vs downloading?

**Bundled (Current):**
- ✅ Fast (instant, no download)
- ✅ Offline-ready (works without internet)
- ✅ Deterministic (same template for all users)
- ✅ Like VitePress, Create React App

**Downloaded (Alternative):**
- ✅ Always latest template
- ✅ Smaller CLI package
- ✅ No need to republish
- ❌ Requires internet
- ❌ Slower
- ❌ Like Fumadocs

### Q14: How do I publish a new template version?

```bash
# 1. Update template files
cd packages/template/nextjs-vercel
# ...edit files...

# 2. Build locally
cd ../..
pnpm build

# 3. Test
cd packages/cli
node src/index.js my-test

# 4. Bump CLI version (not template!)
# Edit packages/cli/package.json:
# "version": "0.2.0"

# 5. Commit & tag
git add .
git commit -m "chore: update nextjs-vercel template"
git tag cli-v0.2.0
git push origin main --tags

# 6. GitHub Action handles the rest!
```

### Q15: What if I want to break template compatibility?

Make it a major version bump:
```
cli-v0.1.0 → cli-v1.0.0
```

Document breaking changes in CHANGELOG.md so users know.

## Template Development Tips

### Adding Files to Template

```bash
cd packages/template/nextjs-vercel
# Add your files
git add .
pnpm build  # Test bundling
```

### Testing Template Changes

```bash
cd packages/cli
node src/index.js my-test-project
cd my-test-project
npm run dev  # Should work!
```

### Template Versioning

Template version is tied to CLI version:
- CLI v0.2.0 includes template from that release
- Users on CLI v0.1.0 get older template

### Multi-Template Management

```
packages/template/
├── nextjs-vercel/
│   └── template.config.json
├── react-router/
│   └── template.config.json
├── astro-docs/
│   └── template.config.json
└── sveltekit/
    └── template.config.json
```

All automatically bundled and discovered!

## .npmignore Strategy

To reduce package size, could add `.npmignore`:

```
# packages/cli/.npmignore
src/
build.js
*.test.js

# Optional: exclude node_modules from bundled templates
dist/*/node_modules/
```

## References

- [VitePress Scaffolding](https://vitepress.dev/guide/getting-started)
- [Create React App Boilerplate](https://github.com/facebook/create-react-app)
- [PUBLISHING_GUIDE.md](./PUBLISHING_GUIDE.md)
- [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)

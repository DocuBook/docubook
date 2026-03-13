# DocuBook Guides

Complete documentation and best practices for working with the DocuBook monorepo.

## 📚 Available Guides

### 🚀 Quick Start
Start here if you're new to the project:
- **[MONOREPO_COMMANDS.md](./MONOREPO_COMMANDS.md)** - Complete guide to pnpm and Turbo commands
  - Installation, building, linting, development workflows
  - When to use `pnpm build` vs `npx turbo build`
  - All available commands with examples

### 🔗 Dependencies & Workspaces
Learn about the project structure and dependency management:
- **[WORKSPACE_RULES.md](./WORKSPACE_RULES.md)** - Dependency management guidelines
  - Workspace hierarchy and organization
  - Root vs workspace dependencies
  - Common mistakes and how to avoid them
  - Adding and updating dependencies

### 📐 Architecture & Design
Deep dive into the project structure:
- **[ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md)** - System architecture overview
  - Directory structure and file organization
  - How different components interact
  - Data flow and integration points

### 📦 Publishing & Distribution
Information about publishing packages:
- **[PUBLISHING_GUIDE.md](./PUBLISHING_GUIDE.md)** - How to publish packages to npm
  - Version management
  - Release process
  - Publishing to npm registry

### 🛠️ CLI & Integration
Technical implementation details:
- **[CLI_IMPLEMENTATION_SUMMARY.md](./CLI_IMPLEMENTATION_SUMMARY.md)** - DocuBook CLI overview
  - CLI command structure
  - How the CLI works internally

- **[INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)** - Integration guidelines
  - How to integrate DocuBook with your project
  - Best practices for implementation

### 📋 Template-Specific
Questions about the template package:
- **[TEMPLATE_BUNDLING_FAQ.md](./TEMPLATE_BUNDLING_FAQ.md)** - Common template questions
  - Bundling and distribution
  - Template usage and customization

---

## 🎯 Quick Reference

### Commands You'll Use Daily

```bash
# Setup
pnpm install              # Install all dependencies

# Development
pnpm dev:web              # Start web app dev server
pnpm lint                 # Check code quality
pnpm format               # Auto-format code

# Building
pnpm build                # Build all packages
npx turbo build --filter=docubook  # Build specific app

# Pre-commit
pnpm lint:fix             # Fix lint issues
pnpm typecheck            # Check TypeScript
```

### Key Files to Know

```
.
├── package.json              # Root dependencies & scripts
├── pnpm-workspace.yaml       # Workspace configuration
├── turbo.json                # Turbo configuration
├── apps/web/                 # Main web application
├── packages/ui/              # Shared UI components
├── packages/template/        # Template starter
└── .github/guide/            # This folder (guides)
```

---

## ✅ Workflow Checklist

### Before Starting Development
- [ ] Read [MONOREPO_COMMANDS.md](./MONOREPO_COMMANDS.md) for command overview
- [ ] Run `pnpm install`
- [ ] Run `pnpm build` to verify setup
- [ ] Read [WORKSPACE_RULES.md](./WORKSPACE_RULES.md) to understand structure

### Before Committing
- [ ] Run `pnpm lint:fix`
- [ ] Run `pnpm format`
- [ ] Run `pnpm typecheck`
- [ ] Run `pnpm build` to ensure no regressions

### Before Pushing
- [ ] Check [WORKSPACE_RULES.md](./WORKSPACE_RULES.md) for dependency changes
- [ ] Verify build succeeds: `pnpm build`
- [ ] All linting passes: `pnpm lint`
- [ ] Types check out: `pnpm typecheck`

---

## 🤔 Common Questions

### Q: Which command should I use?
**A:** Check [MONOREPO_COMMANDS.md](./MONOREPO_COMMANDS.md)
- Use `pnpm build` for normal builds
- Use `npx turbo build --filter=X` for specific packages
- Never use `pnpm turbo build` (confusing)

### Q: Where do I add dependencies?
**A:** Check [WORKSPACE_RULES.md](./WORKSPACE_RULES.md)
- Add to root if used by multiple workspaces
- Add to workspace if used only there
- Use `workspace:*` for internal packages

### Q: How is the project structured?
**A:** Check [ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md)
- Understand workspace organization
- See how components interact
- Learn the file structure

### Q: How do I set up NPM publishing with OIDC?
**A:** Check [PUBLISHING_GUIDE.md](./PUBLISHING_GUIDE.md#-npm-token-setup-oidc-method---recommended)
- One-time npm configuration (5 minutes)
- No secrets needed in GitHub
- Workflow is already OIDC-ready
- Security benefits explained

### Q: My build is failing, what do I do?
**A:** Try this:
```bash
pnpm clean              # Clear build cache
pnpm install            # Fresh install
pnpm build --no-cache   # Rebuild without cache
```
Then check [MONOREPO_COMMANDS.md](./MONOREPO_COMMANDS.md) for detailed troubleshooting.

---

## 📖 Documentation Standards

All guides in this folder follow these standards:

- **Clear Hierarchy:** Use headings to organize content
- **Code Examples:** Show practical examples for every concept
- **Quick Reference:** Provide tables and summaries
- **Do's and Don'ts:** Highlight best practices
- **Related Links:** Link to related guides
- **Troubleshooting:** Include common issues and solutions

---

## 🚀 Tips for Success

1. **Read the right guide:** Match your task to the appropriate guide
2. **Use examples:** Copy-paste commands that match your scenario
3. **Check `pnpm list`:** Always verify dependencies before debugging
4. **Run `pnpm clean`:** When in doubt, clean and rebuild
5. **Follow rules:** Consistency prevents 90% of problems

---

## 📞 Need Help?

1. Check if your question is answered in these guides
2. Search the repository for similar issues
3. Check the related guide's troubleshooting section
4. Review the command examples provided

---

### Guide Index by Task

### I want to...

**...start developing**
→ [MONOREPO_COMMANDS.md](./MONOREPO_COMMANDS.md#-development)

**...understand the project structure**
→ [ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md)

**...add a new dependency**
→ [WORKSPACE_RULES.md](./WORKSPACE_RULES.md#-when-to-add-dependencies)

**...build the project**
→ [MONOREPO_COMMANDS.md](./MONOREPO_COMMANDS.md#-building)

**...fix lint/format issues**
→ [MONOREPO_COMMANDS.md](./MONOREPO_COMMANDS.md#-linting)

**...publish a package**
→ [PUBLISHING_GUIDE.md](./PUBLISHING_GUIDE.md)

**...set up NPM OIDC publishing**
→ [PUBLISHING_GUIDE.md](./PUBLISHING_GUIDE.md#-npm-token-setup-oidc-method---recommended)

**...use the template**
→ [TEMPLATE_BUNDLING_FAQ.md](./TEMPLATE_BUNDLING_FAQ.md)

**...understand dependencies**
→ [WORKSPACE_RULES.md](./WORKSPACE_RULES.md)

**...integrate DocuBook**
→ [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)

---

Last Updated: March 13, 2026

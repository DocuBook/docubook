# DocuBook

**DocuBook** is a documentation web project designed to provide a simple and user-friendly interface for accessing various types of documentation. This site is crafted for developers and teams who need quick access to references, guides, and essential documents.

## Features

- **Easy Navigation**: Simple layout for quick navigation between pages.
- **Quick Search**: Easily find documentation using a search function.
- **Responsive Theme**: Responsive design optimized for devices ranging from desktops to mobile.
- **Markdown Content**: Support for markdown-based documents.
- **SEO Friendly**: Optimized structure for search visibility, enhancing accessibility on search engines.

## Installation

```bash
npx @docubook/cli@latest
```

#### command output

![command output](docubook-cli.png)

## Versioning & Release Workflow

This monorepo uses [Changesets](https://github.com/changesets/changesets) to manage versioning and releases for all packages (`@docubook/cli`, `@docubook/core`, `@docubook/mdx-content`, `@docubook/docs-tree`).

### Managed Packages

|         Package         |        Location        |                                                        npm                                                        |
| ----------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `@docubook/cli`         | `packages/cli`         | [![npm](https://img.shields.io/npm/v/@docubook/cli)](https://www.npmjs.com/package/@docubook/cli)                 |
| `@docubook/core`        | `packages/core`        | [![npm](https://img.shields.io/npm/v/@docubook/core)](https://www.npmjs.com/package/@docubook/core)               |
| `@docubook/mdx-content` | `packages/mdx-content` | [![npm](https://img.shields.io/npm/v/@docubook/mdx-content)](https://www.npmjs.com/package/@docubook/mdx-content) |
| `@docubook/docs-tree`   | `packages/docs-tree`   | [![npm](https://img.shields.io/npm/v/@docubook/docs-tree)](https://www.npmjs.com/package/@docubook/docs-tree)     |

### Version Bump Guide

Choose the bump type based on the nature of the change:

|  Type   |                       When to use                       |  Version example  |
| ------- | ------------------------------------------------------- | ----------------- |
| `patch` | Bug fixes and small changes that do not affect the API  | `1.0.0` → `1.0.1` |
| `minor` | New features that are backward-compatible               | `1.0.0` → `1.1.0` |
| `major` | Breaking changes — API is no longer backward-compatible | `1.0.0` → `2.0.0` |

---

<details>
<summary>Workflow: Patch Release (bug fix)</summary>

```bash
# 1. Create a changeset — select the affected package(s) and choose "patch"
pnpm changeset

# 2. Commit the generated changeset
git add .changeset/
git commit -m "chore: add changeset for patch fix"

# 3. Apply version bumps and generate CHANGELOG
pnpm version-packages

# 4. Commit the version bump
git add .
git commit -m "chore: release patch"

# 5. Push your branch and open a Pull Request
git push <branch-name>
```

</details>

---

<details>
<summary>Workflow: Minor Release (new feature)</summary>

```bash
# 1. Create a changeset — select the affected package(s) and choose "minor"
pnpm changeset

# 2. Commit the generated changeset
git add .changeset/
git commit -m "chore: add changeset for new feature"

# 3. Apply version bumps and generate CHANGELOG
pnpm version-packages

# 4. Commit the version bump
git add .
git commit -m "chore: release minor"

# 5. Push your branch and open a Pull Request
git push <branch-name>
```

</details>

---

<details>
<summary>Workflow: Major Release (breaking change)</summary>

```bash
# 1. Create a changeset — select the affected package(s) and choose "major"
pnpm changeset

# 2. Commit the generated changeset
git add .changeset/
git commit -m "chore: add changeset for breaking change"

# 3. Apply version bumps and generate CHANGELOG
pnpm version-packages

# 4. Commit the version bump
git add .
git commit -m "chore: release major"

# 5. Push your branch and open a Pull Request
git push <branch-name>
```

</details>

---

### Workflow: Multi-package Release (multiple packages at once)

When a single change affects more than one package (e.g. `@docubook/core` and `@docubook/mdx-content`):

```bash
# 1. Run changeset — select ALL affected packages
#    You can choose a different bump type per package
pnpm changeset

# 2. Commit all generated changesets
git add .changeset/
git commit -m "chore: add changesets for multi-package release"

# 3. Apply all version bumps at once
pnpm version-packages

# 4. Commit all version changes
git add .
git commit -m "chore: release packages"

# 5. Push your branch and open a Pull Request
git push <branch-name>
```

> [!NOTE]
> `pnpm version-packages` automatically updates internal dependency versions across packages (e.g. if `@docubook/mdx-content` depends on `@docubook/core`, its version reference will be updated accordingly).

<p align="center">
  <img
    src="apps/web/public/images/docu.svg"
    alt="DocuBook Logo"
    width="100"
    height="100"
  />
</p>
<h1 align="center" style="font-size: 32px;">
  DocuBook
</h1>
<h3 align="center" style="font-size: 20px;">
  An open-source alternative to Mintlify or GitBook. Just write in MDX — it works with pretty much any React framework.
</h3>

---

> **DocuBook** is a documentation web project designed to provide a simple and user-friendly interface
> for accessing various types of documentation. This site is crafted for developers and teams who need
> quick access to references, guides, and essential documents.

## Features

- **@docubook/core** : Shared MDX compile pipeline and markdown utilities.
- **@docubook/mdx-content** : Portable MDX components and framework adapters.
- **@docubook/cli** : CLI tool that helps you initialize, update, and deploy documentation directly from your terminal.
- **starter template** : ready-to-use templates with a choice of modern frameworks for the react ecosystem.
  
  - **@docubook/flame** : A blazing-fast React + MDX framework powered by Bun, built for modern documentation experiences.
  - **nextjs-vercel** : This template is optimized for deployment on Vercel (the default hosting target).
  - **nextjs-docker** : This template includes an opinionated Docker setup optimized for building a small, production-ready Next.js standalone image using multi-stage
    builds and an Alpine base.
  - **react-router** : a minimal documentation template with SSR + Hydration (comingsoon)

## Installation

```bash
npx @docubook/cli@latest
```

#### command output

![command output](docubook-cli.png)

## Contributing

<!-- prettier-ignore -->
> [!NOTE]
> We are very open to all your contributions, no matter how small your contribution is, it will certainly be part of the development of this project.
> 
> Please read: [CONTRIBUTING.md](CONTRIBUTING.md)

## Workspace

<!-- prettier-ignore -->
> [!IMPORTANT]
> This repository uses a monorepo setup powered by pnpm workspaces and Turborepo to manage apps and packages in a single workspace.
>
> For development workflow:
> - Changesets handles package versioning and release management
> - Husky runs automatic linting and formatting before commits
> - commitlint ensures commit messages follow the Conventional Commits format consistently
>
> This setup helps keep the codebase organized, maintainable, and contributor-friendly.

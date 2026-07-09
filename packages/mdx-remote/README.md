<h1 align="center" style="font-size: 32px;">
  @docubook/mdx-remote 📝
</h1>
<h3 align="center" style="font-size: 20px;">
  Runtime MDX compilation and rendering — for any React server or client environment.
</h3>

<p align="center">
  Fork/rewrite of <code>next-mdx-remote</code> under MPL-2.0. Compiles raw MDX via <code>@mdx-js/mdx</code>, renders in RSC and client React trees. Used internally by <strong>@docubook/flame</strong> and <strong>@docubook/core</strong>.
</p>

---

> **Zero runtime dependencies beyond the MDX ecosystem** — `@mdx-js/mdx`, `@mdx-js/react`, `vfile`, `unist-util-*`.

## API

### `@docubook/mdx-remote` — client-side renderer

```ts
import { MDXRemote } from "@docubook/mdx-remote";
```

| Export | Signature | Description |
|---|---|---|
| `MDXRemote` | `(props: MDXRemoteProps) => ReactElement` | Renders pre-compiled MDX (from `serialize()`) with `MDXProvider` for custom components. Supports `lazy` hydration. |
| `MDXRemoteProps` | `MDXRemoteSerializeResult & { components?, lazy? }` | Props type: `compiledSource`, `frontmatter`, `scope`, `components`, `lazy`. |

### `@docubook/mdx-remote/rsc` — React Server Components

```ts
import { compileMDX, MDXRemote } from "@docubook/mdx-remote/rsc";
```

| Export | Signature | Description |
|---|---|---|
| `compileMDX` | `<Frontmatter>({ source, options?, components? }) => Promise<{ content, frontmatter }>` | Compiles MDX source and returns a React element (RSC). Generic `Frontmatter` type for typed frontmatter access. |
| `MDXRemote` | `<Frontmatter>(props) => Promise<ReactElement>` | Server component that compiles & renders MDX inline. |

### `@docubook/mdx-remote/serialize` — compiler

```ts
import { serialize } from "@docubook/mdx-remote/serialize";
```

| Export | Signature | Description |
|---|---|---|
| `serialize` | `(source, options?, rsc?) => Promise<SerializeResult>` | Compiles raw MDX string into `{ compiledSource, frontmatter, scope }`. |
| `SerializeOptions` | `{ scope?, mdxOptions?, parseFrontmatter?, blockJS? }` | Compile options. |
| `SerializeResult` | `{ compiledSource, frontmatter, scope }` | Compiled output ready for `<MDXRemote>`. |

## Usage

### Server Component (RSC)

```tsx
import { compileMDX } from "@docubook/mdx-remote/rsc";

export default async function Page() {
  const { content, frontmatter } = await compileMDX({
    source: `---
title: Hello
---
# {frontmatter.title}

World.`,
    options: { parseFrontmatter: true },
  });
  return <article>{content}</article>;
}
```

### Client-side (pre-compiled)

```tsx
import { serialize } from "@docubook/mdx-remote/serialize";
import { MDXRemote } from "@docubook/mdx-remote";

const { compiledSource, frontmatter } = await serialize(mdxString, {
  parseFrontmatter: true,
});

function Page() {
  return (
    <MDXRemote
      compiledSource={compiledSource}
      frontmatter={frontmatter}
      components={{ h1: (props) => <h1 className="text-2xl" {...props} /> }}
    />
  );
}
```

### Custom components

```tsx
import { compileMDX } from "@docubook/mdx-remote/rsc";

const components = {
  CustomAlert: (props) => <div className="alert">{props.children}</div>,
};

const { content } = await compileMDX({
  source: `<CustomAlert>Note</CustomAlert>`,
  components,
});
```

## Security

By default, MDX expressions (`{...}`) and import/export statements are removed before compilation (`blockJS: true`). A security sanitizer audits the AST for dangerous patterns (`eval`, `Function`, `import()`, property access on built-in constructors) even when expressions are allowed (`blockJS: false`).

## License

MPL-2.0 — see [LICENSE](./LICENSE).

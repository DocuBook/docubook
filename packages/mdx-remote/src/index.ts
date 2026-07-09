import React, { useEffect, useState, useMemo } from "react";
import * as jsxRuntime from "react/jsx-runtime";
import * as mdx from "@mdx-js/react";
import type { MDXRemoteSerializeResult, CompileMDXOptions } from "./types.js";

/** Props for the client-side `<MDXRemote>` (accepts pre-serialized result). */
export type MDXRemoteProps = MDXRemoteSerializeResult & {
  components?: Record<string, React.ComponentType<any>>;
  /** Defer hydration to an idle callback */
  lazy?: boolean;
};

/**
 * Client-side MDX renderer.
 *
 * Accepts a pre-compiled result from `serialize()` and renders it via
 * `MDXProvider` for custom component injection.
 */
export function MDXRemote({
  compiledSource,
  frontmatter,
  scope = {},
  components = {},
  lazy,
}: MDXRemoteProps) {
  const [ready, setReady] = useState(!lazy || typeof window === "undefined");

  useEffect(() => {
    if (!lazy) return;
    const id = window.requestIdleCallback
      ? window.requestIdleCallback(() => setReady(true), { timeout: 500 })
      : setTimeout(() => setReady(true), 1);
    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(id as number);
      else clearTimeout(id as number);
    };
  }, [lazy]);

  const Content = useMemo(() => {
    // Non-RSC mode: compiled MDX expects `useMDXComponents` (
    // from @mdx-js/react) AND the JSX runtime (jsx, jsxs, Fragment).
    const fullScope = {
      opts: { ...mdx, ...jsxRuntime },
      frontmatter,
      ...scope,
    };
    const keys = Object.keys(fullScope);
    const values = Object.values(fullScope);
    const fn = Reflect.construct(Function, keys.concat(`${compiledSource}`));
    return fn.apply(fn, values).default;
  }, [compiledSource, scope, frontmatter]);

  if (!ready) {
    return React.createElement("div", {
      dangerouslySetInnerHTML: { __html: "" },
      suppressHydrationWarning: true,
    });
  }

  const content = React.createElement(
    mdx.MDXProvider,
    { components },
    React.createElement(Content, null),
  );

  return lazy ? React.createElement("div", null, content) : content;
}

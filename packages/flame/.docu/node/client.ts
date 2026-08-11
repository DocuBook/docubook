import { createRoot, hydrateRoot } from "react-dom/client";
import React from "react";
import { MDXProvider } from "@mdx-js/react";
import { MDXRemote } from "@docubook/core";
import { createMdxComponents } from "@docubook/markdown";
import { mdxModules } from "./mdx-manifest";
import Sidebar, { MobileBar } from "../components/Sidebar";
import Toc from "../components/Toc";
import { ThemeToggle } from "../components/Theme";
import { safeParseTocs } from "./parse-tocs";
import type { TocItem } from "./types";

/**
 * Island mount mode — deliberate trade-off per island API:
 *
 * - `hydrate`: SSR HTML exists and the client renders the identical tree →
 *   attach React in place (no flash, SSR content preserved).
 * - `create`: client-only render — the client tree deliberately differs from
 *   SSR (or SSR output is absent) → full render, discards SSR markup.
 * - `auto`: hydrate when the SSR container has children, else create.
 */
type MountMode = "auto" | "hydrate" | "create";

function mountIsland(
  id: string,
  render: (el: HTMLElement) => React.ReactElement | null,
  mode: MountMode = "auto"
) {
  const el = document.getElementById(id);
  if (!el) return;
  const node = render(el);
  if (node === null) return; // island stays as-is (SSR HTML preserved)
  const hydrate = mode === "hydrate" || (mode === "auto" && el.childElementCount > 0);
  if (hydrate) {
    hydrateRoot(el, node);
  } else {
    el.innerHTML = "";
    createRoot(el).render(node);
  }
}

function mountIslands() {
  // SSR renders <Menu> only; client renders full <Sidebar> (DesktopSidebar +
  // MobileBar) — structural mismatch makes hydration impossible, so always
  // createRoot and discard the SSR <Menu> markup.
  mountIsland(
    "sidebar-island",
    (el) => {
      const tocs: TocItem[] = safeParseTocs(el.dataset.tocs);
      return React.createElement(Sidebar, {
        tocs,
        title: el.dataset.title || "",
        repoUrl: el.dataset.repo || "",
      });
    },
    "create"
  );

  // SSR div is empty (data attributes only) — childElementCount is 0, so
  // auto falls through to createRoot.
  mountIsland("mobile-bar-island", (el) => {
    const tocs: TocItem[] = safeParseTocs(el.dataset.tocs);
    return React.createElement(MobileBar, {
      tocs,
      title: el.dataset.title || "",
      repoUrl: el.dataset.repo || "",
    });
  });

  mountIsland("toc-island", (el) => {
    const tocs: TocItem[] = safeParseTocs(el.dataset.tocs);
    return React.createElement(Toc, { tocs });
  });

  mountIsland("theme-island", () => React.createElement(ThemeToggle));

  // MDX content: SSR renders the full content HTML; the client rebuilds the
  // identical tree. Two sources, same tree shape:
  //  - static build: per-slug compiled ESM module bundled via ./mdx-manifest
  //    (no new Function) — module and SSR output come from the same plugin
  //    chain, so hydration matches;
  //  - dev: legacy per-page compiledSource script → MDXRemote eval.
  // Hydrate when SSR markup exists, create only when the container is empty.
  mountIsland(
    "mdx-content-island",
    (el) => {
      const sourceEl = document.getElementById("mdx-compiled-source");
      if (sourceEl) {
        try {
          const compiledSource = JSON.parse(sourceEl.textContent || "");
          return React.createElement(MDXRemote, {
            compiledSource,
            scope: {},
            frontmatter: {},
            components: createMdxComponents(),
          });
        } catch (e) {
          console.error("[mdx-hydrate]", e);
          return null;
        }
      }
      const slug = el.dataset.mdxSlug;
      // The docs root (index.mdx) renders with an empty slug — `mdxSlug != null`
      // keeps "" addressable (its module is stored under key ""), while a
      // missing marker stays undefined and skips hydration.
      const mod = slug != null ? mdxModules[slug] : undefined;
      if (!mod) return null;
      return React.createElement(
        MDXProvider,
        { components: createMdxComponents() },
        React.createElement(mod.default, null)
      );
    },
    "auto"
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountIslands);
} else {
  mountIslands();
}

// ── Hash scroll compensation ──────────────────────────────────────
// After hydration, lazy-rendered content (Mermaid via IntersectionObserver) can
// shift layout and push the hash target (#section-2) off-screen.
// Poll with rAF for ~1s and re-scroll if the target is below viewport.
function scrollToHashOnLoad() {
  const hash = window.location.hash;
  if (!hash || hash === "#") return;
  const id = hash.slice(1);
  const deadline = performance.now() + 1000;
  function tick() {
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top;
      if (top <= window.innerHeight - 100 && top >= 0) return; // already in view
      el.scrollIntoView();
      return; // scrolled once, done
    }
    if (performance.now() < deadline) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

scrollToHashOnLoad();

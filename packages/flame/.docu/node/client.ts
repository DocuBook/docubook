import { createRoot, hydrateRoot } from "react-dom/client";
import React from "react";
import { MDXRemote } from "@docubook/core";
import { createMdxComponents } from "@docubook/mdx-content";
import Sidebar, { MobileBar } from "../components/Sidebar";
import Toc from "../components/Toc";
import { ThemeToggle } from "../components/Theme";
import { safeParseTocs } from "./parse-tocs";
import type { TocItem } from "./types";

function mountIsland(
  id: string,
  render: (el: HTMLElement) => React.ReactElement,
  forceCreate = false
) {
  const el = document.getElementById(id);
  if (!el) return;
  const node = render(el);
  if (!forceCreate && el.childElementCount > 0) {
    hydrateRoot(el, node);
  } else {
    el.innerHTML = "";
    createRoot(el).render(node);
  }
}

function mountIslands() {
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
    true
  );

  mountIsland(
    "mobile-bar-island",
    (el) => {
      const tocs: TocItem[] = safeParseTocs(el.dataset.tocs);
      return React.createElement(MobileBar, {
        tocs,
        title: el.dataset.title || "",
        repoUrl: el.dataset.repo || "",
      });
    },
    true
  );

  mountIsland("toc-island", (el) => {
    const tocs: TocItem[] = safeParseTocs(el.dataset.tocs);
    return React.createElement(Toc, { tocs });
  });

  mountIsland("theme-island", () => React.createElement(ThemeToggle));

  hydrateMdxContent();
}

function hydrateMdxContent() {
  const island = document.getElementById("mdx-content-island");
  const sourceEl = document.getElementById("mdx-compiled-source");
  if (!island || !sourceEl) return;

  try {
    const compiledSource = JSON.parse(sourceEl.textContent || "");
    const components = createMdxComponents();
    createRoot(island).render(
      React.createElement(MDXRemote, { compiledSource, scope: {}, frontmatter: {}, components })
    );
  } catch (e) {
    console.error("[mdx-hydrate]", e);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountIslands);
} else {
  mountIslands();
}

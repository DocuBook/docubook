import { createRoot, hydrateRoot } from "react-dom/client";
import React from "react";
import { MDXRemote } from "@docubook/core";
import { createMdxComponents } from "@docubook/mdx-content";
import Sidebar, { MobileBar } from "../components/Sidebar";
import Toc from "../components/Toc";
import { ThemeToggle } from "../components/Theme";
import type { TocItem } from "./types";

function safeParseTocs(raw: string | undefined): TocItem[] {
  try {
    return JSON.parse(raw || "[]");
  } catch {
    return [];
  }
}

function mountIslands() {
  const sidebarEl = document.getElementById("sidebar-island");
  if (sidebarEl) {
    const tocs: TocItem[] = safeParseTocs(sidebarEl.dataset.tocs);
    const title = sidebarEl.dataset.title || "";
    const repoUrl = sidebarEl.dataset.repo || "";
    const el = React.createElement(Sidebar, { tocs, title, repoUrl });
    if (sidebarEl.childElementCount > 0) {
      hydrateRoot(sidebarEl, el);
    } else {
      createRoot(sidebarEl).render(el);
    }
  }

  const mobileBarEl = document.getElementById("mobile-bar-island");
  if (mobileBarEl) {
    const tocs: TocItem[] = safeParseTocs(mobileBarEl.dataset.tocs);
    const title = mobileBarEl.dataset.title || "";
    const repoUrl = mobileBarEl.dataset.repo || "";
    createRoot(mobileBarEl).render(React.createElement(MobileBar, { tocs, title, repoUrl }));
  }

  const tocEl = document.getElementById("toc-island");
  if (tocEl) {
    const tocs: TocItem[] = safeParseTocs(tocEl.dataset.tocs);
    const el = React.createElement(Toc, { tocs });
    if (tocEl.childElementCount > 0) {
      hydrateRoot(tocEl, el);
    } else {
      createRoot(tocEl).render(el);
    }
  }

  const themeEl = document.getElementById("theme-island");
  if (themeEl) {
    createRoot(themeEl).render(React.createElement(ThemeToggle));
  }

  hydrateMdxContent();
}

function hydrateMdxContent() {
  const island = document.getElementById("mdx-content-island");
  const sourceEl = document.getElementById("mdx-compiled-source");
  if (!island || !sourceEl) return;

  try {
    const compiledSource = JSON.parse(sourceEl.textContent || "");
    const components = createMdxComponents();
    createRoot(island).render(React.createElement(MDXRemote, { compiledSource, components }));
  } catch (e) {
    console.error("[mdx-hydrate]", e);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountIslands);
} else {
  mountIslands();
}

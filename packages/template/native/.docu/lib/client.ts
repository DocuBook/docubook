import { createRoot } from "react-dom/client";
import React from "react";
import Sidebar from "../components/Sidebar";
import Toc from "../components/Toc";
import type { TocItem } from "./types";

function mountIslands() {
  const sidebarEl = document.getElementById("sidebar-island");
  if (sidebarEl) {
    const tocs: TocItem[] = JSON.parse(sidebarEl.dataset.tocs || "[]");
    const title = sidebarEl.dataset.title || "";
    const repoUrl = sidebarEl.dataset.repo || "";
    createRoot(sidebarEl).render(React.createElement(Sidebar, { tocs, title, repoUrl }));
  }

  const tocEl = document.getElementById("toc-island");
  if (tocEl) {
    const tocs: TocItem[] = JSON.parse(tocEl.dataset.tocs || "[]");
    createRoot(tocEl).render(React.createElement(Toc, { tocs }));
  }

  hydrateMdxComponents();
}

function hydrateMdxComponents() {
  document.querySelectorAll<HTMLElement>(".mdx-accordion-header").forEach((header) => {
    header.style.cursor = "pointer";
    const accordion = header.closest(".mdx-accordion");
    const content = accordion?.querySelector<HTMLElement>(".mdx-accordion-content");
    const chevron = header.querySelector<SVGElement>(".mdx-accordion-chevron");
    if (!content) return;

    content.style.display = "none";
    header.addEventListener("click", () => {
      const isOpen = content.style.display !== "none";
      content.style.display = isOpen ? "none" : "block";
      if (chevron) {
        chevron.style.transform = isOpen ? "rotate(0deg)" : "rotate(90deg)";
        chevron.style.transition = "transform 0.2s";
      }
    });
  });

  document
    .querySelectorAll<HTMLButtonElement>(".code-block-container button[aria-label]")
    .forEach((btn) => {
      if (btn.dataset.hydrated) return;
      btn.dataset.hydrated = "true";
      const container = btn.closest(".code-block-container");
      const code = container?.querySelector("pre code");
      if (!code) return;

      btn.addEventListener("click", () => {
        navigator.clipboard.writeText(code.textContent || "");
        btn.textContent = "Copied";
        btn.setAttribute("aria-label", "Copied");
        setTimeout(() => {
          btn.textContent = "Copy";
          btn.setAttribute("aria-label", "Copy code");
        }, 1600);
      });
    });

  document.querySelectorAll<HTMLElement>(".code-block-expandable-footer").forEach((footer) => {
    if (footer.dataset.hydrated) return;
    footer.dataset.hydrated = "true";
    const container = footer.closest(".code-block-container");
    const body = container?.querySelector<HTMLElement>(".code-block-body");
    const pre = body?.querySelector<HTMLElement>("pre");
    const toggle = footer.querySelector<HTMLButtonElement>(".code-block-expandable-toggle");
    const label = toggle?.querySelector("span");
    if (!pre || !toggle || !label) return;

    const totalLines = parseInt(pre.dataset.expandableLines || "0", 10);
    let isOpen = false;

    const calculateCollapsedHeight = () => {
      const styles = window.getComputedStyle(pre);
      const paddingTop = parseFloat(styles.paddingTop) || 0;
      const paddingBottom = parseFloat(styles.paddingBottom) || 0;
      const contentHeight = Math.max(pre.scrollHeight - paddingTop - paddingBottom, 0);
      if (totalLines > 0 && contentHeight > 0) {
        const lineHeight = contentHeight / totalLines;
        return `${20 * lineHeight + paddingTop + paddingBottom}px`;
      }
      let lineHeight = parseFloat(styles.lineHeight);
      if (!isFinite(lineHeight) || lineHeight === 0) {
        lineHeight = (parseFloat(styles.fontSize) || 14) * 1.5;
      }
      return `${20 * lineHeight + paddingTop + paddingBottom}px`;
    };

    const collapsedHeight = calculateCollapsedHeight();
    pre.style.maxHeight = collapsedHeight;
    pre.style.overflow = "hidden";
    pre.style.transition = "max-height 0.3s ease";

    toggle.addEventListener("click", () => {
      isOpen = !isOpen;
      if (isOpen) {
        pre.style.maxHeight = "none";
        pre.style.overflow = "visible";
        label.textContent = "Collapse";
      } else {
        pre.style.maxHeight = collapsedHeight;
        pre.style.overflow = "hidden";
        label.textContent = `See all ${totalLines} lines`;
      }
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountIslands);
} else {
  mountIslands();
}

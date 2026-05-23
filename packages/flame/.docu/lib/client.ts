import { createRoot } from "react-dom/client";
import React from "react";
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
    createRoot(sidebarEl).render(React.createElement(Sidebar, { tocs, title, repoUrl }));
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
    createRoot(tocEl).render(React.createElement(Toc, { tocs }));
  }

  const themeEl = document.getElementById("theme-island");
  if (themeEl) {
    createRoot(themeEl).render(React.createElement(ThemeToggle));
  }

  hydrateMdxInteractivity();
}

function hydrateMdxInteractivity() {
  hydrateAccordions();
  hydrateTabs();
  hydrateTooltips();
  hydrateCodeCopy();
  hydrateExpandableCode();
  hydrateImageZoom();
  hydrateFileTree();
}

// --- Accordion ---
function hydrateAccordions() {
  // Accordion groups
  document.querySelectorAll<HTMLElement>(".mdx-accordion-group").forEach((group) => {
    if (group.dataset.hydrated) return;
    group.dataset.hydrated = "true";
    const headers = group.querySelectorAll<HTMLButtonElement>(".mdx-accordion-header");

    headers.forEach((header) => {
      header.addEventListener("click", () => {
        const content = header
          .closest(".mdx-accordion")
          ?.querySelector<HTMLElement>(".mdx-accordion-content");
        const chevron = header.querySelector<SVGElement>(".mdx-accordion-chevron");
        if (!content) return;

        const isOpen = header.getAttribute("aria-expanded") === "true";

        headers.forEach((h) => {
          const c = h
            .closest(".mdx-accordion")
            ?.querySelector<HTMLElement>(".mdx-accordion-content");
          const ch = h.querySelector<SVGElement>(".mdx-accordion-chevron");
          if (c) c.hidden = true;
          h.setAttribute("aria-expanded", "false");
          if (ch) ch.style.transform = "rotate(0deg)";
        });

        if (!isOpen) {
          content.hidden = false;
          header.setAttribute("aria-expanded", "true");
          if (chevron) chevron.style.transform = "rotate(90deg)";
        }
      });
    });
  });

  // Standalone accordions
  document
    .querySelectorAll<HTMLElement>(".mdx-accordion:not(.mdx-accordion-group-item)")
    .forEach((accordion) => {
      const header = accordion.querySelector<HTMLButtonElement>(".mdx-accordion-header");
      if (!header || header.dataset.hydrated) return;
      header.dataset.hydrated = "true";
      const content = accordion.querySelector<HTMLElement>(".mdx-accordion-content");
      const chevron = header.querySelector<SVGElement>(".mdx-accordion-chevron");
      if (!content) return;

      header.addEventListener("click", () => {
        const isOpen = header.getAttribute("aria-expanded") === "true";
        content.hidden = isOpen;
        header.setAttribute("aria-expanded", String(!isOpen));
        if (chevron) chevron.style.transform = isOpen ? "rotate(0deg)" : "rotate(90deg)";
      });
    });
}

// --- Tabs ---
function hydrateTabs() {
  document.querySelectorAll<HTMLElement>('[role="tablist"]').forEach((tablist) => {
    if (tablist.dataset.hydrated) return;
    tablist.dataset.hydrated = "true";

    const tabs = tablist.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    const container = tablist.parentElement;
    if (!container) return;
    const panels = container.querySelectorAll<HTMLElement>('[role="tabpanel"]');

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => {
          t.setAttribute("aria-selected", "false");
          t.tabIndex = -1;
          t.style.borderBottom = "2px solid transparent";
          t.style.color = "hsl(var(--foreground, 220 30% 15%))";
        });
        tab.setAttribute("aria-selected", "true");
        tab.tabIndex = 0;
        tab.style.borderBottom = "2px solid hsl(var(--primary, 210 81% 56%))";
        tab.style.color = "hsl(var(--primary, 210 81% 56%))";

        const panelId = tab.getAttribute("aria-controls");
        panels.forEach((p) => {
          p.hidden = p.id !== panelId;
        });
      });

      tab.addEventListener("keydown", (e) => {
        const arr = Array.from(tabs);
        const idx = arr.indexOf(tab);
        let target: HTMLButtonElement | null = null;
        if (e.key === "ArrowRight") target = arr[(idx + 1) % arr.length];
        if (e.key === "ArrowLeft") target = arr[(idx - 1 + arr.length) % arr.length];
        if (target) {
          e.preventDefault();
          target.click();
          target.focus();
        }
      });
    });
  });
}

// --- Code Copy ---
function hydrateCodeCopy() {
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
}

// --- Expandable Code ---
function hydrateExpandableCode() {
  document.querySelectorAll<HTMLElement>(".code-block-expandable-footer").forEach((footer) => {
    if (footer.dataset.hydrated) return;
    footer.dataset.hydrated = "true";
    const container = footer.closest(".code-block-container");
    const pre = container?.querySelector<HTMLElement>(".code-block-body pre");
    const toggle = footer.querySelector<HTMLButtonElement>(".code-block-expandable-toggle");
    const label = toggle?.querySelector("span");
    if (!pre || !toggle || !label) return;

    const totalLines = parseInt(pre.dataset.expandableLines || "0", 10);
    let isOpen = false;

    const styles = window.getComputedStyle(pre);
    const paddingTop = parseFloat(styles.paddingTop) || 0;
    const paddingBottom = parseFloat(styles.paddingBottom) || 0;
    const contentHeight = Math.max(pre.scrollHeight - paddingTop - paddingBottom, 0);
    let lineHeight =
      totalLines > 0 && contentHeight > 0
        ? contentHeight / totalLines
        : parseFloat(styles.lineHeight);
    if (!isFinite(lineHeight) || lineHeight === 0)
      lineHeight = (parseFloat(styles.fontSize) || 14) * 1.5;
    const collapsedHeight = `${20 * lineHeight + paddingTop + paddingBottom}px`;

    pre.style.maxHeight = collapsedHeight;
    pre.style.overflow = "hidden";
    pre.style.transition = "max-height 0.3s ease";

    toggle.addEventListener("click", () => {
      isOpen = !isOpen;
      pre.style.maxHeight = isOpen ? "none" : collapsedHeight;
      pre.style.overflow = isOpen ? "visible" : "hidden";
      label.textContent = isOpen ? "Collapse" : `See all ${totalLines} lines`;
    });
  });
}

// --- Image Zoom ---
function hydrateImageZoom() {
  document.querySelectorAll<HTMLButtonElement>('button[aria-label="Zoom image"]').forEach((btn) => {
    if (btn.dataset.hydrated) return;
    btn.dataset.hydrated = "true";
    const img = btn.querySelector<HTMLImageElement>("img");
    if (!img) return;

    btn.addEventListener("click", () => {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";

      const overlay = document.createElement("div");
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");
      overlay.setAttribute("aria-label", "Image preview");
      overlay.style.cssText =
        "position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.88);display:flex;align-items:center;justify-content:center;padding:1rem;";

      const closeBtn = document.createElement("button");
      closeBtn.type = "button";
      closeBtn.setAttribute("aria-label", "Close image preview");
      closeBtn.textContent = "Close";
      closeBtn.style.cssText =
        "position:absolute;top:16px;right:16px;border:1px solid rgba(255,255,255,0.24);border-radius:8px;background:rgba(0,0,0,0.45);color:#fff;padding:0.4rem 0.55rem;cursor:pointer;";

      const zoomedImg = document.createElement("img");
      zoomedImg.src = img.src;
      zoomedImg.alt = img.alt;
      zoomedImg.style.cssText =
        "width:auto;height:auto;max-width:92vw;max-height:90vh;object-fit:contain;border-radius:10px;";

      overlay.appendChild(closeBtn);
      overlay.appendChild(zoomedImg);
      document.body.appendChild(overlay);
      closeBtn.focus();

      const close = () => {
        overlay.remove();
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        window.scrollTo(0, scrollY);
      };

      overlay.addEventListener("click", close);
      zoomedImg.addEventListener("click", (e) => e.stopPropagation());
      closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        close();
      });
      window.addEventListener("keydown", function onEsc(e) {
        if (e.key === "Escape") {
          close();
          window.removeEventListener("keydown", onEsc);
        }
      });
    });
  });
}

// --- Tooltips ---
function hydrateTooltips() {
  document.querySelectorAll<HTMLElement>("[data-tooltip]").forEach((wrapper) => {
    if (wrapper.dataset.hydrated) return;
    wrapper.dataset.hydrated = "true";
    const tip = wrapper.dataset.tooltip;
    if (!tip) return;
    const side = wrapper.dataset.tooltipSide || "top";
    let bubble: HTMLSpanElement | null = null;

    const show = () => {
      if (bubble) return;
      bubble = document.createElement("span");
      bubble.setAttribute("role", "tooltip");
      bubble.textContent = tip;
      bubble.style.cssText = `position:absolute;left:50%;transform:translateX(-50%);${side === "bottom" ? "top:calc(100% + 8px)" : "bottom:calc(100% + 8px)"};border:1px solid hsl(var(--border, 210 20% 85%));background:hsl(var(--card, 0 0% 100%));color:hsl(var(--foreground, 220 30% 15%));border-radius:8px;padding:0.35rem 0.5rem;font-size:0.78rem;white-space:nowrap;z-index:20;`;
      wrapper.appendChild(bubble);
    };
    const hide = () => {
      if (bubble) {
        bubble.remove();
        bubble = null;
      }
    };

    wrapper.addEventListener("mouseenter", show);
    wrapper.addEventListener("mouseleave", hide);
    wrapper.addEventListener("focusin", show);
    wrapper.addEventListener("focusout", hide);
  });
}

// --- File Tree ---
function hydrateFileTree() {
  document.querySelectorAll<HTMLElement>('[role="tree"]').forEach((tree) => {
    if (tree.dataset.hydrated) return;
    tree.dataset.hydrated = "true";

    tree.querySelectorAll<HTMLElement>('[role="treeitem"][aria-expanded]').forEach((folder) => {
      const btn = folder.querySelector<HTMLButtonElement>("button[aria-controls]");
      if (!btn) return;
      const chevron = btn.querySelector<SVGElement>(".lucide-chevron-right");

      btn.addEventListener("click", () => {
        const expanded = btn.getAttribute("aria-expanded") === "true";
        const groupId = btn.getAttribute("aria-controls");
        const group = groupId ? document.getElementById(groupId) : null;

        btn.setAttribute("aria-expanded", String(!expanded));
        folder.setAttribute("aria-expanded", String(!expanded));
        if (group) group.style.display = expanded ? "none" : "";
        if (chevron) chevron.style.transform = expanded ? "rotate(0deg)" : "rotate(90deg)";
      });

      btn.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          btn.setAttribute("aria-expanded", "true");
          folder.setAttribute("aria-expanded", "true");
          const g = btn.getAttribute("aria-controls");
          if (g) {
            const el = document.getElementById(g);
            if (el) el.style.display = "";
          }
          if (chevron) chevron.style.transform = "rotate(90deg)";
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          btn.setAttribute("aria-expanded", "false");
          folder.setAttribute("aria-expanded", "false");
          const g = btn.getAttribute("aria-controls");
          if (g) {
            const el = document.getElementById(g);
            if (el) el.style.display = "none";
          }
          if (chevron) chevron.style.transform = "rotate(0deg)";
        }
      });
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountIslands);
} else {
  mountIslands();
}

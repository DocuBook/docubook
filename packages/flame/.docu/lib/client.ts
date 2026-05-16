import { createRoot } from "react-dom/client";
import React from "react";
import Sidebar, { MobileBar } from "../components/Sidebar";
import Toc from "../components/Toc";
import { ThemeToggle } from "../components/Theme";
import type { TocItem } from "./types";

function mountIslands() {
  const sidebarEl = document.getElementById("sidebar-island");
  if (sidebarEl) {
    const tocs: TocItem[] = JSON.parse(sidebarEl.dataset.tocs || "[]");
    const title = sidebarEl.dataset.title || "";
    const repoUrl = sidebarEl.dataset.repo || "";
    createRoot(sidebarEl).render(React.createElement(Sidebar, { tocs, title, repoUrl }));
  }

  const mobileBarEl = document.getElementById("mobile-bar-island");
  if (mobileBarEl) {
    const tocs: TocItem[] = JSON.parse(mobileBarEl.dataset.tocs || "[]");
    const title = mobileBarEl.dataset.title || "";
    const repoUrl = mobileBarEl.dataset.repo || "";
    createRoot(mobileBarEl).render(React.createElement(MobileBar, { tocs, title, repoUrl }));
  }

  const tocEl = document.getElementById("toc-island");
  if (tocEl) {
    const tocs: TocItem[] = JSON.parse(tocEl.dataset.tocs || "[]");
    createRoot(tocEl).render(React.createElement(Toc, { tocs }));
  }

  const themeEl = document.getElementById("theme-island");
  if (themeEl) {
    createRoot(themeEl).render(React.createElement(ThemeToggle));
  }

  hydrateMdxComponents();
}

function hydrateMdxComponents() {
  document.querySelectorAll<HTMLElement>("[data-card-link]").forEach((card) => {
    if (card.dataset.hydrated) return;
    card.dataset.hydrated = "true";
    const icon = card.querySelector<HTMLElement>("[aria-hidden='true']");

    card.addEventListener("mouseenter", () => {
      card.style.borderColor = "hsl(var(--primary, 210 81% 56%))";
      card.style.boxShadow = "0 11px 28px rgba(34, 129, 227, 0.15)";
      card.style.transform = "translateY(-2px)";
      if (icon) icon.style.transform = "scale(1.05)";
    });

    card.addEventListener("mouseleave", () => {
      card.style.borderColor = "hsl(var(--border, 210 20% 85%))";
      card.style.boxShadow = "0 0 0 rgba(0,0,0,0)";
      card.style.transform = "translateY(0)";
      if (icon) icon.style.transform = "scale(1)";
    });
  });

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
    wrapper.addEventListener("keydown", (e) => {
      if (e.key === "Escape") hide();
    });
  });

  document.querySelectorAll<HTMLElement>('[role="tablist"]').forEach((tablist) => {
    if (tablist.dataset.hydrated) return;
    tablist.dataset.hydrated = "true";

    const tabs = tablist.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    const container = tablist.parentElement;
    if (!container) return;

    const panels = container.querySelectorAll<HTMLElement>('[role="tabpanel"]');
    const primary = "hsl(var(--primary, 210 81% 56%))";
    const fg = "hsl(var(--foreground, 220 30% 15%))";

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => {
          t.setAttribute("aria-selected", "false");
          t.tabIndex = -1;
          t.style.borderBottom = "2px solid transparent";
          t.style.color = fg;
        });

        tab.setAttribute("aria-selected", "true");
        tab.tabIndex = 0;
        tab.style.borderBottom = `2px solid ${primary}`;
        tab.style.color = primary;

        const panelId = tab.getAttribute("aria-controls");
        panels.forEach((p) => {
          p.hidden = p.id !== panelId;
        });
      });

      tab.addEventListener("keydown", (e) => {
        const tabsArr = Array.from(tabs);
        const idx = tabsArr.indexOf(tab);
        let target: HTMLButtonElement | null = null;

        if (e.key === "ArrowRight") target = tabsArr[(idx + 1) % tabsArr.length];
        if (e.key === "ArrowLeft") target = tabsArr[(idx - 1 + tabsArr.length) % tabsArr.length];

        if (target) {
          e.preventDefault();
          target.click();
          target.focus();
        }
      });
    });
  });

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

  document.querySelectorAll<HTMLElement>(".mdx-accordion-group").forEach((group) => {
    if (group.dataset.hydrated) return;
    group.dataset.hydrated = "true";
    const headers = group.querySelectorAll<HTMLButtonElement>(".mdx-accordion-header");

    headers.forEach((header) => {
      header.addEventListener("click", () => {
        const accordion = header.closest(".mdx-accordion");
        const content = accordion?.querySelector<HTMLElement>(".mdx-accordion-content");
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

  document.querySelectorAll<HTMLElement>('[role="tree"]').forEach((tree) => {
    if (tree.dataset.hydrated) return;
    tree.dataset.hydrated = "true";

    const primary = "hsl(var(--primary, 210 81% 56%))";
    const muted = "hsl(var(--muted-foreground, 220 15% 50%))";
    const fg = "hsl(var(--foreground, 220 30% 15%))";
    const hoverBg = "hsla(var(--muted, 210 20% 92%) / 0.45)";
    const fileBg = "hsla(var(--muted, 210 20% 92%) / 0.35)";

    tree.querySelectorAll<HTMLElement>('[role="treeitem"][aria-expanded]').forEach((folder) => {
      const btn = folder.querySelector<HTMLButtonElement>("button[aria-controls]");
      if (!btn) return;

      const chevron = btn.querySelector<SVGElement>(".lucide-chevron-right");
      const icons = btn.querySelectorAll<SVGElement>("svg:not(.lucide-chevron-right)");
      const label = btn.querySelector<HTMLSpanElement>("span");

      btn.addEventListener("mouseenter", () => {
        btn.style.background = hoverBg;
        if (chevron) chevron.style.color = primary;
        icons.forEach((i) => (i.style.color = primary));
        if (label) label.style.color = primary;
      });

      btn.addEventListener("mouseleave", () => {
        btn.style.background = "transparent";
        if (chevron) chevron.style.color = muted;
        icons.forEach((i) => (i.style.color = muted));
        if (label) label.style.color = fg;
      });

      btn.addEventListener("click", () => {
        const expanded = btn.getAttribute("aria-expanded") === "true";
        const groupId = btn.getAttribute("aria-controls");
        const group = groupId ? document.getElementById(groupId) : null;

        btn.setAttribute("aria-expanded", String(!expanded));
        folder.setAttribute("aria-expanded", String(!expanded));

        if (group) group.style.display = expanded ? "none" : "";
        if (chevron) chevron.style.transform = expanded ? "rotate(0deg)" : "rotate(90deg)";

        const folderIcon = btn.querySelector<SVGElement>(".lucide-folder-open, .lucide-folder");
        if (folderIcon) {
          if (expanded) {
            folderIcon.classList.replace("lucide-folder-open", "lucide-folder");
            folderIcon.innerHTML =
              '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>';
          } else {
            folderIcon.classList.replace("lucide-folder", "lucide-folder-open");
            folderIcon.innerHTML =
              '<path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/>';
          }
        }
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

    tree.querySelectorAll<HTMLElement>('[role="treeitem"]:not([aria-expanded])').forEach((file) => {
      const icon = file.querySelector<SVGElement>(".lucide-file");
      const nameSpan = file.querySelector<HTMLSpanElement>("span");
      if (!nameSpan) return;

      const fileName = nameSpan.textContent || "";
      const ext = fileName.split(".").pop()?.toUpperCase();

      let badge: HTMLSpanElement | null = null;
      if (ext) {
        badge = document.createElement("span");
        badge.textContent = ext;
        badge.style.cssText =
          "margin-left:auto;font-size:0.7rem;color:hsl(var(--muted-foreground, 220 15% 50%));display:none;";
        file.appendChild(badge);
      }

      file.addEventListener("mouseenter", () => {
        file.style.background = fileBg;
        if (icon) icon.style.color = primary;
        if (badge) badge.style.display = "";
      });

      file.addEventListener("mouseleave", () => {
        file.style.background = "transparent";
        if (icon) icon.style.color = muted;
        if (badge) badge.style.display = "none";
      });
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountIslands);
} else {
  mountIslands();
}

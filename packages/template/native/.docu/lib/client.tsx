import "../styles/globals.css";
import { hydrateRoot } from "react-dom/client";
import React from "react";
import Search from "../components/Search";
import { ThemeToggle } from "../components/Theme";
import Sidebar from "../components/Sidebar";
import Toc from "../components/Toc";
import { Context } from "../components/Context";
import Menu from "../components/Menu";

function hydrateIslands() {
  // Search modals (Cmd+K listener + modal)
  document.querySelectorAll<HTMLElement>("[data-island='search']").forEach((el) => {
    hydrateRoot(el, React.createElement(Search));
  });

  // Theme toggles
  document.querySelectorAll<HTMLElement>("[data-island='theme']").forEach((el) => {
    hydrateRoot(el, React.createElement(ThemeToggle));
  });

  // Sidebar (mobile bar + desktop)
  document.querySelectorAll<HTMLElement>("[data-island='sidebar']").forEach((el) => {
    const tocs = JSON.parse(el.dataset.tocs || "[]");
    const title = el.dataset.title || "";
    const repoUrl = el.dataset.repo || "";
    hydrateRoot(el, React.createElement(Sidebar, { tocs, title, repoUrl }));
  });

  // Desktop TOC
  document.querySelectorAll<HTMLElement>("[data-island='toc']").forEach((el) => {
    const tocs = JSON.parse(el.dataset.tocs || "[]");
    hydrateRoot(el, React.createElement(Toc, { tocs }));
  });

  // Context switcher
  document.querySelectorAll<HTMLElement>("[data-island='context']").forEach((el) => {
    hydrateRoot(el, React.createElement(Context));
  });

  // Menu (sidebar navigation)
  document.querySelectorAll<HTMLElement>("[data-island='menu']").forEach((el) => {
    const isSheet = el.dataset.sheet === "true";
    hydrateRoot(el, React.createElement(Menu, { isSheet }));
  });
}

// Global Cmd+K shortcut (works even without island hydration)
function initGlobalShortcuts() {
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      // Find and open the search modal
      const dialog = document.querySelector<HTMLDialogElement>(".modal");
      if (dialog) dialog.showModal();
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    hydrateIslands();
    initGlobalShortcuts();
  });
} else {
  hydrateIslands();
  initGlobalShortcuts();
}

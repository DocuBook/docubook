/**
 * Browser side of @docubook/plugin-search-algolia — the `SearchProvider`
 * flame imports the first time the reader opens search or Ask AI.
 *
 * Two DocSearch surfaces, each loaded on first use:
 * - keyword search: `@docsearch/js/docsearch`, the entry without Ask AI, so
 *   the dialog shows search results only;
 * - Ask AI: `@docsearch/sidepanel-js`, a chat panel beside the page.
 *
 * Flame owns the visible buttons and the Ctrl/⌘ K and Ctrl/⌘ I shortcuts, so
 * DocSearch's own buttons are hidden and its shortcuts are turned off.
 */

import type { SearchProvider } from "@docubook/flame";
import type { ClientConfig } from "../options";
// Extracted to `style.css` by the library build (not injected); loaded with a
// <link> on first use, see loadStylesheet().
import "./style.css";

type DocSearchInstance = { readonly isOpen: boolean; open(): void; close(): void };
type SidepanelInstance = { readonly isOpen: boolean; open(): void; close(): void };

// A variable, not a literal: Vite would otherwise inline the stylesheet into
// this module as a data URL instead of leaving it beside the module.
const STYLESHEET = "style.css";
const ROOT_ID = "docubook-docsearch";

let stylesheet: Promise<void> | null = null;

/** Load the DocSearch theme once, before the first surface renders. */
function loadStylesheet(): Promise<void> {
  stylesheet ??= new Promise<void>((resolve) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = new URL(STYLESHEET, import.meta.url).href;
    // An unstyled dialog is still usable: never block search on CSS.
    link.onload = link.onerror = () => resolve();
    document.head.appendChild(link);
  });
  return stylesheet;
}

/** Hidden mount points: DocSearch renders its own trigger buttons there. */
function mountPoint(name: string): HTMLElement {
  let root = document.getElementById(ROOT_ID);
  if (!root) {
    root = document.createElement("div");
    root.id = ROOT_ID;
    root.hidden = true;
    document.body.appendChild(root);
  }
  const el = document.createElement("div");
  el.dataset.surface = name;
  root.appendChild(el);
  return el;
}

/**
 * Keep hit links on the current origin. The crawler records the production
 * URL; following it from `flame dev` or a preview deployment would leave the
 * site the reader is on.
 */
export function sameOriginUrl(url: string, origin: string): string {
  try {
    const parsed = new URL(url, origin);
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return url;
  }
}

/**
 * Resolve once the instance reports ready. DocSearch may call `onReady`
 * before `docsearch()` returns, so the callback only flips a flag that the
 * caller reads after assignment.
 */
function whenReady<T>(create: (onReady: () => void) => T): Promise<T> {
  return new Promise((resolve) => {
    let instance: T | undefined;
    let ready = false;
    instance = create(() => {
      ready = true;
      if (instance !== undefined) resolve(instance);
    });
    if (ready) resolve(instance);
  });
}

/** Focus a field once the surface has rendered it. */
function focusSoon(selector: string) {
  requestAnimationFrame(() => document.querySelector<HTMLElement>(selector)?.focus());
}

export default function createSearchProvider(config: ClientConfig): SearchProvider {
  let modal: Promise<DocSearchInstance> | null = null;
  let panel: Promise<SidepanelInstance> | null = null;
  let panelInstance: SidepanelInstance | null = null;
  let modalInstance: DocSearchInstance | null = null;

  // Focus returns to the element that opened a surface (the sidebar trigger,
  // or wherever the reader was for a shortcut) once both surfaces are closed.
  // `switching` marks a close that hands over to the other surface.
  let lastFocused: HTMLElement | null = null;
  let switching = false;
  const rememberFocus = () => {
    if (modalInstance?.isOpen || panelInstance?.isOpen) return;
    if (document.activeElement instanceof HTMLElement) lastFocused = document.activeElement;
  };
  const onSurfaceClose = () => {
    if (switching) {
      switching = false;
      return;
    }
    lastFocused?.focus();
    lastFocused = null;
  };

  const loadModal = () =>
    (modal ??= Promise.all([import("@docsearch/js/docsearch"), loadStylesheet()]).then(
      ([{ default: docsearch }]) =>
        whenReady((onReady) =>
          docsearch({
            ...config.search,
            container: mountPoint("search"),
            keyboardShortcuts: { "Ctrl/Cmd+K": false, "/": false },
            transformItems: config.relativeUrls
              ? (items) =>
                  items.map((item) => ({
                    ...item,
                    url: sameOriginUrl(item.url, location.origin),
                  }))
              : undefined,
            // DocSearch only autofocuses its input on the first open.
            onOpen: () => focusSoon("#docsearch-input"),
            onClose: onSurfaceClose,
            onReady,
          } as Parameters<typeof docsearch>[0])
        ).then((instance) => (modalInstance = instance))
    ));

  const assistant = config.assistant;
  const loadPanel = () =>
    (panel ??= Promise.all([import("@docsearch/sidepanel-js"), loadStylesheet()]).then(
      ([{ default: sidepanel }]) =>
        whenReady((onReady) =>
          sidepanel({
            container: mountPoint("ask-ai"),
            agentId: assistant!.agentId,
            appId: assistant!.appId,
            apiKey: assistant!.apiKey,
            indices: assistant!.indices,
            searchParameters: assistant!.searchParameters,
            panel: assistant!.panel,
            keyboardShortcuts: { "Ctrl/Cmd+I": false },
            onOpen: () => focusSoon(".DocSearch-Sidepanel textarea"),
            onClose: onSurfaceClose,
            onReady,
          } as Parameters<typeof sidepanel>[0])
        ).then((instance) => (panelInstance = instance))
    ));

  // Start fetching DocSearch now: flame imports this module on hover or
  // focus of a trigger, so the dialog is usually ready by the click.
  void loadModal();

  return {
    open() {
      rememberFocus();
      // One surface at a time: search replaces an open Ask AI panel.
      if (panelInstance?.isOpen) {
        switching = true;
        panelInstance.close();
      }
      void loadModal().then((instance) => {
        if (!instance.isOpen) instance.open();
      });
    },
    askAi: assistant
      ? () => {
          if (panelInstance?.isOpen) {
            panelInstance.close();
            return;
          }
          rememberFocus();
          if (modalInstance?.isOpen) {
            switching = true;
            modalInstance.close();
          }
          void loadPanel().then((instance) => instance.open());
        }
      : undefined,
  };
}

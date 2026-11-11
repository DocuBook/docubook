// Loader for the Ask AI side panel: see AskAiButton.astro. Imported by Navbar.astro's script.
// ?url keeps DocSearch's styles out of the page's inlined CSS; they are attached when the panel loads.
import styleUrl from "@docsearch/css/dist/style.css?url";
import sidepanelUrl from "@docsearch/css/dist/sidepanel.css?url";
import { stylesheet } from "../../lib/stylesheet";

// __ASK_AI__ is injected by astro.config.mjs from packages/flame/docu.json: same Algolia agent as the docs.
type Panel = { readonly isReady: boolean; open(): void };
let panel: Promise<Panel> | undefined;
// Resolve only once DocSearch reports ready: open() before that is a no-op.
const load = () =>
  (panel ??= Promise.all([
    import("@docsearch/sidepanel-js"),
    stylesheet(styleUrl),
    stylesheet(sidepanelUrl),
  ]).then(
    ([{ default: sidepanel }]) =>
      new Promise<Panel>((resolve) => {
        let instance: Panel | undefined;
        let ready = false;
        instance = sidepanel({
          container: document.getElementById("ask-ai-mount")!,
          ...__ASK_AI__,
          panel: { variant: "floating", side: "right" },
          onReady: () => {
            ready = true;
            if (instance) resolve(instance);
          },
        } as Parameters<typeof sidepanel>[0]) as unknown as Panel;
        if (ready || instance.isReady) resolve(instance);
      })
  ));
// Every trigger (this button, the mobile drawer's) opens the same panel.
document.querySelectorAll<HTMLElement>("[data-ask-ai-trigger]").forEach((t) => {
  t.addEventListener("click", () => load().then((p) => p.open()));
  t.addEventListener("mouseenter", load);
  t.addEventListener("focus", load);
});

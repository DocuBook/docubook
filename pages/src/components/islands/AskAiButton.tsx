import { useEffect, useRef } from "react";
import "@docsearch/css";
import "@docsearch/css/dist/sidepanel.css";

// Injected by astro.config.mjs from packages/flame/docu.json: same Algolia agent as the docs.
declare const __ASK_AI__: { appId: string; apiKey: string; agentId: string; indices?: string[] };
type Panel = { readonly isReady: boolean; open(): void };

export default function AskAiButton() {
  const panel = useRef<Promise<Panel> | null>(null);
  // Resolve only once DocSearch reports ready: open() before that is a no-op.
  const load = () =>
    (panel.current ??= import("@docsearch/sidepanel-js").then(
      ({ default: sidepanel }) =>
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
  // Any element with data-ask-ai-trigger (the mobile drawer button) opens the same panel.
  useEffect(() => {
    const triggers = Array.from(document.querySelectorAll<HTMLElement>("[data-ask-ai-trigger]"));
    const open = () => load().then((p) => p.open());
    triggers.forEach((t) => {
      t.addEventListener("click", open);
      t.addEventListener("mouseenter", load);
      t.addEventListener("focus", load);
    });
    return () =>
      triggers.forEach((t) => {
        t.removeEventListener("click", open);
        t.removeEventListener("mouseenter", load);
        t.removeEventListener("focus", load);
      });
  }, []);
  return (
    <>
      <button
        type="button"
        onMouseEnter={load}
        onFocus={load}
        onClick={() => load().then((p) => p.open())}
        className="bg-ink inline-flex h-[50px] items-center gap-2.5 rounded px-[22px] text-sm font-semibold text-white"
      >
        Ask AI
        <svg
          className="size-[18px]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
          <path d="M20 3v4" />
          <path d="M22 5h-4" />
          <path d="M4 17v2" />
          <path d="M5 18H3" />
        </svg>
      </button>
      <div id="ask-ai-mount" hidden />
    </>
  );
}

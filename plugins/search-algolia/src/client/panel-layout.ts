/** Keep Algolia's own panel, but dock its box beside Flame's document box. */
export function createPanelLayout() {
  let open = false;
  let frame = 0;
  let panel: HTMLElement | null = null;
  let root: HTMLElement | null = null;
  let observer: MutationObserver | null = null;
  let resize: ResizeObserver | null = null;
  let waiting: MutationObserver | null = null;

  function preserveReadingPosition(update: () => void) {
    const scroller = document.getElementById("scroll-container");
    const top = scroller?.getBoundingClientRect().top ?? 0;
    const headings = [
      ...(scroller?.querySelectorAll<HTMLElement>(
        "#mdx-content-island :is(h2[id], h3[id], h4[id], p, li, pre)"
      ) ?? []),
    ];
    const anchor = headings
      .reverse()
      .find((heading) => heading.getBoundingClientRect().top <= top + 24);
    const before = anchor?.getBoundingClientRect().top;
    update();
    if (anchor && scroller && before !== undefined) {
      scroller.scrollTop += anchor.getBoundingClientRect().top - before;
    }
  }

  function undock() {
    preserveReadingPosition(() => {
      root?.removeAttribute("data-ask-ai-side");
      root?.style.removeProperty("--flame-ask-ai-width");
      panel?.removeAttribute("data-flame-docked");
    });
  }

  function schedule() {
    if (open && !frame) frame = requestAnimationFrame(sync);
  }

  function sync() {
    frame = 0;
    if (!open) return;
    const workspace = document.querySelector<HTMLElement>(".docs-workspace");
    const box = document.getElementById("scroll-container");
    root = document.querySelector<HTMLElement>(".docs-layout");
    if (!workspace || !box || !root) return;

    if (!panel) {
      panel = document.querySelector<HTMLElement>(".DocSearch-Sidepanel-Container.is-open");
      if (!panel) return;
      waiting?.disconnect();
      observer = new MutationObserver(schedule);
      observer.observe(panel, { attributes: true, attributeFilter: ["class", "style"] });
      resize = new ResizeObserver(schedule);
      resize.observe(workspace);
      resize.observe(box);
      resize.observe(panel);
    }

    if (window.innerWidth < 1024 || !panel.classList.contains("is-open")) {
      if (root.hasAttribute("data-ask-ai-side")) undock();
      return;
    }

    preserveReadingPosition(() => {
      const side = panel!.classList.contains("side-left") ? "left" : "right";
      root!.dataset.askAiSide = side;
      // Read after the compact sidebar takes effect. The workspace itself
      // keeps its width; only its document box gives space to the panel.
      const gutter =
        parseFloat(getComputedStyle(workspace).getPropertyValue("--docs-gutter")) || 32;
      const max = Math.max(280, workspace.clientWidth - gutter * 2 - 16 - 420);
      setStyle(panel!, "--flame-ask-ai-max-width", `${max}px`);
      panel!.dataset.flameDocked = side;
      setStyle(root!, "--flame-ask-ai-width", `${panel!.getBoundingClientRect().width}px`);
      const rect = box.getBoundingClientRect();
      const workspaceRect = workspace.getBoundingClientRect();
      const edge =
        side === "right"
          ? window.innerWidth - workspaceRect.right + gutter
          : workspaceRect.left + gutter;
      setStyle(panel!, "--flame-ask-ai-top", `${rect.top}px`);
      setStyle(
        panel!,
        "--flame-ask-ai-bottom",
        `${Math.max(0, window.innerHeight - rect.bottom)}px`
      );
      setStyle(panel!, "--flame-ask-ai-left", side === "left" ? `${edge}px` : "auto");
      setStyle(panel!, "--flame-ask-ai-right", side === "right" ? `${edge}px` : "auto");
    });
  }

  return {
    open() {
      if (open || !document.querySelector(".docs-workspace")) return;
      open = true;
      waiting = new MutationObserver(schedule);
      waiting.observe(document.body, { childList: true, subtree: true });
      window.addEventListener("resize", schedule);
      schedule();
    },
    close() {
      open = false;
      cancelAnimationFrame(frame);
      frame = 0;
      waiting?.disconnect();
      observer?.disconnect();
      resize?.disconnect();
      window.removeEventListener("resize", schedule);
      undock();
      panel = null;
      root = null;
    },
  };
}

function setStyle(element: HTMLElement, name: string, value: string) {
  if (element.style.getPropertyValue(name) !== value) element.style.setProperty(name, value);
}

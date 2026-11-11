// The Resources menu's behaviour. Navbar.astro imports this, with megaMenu.css, on the first hover, focus or
// click of the trigger. The panel is stamped from its <template> (MegaMenu.astro) here, so a page that never opens the menu
// runs none of this and fetches neither the styles nor the mascot.
export function mount(trigger: HTMLButtonElement, firstEvent: string) {
  const template = document.getElementById("mega-menu-template") as HTMLTemplateElement;
  const panel = template.content.firstElementChild!.cloneNode(true) as HTMLElement;
  panel.hidden = true;
  trigger.after(panel); // right after the trigger, so Tab moves from it into the panel
  trigger.setAttribute("aria-controls", panel.id);

  let closing = 0;
  const isOpen = () => !panel.hidden;
  const set = (open: boolean) => {
    clearTimeout(closing);
    panel.hidden = !open;
    trigger.setAttribute("aria-expanded", String(open));
  };
  // A short grace period lets the pointer cross the gap between the trigger and the panel.
  const leave = () => (closing = window.setTimeout(() => set(false), 160));
  for (const el of [trigger, panel]) {
    el.addEventListener("mouseenter", () => set(true));
    el.addEventListener("mouseleave", leave);
  }
  // detail is 0 for a keyboard click: Enter and Space toggle, a pointer click only opens (hover already did).
  trigger.addEventListener("click", (e) => set(e.detail === 0 ? !isOpen() : true));
  addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !isOpen()) return;
    set(false);
    trigger.focus();
  });
  document.addEventListener("click", (e) => {
    const target = e.target as Node;
    if (isOpen() && !panel.contains(target) && !trigger.contains(target)) set(false);
  });
  // On the trigger too: Shift+Tab from it leaves backwards without ever entering the panel.
  for (const el of [trigger, panel])
    el.addEventListener("focusout", (e) => {
      const to = e.relatedTarget as Node | null;
      if (to && to !== trigger && !panel.contains(to)) set(false);
    });

  if (firstEvent === "click" || (firstEvent === "mouseenter" && trigger.matches(":hover")))
    set(true);
}

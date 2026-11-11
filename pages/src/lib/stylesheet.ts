/** Attach a stylesheet and resolve once it has loaded (or failed): for styles that arrive with a lazily loaded feature. */
export const stylesheet = (href: string) =>
  new Promise<void>((resolve) => {
    const link = Object.assign(document.createElement("link"), { rel: "stylesheet", href });
    link.onload = link.onerror = () => resolve();
    document.head.append(link);
  });

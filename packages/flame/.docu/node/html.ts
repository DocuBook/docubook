export interface HtmlShellOptions {
  title: string;
  description: string;
  body: string;
  favicon: string;
  css: string;
  js: string;
  nonce?: string;
  extraScripts?: string;
  themeCss?: string;
  /** HTML strings to inject before `</head>` (from plugin `injectHead` hooks). */
  headExtra?: string[];
  /** HTML strings to inject before `</body>`, after the main script (from plugin `injectBody` hooks). */
  bodyExtra?: string[];
}

export function htmlShell(opts: HtmlShellOptions): string {
  const {
    title,
    description,
    body,
    favicon,
    css,
    js,
    nonce,
    extraScripts,
    themeCss,
    headExtra,
    bodyExtra,
  } = opts;
  const nonceAttr = nonce ? ` nonce="${Bun.escapeHTML(nonce)}"` : "";
  const themeStyle = themeCss ? `\n  <style${nonceAttr}>${Bun.escapeHTML(themeCss)}</style>` : "";
  const headInjection = headExtra?.length ? `\n  ${headExtra.join("\n  ")}` : "";
  const bodyInjection = bodyExtra?.length ? `\n  ${bodyExtra.join("\n  ")}` : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${Bun.escapeHTML(title)}</title>
  <meta name="description" content="${Bun.escapeHTML(description)}">
  <link rel="icon" type="image/x-icon" href="${Bun.escapeHTML(favicon)}">${themeStyle}
  <link rel="stylesheet" href="/assets/${Bun.escapeHTML(css)}">
  <script${nonceAttr}>try{if(localStorage.getItem("theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}</script>${headInjection}
</head>
<body>
  <div id="root">${body}</div>
  <script${nonceAttr} src="/assets/${Bun.escapeHTML(js)}"></script>${extraScripts ? `\n  ${extraScripts}` : ""}${bodyInjection}
</body>
</html>`;
}

export function hmrScript(nonce: string): string {
  return `<script nonce="${Bun.escapeHTML(nonce)}">
(function(){
  const es = new EventSource("/__hmr");
  es.onmessage = function(e) {
    if (e.data === "reload") window.location.reload();
  };
  es.onerror = function() { es.close(); setTimeout(() => { window.location.reload(); }, 2000); };
})();
</script>`;
}

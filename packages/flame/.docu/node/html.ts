export interface HtmlShellOptions {
  title: string;
  description: string;
  body: string;
  favicon: string;
  css: string;
  js: string;
  nonce?: string;
  extraScripts?: string;
}

export function htmlShell(opts: HtmlShellOptions): string {
  const { title, description, body, favicon, css, js, nonce, extraScripts } = opts;
  const nonceAttr = nonce ? ` nonce="${Bun.escapeHTML(nonce)}"` : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${Bun.escapeHTML(title)}</title>
  <meta name="description" content="${Bun.escapeHTML(description)}">
  <link rel="icon" type="image/x-icon" href="${Bun.escapeHTML(favicon)}">
  <link rel="stylesheet" href="/assets/${Bun.escapeHTML(css)}">
  <script${nonceAttr}>try{if(localStorage.getItem("theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}</script>
</head>
<body>
  <div id="root">${body}</div>
  <script${nonceAttr} src="/assets/${Bun.escapeHTML(js)}"></script>${extraScripts ? `\n  ${extraScripts}` : ""}
</body>
</html>`;
}

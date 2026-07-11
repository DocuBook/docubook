import type { SeoMeta } from "./seo";

export interface HtmlShellOptions {
  title: string;
  description: string;
  body: string;
  favicon: string;
  css: string;
  js: string;
  nonce?: string;
  /**
   * Content-Security-Policy value (from `cspHeader()` in security.ts).
   * When provided, injects `<meta http-equiv="Content-Security-Policy">` in `<head>`.
   * Essential for static deployment where HTTP headers cannot be set.
   */
  csp?: string;
  extraScripts?: string;
  themeCss?: string;
  /** Depth from document root (0=root, 1=subdir, 2=sub/subdir). Used for relative asset paths. */
  depth?: number;
  /** HTML strings to inject before `</head>` (from plugin `injectHead` hooks). */
  headExtra?: string[];
  /** HTML strings to inject before `</body>`, after the main script (from plugin `injectBody` hooks). */
  bodyExtra?: string[];
  /** SEO meta tags derived from config + frontmatter */
  seo?: SeoMeta;
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
    csp,
    extraScripts,
    themeCss,
    depth = 0,
    headExtra,
    bodyExtra,
  } = opts;
  const nonceAttr = nonce ? ` nonce="${Bun.escapeHTML(nonce)}"` : "";
  const themeStyle = themeCss ? `\n  <style${nonceAttr}>${Bun.escapeHTML(themeCss)}</style>` : "";
  const headInjection = headExtra?.length ? `\n  ${headExtra.join("\n  ")}` : "";
  const bodyInjection = bodyExtra?.length ? `\n  ${bodyExtra.join("\n  ")}` : "";
  const depthPrefix = depth === 0 ? "" : "../".repeat(depth);
  const assetPrefix = depthPrefix + "assets/";
  const resolvePath = (path: string) => (path.startsWith("/") ? depthPrefix + path.slice(1) : path);

  // Build SEO meta tags (OG, Twitter, canonical)
  let seoTags = "";
  if (opts.seo) {
    const s = opts.seo;
    const e = Bun.escapeHTML;
    seoTags = `\n  <meta property="og:title" content="${e(title)}" />\n  <meta property="og:description" content="${e(description)}" />\n  <meta property="og:url" content="${e(s.url)}" />\n  <meta property="og:type" content="website" />\n  <meta property="og:site_name" content="${e(s.siteName)}" />\n  <meta name="twitter:card" content="summary_large_image" />\n  <link rel="canonical" href="${e(s.url)}" />`;
    if (s.image) {
      seoTags += `\n  <meta property="og:image" content="${e(s.image)}" />`;
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${Bun.escapeHTML(title)}</title>
  <meta name="description" content="${Bun.escapeHTML(description)}">
  ${favicon ? `<link rel="icon" type="image/x-icon" href="${Bun.escapeHTML(resolvePath(favicon))}">` : ""}${themeStyle}
  <link rel="stylesheet" href="${Bun.escapeHTML(assetPrefix + css)}">
  ${csp ? `<meta http-equiv="Content-Security-Policy" content="${Bun.escapeHTML(csp)}">` : ""}
  ${seoTags}
  <script${nonceAttr}>try{if(localStorage.getItem("theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}</script>${headInjection}
</head>
<body>
  <div id="root">${body}</div>
  <script type="module"${nonceAttr} src="${Bun.escapeHTML(assetPrefix + js)}"></script>${extraScripts ? `\n  ${extraScripts}` : ""}${bodyInjection}
</body>
</html>`;
}

export function errorHtml(message: string, stack?: string): string {
  const msg = Bun.escapeHTML(message || "Unknown error");
  const st = Bun.escapeHTML(stack || "");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Server Error</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{padding:2rem;font-family:ui-monospace,monospace;background:#1a1a2e;color:#e0e0e0}
    h1{color:#ff6b6b;font-size:1.5rem;margin-bottom:1rem}
    pre{background:#0d0d1a;border:1px solid #333;border-radius:8px;padding:1.5rem;overflow-x:auto;font-size:14px;line-height:1.6;white-space:pre-wrap;word-break:break-word}
    .msg{color:#ff6b6b;font-weight:bold}
  </style>
</head>
  <body>
  <h1>🔥 Server Error</h1>
    <pre><span class="msg">${msg}</span>${st ? `\n\n${st}` : ""}</pre>
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

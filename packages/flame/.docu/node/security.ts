import { resolve } from "node:path";
import { realpathSync } from "node:fs";

export const SECURITY_HEADERS: Record<string, string> = {
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

export function generateNonce(): string {
  return crypto.randomUUID();
}

export function cspHeader(nonce: string, allowEval = false): string {
  const scriptSrc = allowEval
    ? `script-src 'self' 'nonce-${nonce}' 'unsafe-eval'`
    : `script-src 'self' 'nonce-${nonce}'`;
  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https: data:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "frame-src https://www.youtube-nocookie.com",
    "frame-ancestors 'none'",
  ].join("; ");
}

export function isPathSafe(pathname: string, baseDir: string): boolean {
  const decoded = decodeURIComponent(pathname);
  const resolved = resolve(baseDir, decoded.slice(1));
  const baseDirSlash = baseDir.endsWith("/") ? baseDir : baseDir + "/";
  if (!(resolved === baseDir || resolved.startsWith(baseDirSlash))) {
    return false;
  }

  if (resolved === baseDir) return true;
  try {
    const real = realpathSync(resolved);
    const realBase = realpathSync(baseDir);
    const realBaseDirSlash = realBase.endsWith("/") ? realBase : realBase + "/";
    return real.startsWith(realBaseDirSlash);
  } catch (err) {
    const nodeErr = err as NodeJS.ErrnoException;
    if (nodeErr.code === "ENOENT") {
      return true;
    }
    console.error(
      `[security] isPathSafe error for pathname="${pathname}": ${nodeErr.message} (code=${nodeErr.code})`
    );
    return false;
  }
}

export function isSlugSafe(slug: string, docsDir: string): boolean {
  const resolved = resolve(docsDir, slug);
  const docsDirSlash = docsDir.endsWith("/") ? docsDir : docsDir + "/";
  if (!(resolved === docsDir || resolved.startsWith(docsDirSlash))) {
    return false;
  }

  if (resolved === docsDir) return true;
  try {
    const real = realpathSync(resolved);
    const realDocsDir = realpathSync(docsDir);
    const realDocsDirSlash = realDocsDir.endsWith("/") ? realDocsDir : realDocsDir + "/";
    return real.startsWith(realDocsDirSlash);
  } catch (err) {
    const nodeErr = err as NodeJS.ErrnoException;
    if (nodeErr.code === "ENOENT") {
      return true;
    }
    console.error(
      `[security] isSlugSafe error for slug="${slug}": ${nodeErr.message} (code=${nodeErr.code})`
    );
    return false;
  }
}

export function injectNonce(html: string, nonce: string): string {
  return html.replace(/<script\b(?![^>]*\bsrc\s*=)([^>]*)>/gi, (match) => {
    if (/nonce\s*=/i.test(match)) {
      return match.replace(/nonce="[^"]*"/i, `nonce="${nonce}"`);
    }
    return match.replace(/>$/, ` nonce="${nonce}">`);
  });
}

export interface PluginResponseLike {
  status: number;
  statusText?: string;
  headers: Headers;
  body: BodyInit | null;
}

/**
 * Wrap a plugin response with security headers.
 * - Fills in SECURITY_HEADERS defaults where plugin hasn't set a value
 * - Adds Content-Security-Policy for HTML responses (with optional unsafe-eval)
 * - Preserves plugin body, status, statusText unchanged
 */
export function wrapPluginResponse(
  pluginResponse: PluginResponseLike,
  allowEval = false
): Response {
  const securedHeaders = new Headers(pluginResponse.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    if (!securedHeaders.has(key)) {
      securedHeaders.set(key, value);
    }
  }
  const contentType = securedHeaders.get("Content-Type") || "";
  if (contentType.includes("text/html") && !securedHeaders.has("Content-Security-Policy")) {
    securedHeaders.set("Content-Security-Policy", cspHeader(generateNonce(), allowEval));
  }
  return new Response(pluginResponse.body, {
    status: pluginResponse.status,
    statusText: pluginResponse.statusText,
    headers: securedHeaders,
  });
}

export function htmlResponse(
  html: string,
  nonce: string,
  status = 200,
  allowEval = false
): Response {
  return new Response(html, {
    status,
    headers: {
      "Content-Type": "text/html",
      ...SECURITY_HEADERS,
      "Content-Security-Policy": cspHeader(nonce, allowEval),
    },
  });
}

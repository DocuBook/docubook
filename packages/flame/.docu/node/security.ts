import { resolve } from "node:path";

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

/**
 * Check if a URL pathname resolves safely within a base directory.
 * Guards against path traversal attacks including URL-encoded variants.
 */
export function isPathSafe(pathname: string, baseDir: string): boolean {
  const decoded = decodeURIComponent(pathname);
  const resolved = resolve(baseDir, decoded.slice(1));
  return resolved.startsWith(baseDir);
}

/**
 * Check if a slug resolves safely within a docs directory.
 */
export function isSlugSafe(slug: string, docsDir: string): boolean {
  const resolved = resolve(docsDir, slug);
  return resolved.startsWith(docsDir);
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

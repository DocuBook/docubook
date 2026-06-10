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
    const realBaseDirSlash = realpathSync(baseDir).endsWith("/")
      ? realpathSync(baseDir)
      : realpathSync(baseDir) + "/";
    return real.startsWith(realBaseDirSlash);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return true;
    }
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
    const realDocsDirSlash = realpathSync(docsDir).endsWith("/")
      ? realpathSync(docsDir)
      : realpathSync(docsDir) + "/";
    return real.startsWith(realDocsDirSlash);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return true;
    }
    return false;
  }
}

export function injectNonce(html: string, nonce: string): string {
  return html.replace(/<script\b(?![^>]*\bsrc\s*=)([^>]*)>/gi, (match) => {
    if (/nonce\s*=/i.test(match)) return match;
    return match.replace(/>$/, ` nonce="${nonce}">`);
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

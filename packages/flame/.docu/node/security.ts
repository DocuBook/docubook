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

export function cspHeader(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'unsafe-eval'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https: data:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "frame-src https://www.youtube-nocookie.com",
    "frame-ancestors 'none'",
  ].join("; ");
}

export function htmlResponse(html: string, nonce: string, status = 200): Response {
  return new Response(html, {
    status,
    headers: {
      "Content-Type": "text/html",
      ...SECURITY_HEADERS,
      "Content-Security-Policy": cspHeader(nonce),
    },
  });
}

const ESCAPE_RE = /[&<>"']/g;

const ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
};

/**
 * Runtime-neutral HTML escaping — same character set as `Bun.escapeHTML`
 * (& < > " '). Used by the shared HTML shell so Node/Deno entries never
 * touch the Bun global.
 */
export function escapeHtml(input: string): string {
  return input.replace(ESCAPE_RE, (ch) => ESCAPE_MAP[ch]);
}

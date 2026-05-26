import { vi } from "vitest";

// Mock Bun globals for vitest (runs in Node, not Bun runtime)
if (typeof globalThis.Bun === "undefined") {
  (globalThis as Record<string, unknown>).Bun = {
    escapeHTML: (str: string) =>
      str.replace(/[&<>"']/g, (c) => {
        const map: Record<string, string> = {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        };
        return map[c] || c;
      }),
    spawn: vi.fn(() => ({ stdout: new Response("").body! })),
  };
}

// Mock document for client-side module imports
if (typeof globalThis.document === "undefined") {
  (globalThis as Record<string, unknown>).document = {
    readyState: "complete",
    addEventListener: vi.fn(),
    getElementById: vi.fn(() => null),
  };
}

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFile(fileURLToPath(new URL(path, import.meta.url)), "utf8");

describe("style.css", () => {
  it("shows the Sidepanel's remove-conversation button that the dialog stylesheet hides", async () => {
    // The dialog stylesheet hides the button outside a selected search hit...
    const dialog = await read("../../node_modules/@docsearch/css/dist/style.css");
    expect(dialog).toMatch(/\.DocSearch-Hit-action-button\{[^}]*display:none/);
    // ...so the plugin has to show it again in the conversation history.
    const plugin = await read("../client/style.css");
    expect(plugin).toMatch(
      /\.DocSearch-Sidepanel-RecentConversation \.DocSearch-Hit-action-button \{\s*display: block;\s*\}/
    );
  });

  it("pins the upstream desktop panel rules that the fullscreen override must outrank", async () => {
    const upstream = await read("../../node_modules/@docsearch/css/dist/sidepanel.css");
    // Keep assertions inside the desktop media blocks: a mobile default must
    // not hide an upstream breakpoint or specificity change during upgrades.
    const desktop = [
      ...upstream.matchAll(
        /@media\s+screen\s+and\s+\(width\s*>=\s*769px\)\s*\{((?:[^{}]|\{[^{}]*\})*)\}/g
      ),
    ]
      .map((match) => match[1])
      .join("\n");

    expect(desktop).toMatch(/\.DocSearch-Sidepanel-Container\s*\{[^}]*width:\s*var\(--sp-width\)/);
    for (const variant of ["floating", "inline"]) {
      for (const side of ["left", "right"]) {
        expect(desktop).toContain(`.DocSearch-Sidepanel-Container.${variant}.side-${side}{`);
      }
    }
    expect(desktop).toMatch(
      /\.DocSearch-Sidepanel-Action-menu,\s*\.DocSearch-Sidepanel-Action-expand\s*\{\s*display:\s*flex/
    );
  });

  it("keeps Ask AI fullscreen below 1024px after the upstream stylesheet", async () => {
    const plugin = await read("../client/style.css");
    const media = plugin.match(/@media\s*\(width\s*<\s*1024px\)\s*\{((?:[^{}]|\{[^{}]*\})*)\}/);
    const fullscreen = media?.[1] ?? "";
    const upstreamImport = '@import "@docsearch/css/dist/sidepanel.css";';
    expect(plugin).toContain(upstreamImport);
    expect(media?.index).toBeGreaterThan(plugin.indexOf(upstreamImport));

    // Three class selectors tie upstream's variant/side rules; source order
    // then makes this override win for custom and expanded panel widths.
    expect(fullscreen).toMatch(
      /\.DocSearch-Sidepanel-Container:is\(\.floating,\s*\.inline\):is\(\.side-left,\s*\.side-right\)\s*\{[^}]*inset:\s*0;[^}]*width:\s*100%;[^}]*height:\s*100dvh;[^}]*border-radius:\s*0;/
    );
    expect(fullscreen).toMatch(/\.DocSearch-Sidepanel-Action-expand\s*\{\s*display:\s*none;\s*\}/);
    expect(fullscreen).toMatch(
      /html:has\(\.DocSearch-Sidepanel-Container\.is-open\),\s*body:has\(\.DocSearch-Sidepanel-Container\.is-open\)\s*\{\s*overflow:\s*hidden;\s*\}/
    );
  });
});

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
});

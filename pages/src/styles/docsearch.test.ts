import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { test } from "node:test";

const require = createRequire(import.meta.url);

test("shows the Ask AI remove-conversation button that the dialog stylesheet hides", async () => {
  // AskAiButton loads the dialog stylesheet next to sidepanel.css, and the dialog one hides the button...
  const dialog = await readFile(require.resolve("@docsearch/css/dist/style.css"), "utf8");
  assert.match(dialog, /\.DocSearch-Hit-action-button\{[^}]*display:none/);
  // ...so the site has to show it again in the conversation history.
  const site = await readFile(new URL("./global.css", import.meta.url), "utf8");
  assert.match(
    site,
    /\.DocSearch-Sidepanel-RecentConversation \.DocSearch-Hit-action-button \{\s*display: block;\s*\}/
  );
});

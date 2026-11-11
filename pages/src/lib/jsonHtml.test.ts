import assert from "node:assert/strict";
import { test } from "node:test";
import { jsonHtml } from "./jsonHtml.ts";

test("colors keys, values and punctuation, and leaves a string's own punctuation alone", () => {
  const html = jsonHtml('{ "baseURL": "https://acme.io/a,b", "n": 1 }');
  assert.ok(html.includes('<span class="prop">"baseURL"</span><span class="pun">:</span>'));
  assert.ok(html.includes('<span class="str">"https://acme.io/a,b"</span>')); // the URL's colon and comma stay inside the string
  assert.equal(html.match(/class="pun">,/g)?.length, 1);
});

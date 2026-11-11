const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * A JSON snippet as HTML with one span per token: `prop` for keys, `str` for string values, `pun` for punctuation.
 * One pass, strings first, so a colon or comma inside a string (a URL, say) is never taken for punctuation.
 */
export const jsonHtml = (code: string) =>
  esc(code).replace(/("[^"]*")(:)?|[{}:,]/g, (match, text, colon) =>
    text
      ? `<span class="${colon ? "prop" : "str"}">${text}</span>${colon ? '<span class="pun">:</span>' : ""}`
      : `<span class="pun">${match}</span>`
  );

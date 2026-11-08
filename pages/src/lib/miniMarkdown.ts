// A tiny Markdown subset for the homepage playground: frontmatter, `##` headings, paragraphs
// with **bold** and [links](url), and `:::name{title="…"}` … `:::` callouts. It is built to
// parse text that is still being typed, so unclosed constructs degrade to plain text.
export type Inline =
  | { type: "text"; text: string }
  | { type: "strong"; text: string }
  | { type: "link"; text: string; href: string };

export type Block =
  | { type: "heading"; text: string }
  | { type: "paragraph"; inlines: Inline[] }
  | { type: "callout"; name: string; title: string; inlines: Inline[] };

export type Doc = { frontmatter: Record<string, string>; blocks: Block[] };

const INLINE = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;

export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index! > last) out.push({ type: "text", text: text.slice(last, m.index) });
    if (m[1] !== undefined) out.push({ type: "strong", text: m[1] });
    else out.push({ type: "link", text: m[2], href: m[3] });
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push({ type: "text", text: text.slice(last) });
  return out;
}

export function parseMarkdown(src: string): Doc {
  const lines = src.split("\n");
  const frontmatter: Record<string, string> = {};
  const blocks: Block[] = [];
  let i = 0;

  if (lines[0] === "---") {
    for (i = 1; i < lines.length && lines[i] !== "---"; i++) {
      const [key, ...rest] = lines[i].split(":");
      if (rest.length) frontmatter[key.trim()] = rest.join(":").trim();
    }
    i++; // closing fence (or end of input while it is still being typed)
  }

  let paragraph: string[] = [];
  let callout: Extract<Block, { type: "callout" }> | null = null;
  const flush = () => {
    if (!paragraph.length) return;
    const inlines = parseInline(paragraph.join(" "));
    if (callout) callout.inlines.push(...inlines);
    else blocks.push({ type: "paragraph", inlines });
    paragraph = [];
  };

  for (; i < lines.length; i++) {
    const line = lines[i];
    const directive = /^:::(\w*)(.*)$/.exec(line);
    if (directive) {
      flush();
      if (callout && directive[1] === "") callout = null;
      else if (!callout && directive[1]) {
        callout = {
          type: "callout",
          name: directive[1],
          title: /title="([^"]*)/.exec(directive[2])?.[1] ?? "",
          inlines: [],
        };
        blocks.push(callout);
      }
    } else if (line.startsWith("## ")) {
      flush();
      blocks.push({ type: "heading", text: line.slice(3) });
    } else if (line.trim() === "") flush();
    else paragraph.push(line.trim());
  }
  flush();
  return { frontmatter, blocks };
}

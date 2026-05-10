import { serialize, createDefaultRehypePlugins, createDefaultRemarkPlugins } from "@docubook/core";
import type { ParsedDoc } from "./types";

export interface PreRenderResult {
  html: string;
  compiledSource: string;
  frontmatter: Record<string, unknown>;
  raw: string;
  toc?: { id: string; title: string; level: number }[];
}

export interface PreRenderOptions {
  components?: Record<string, any>;
  includeHydrationData?: boolean;
}

export function createPreRenderer() {
  return {

    async preRender(rawMdx: string, options: PreRenderOptions = {}): Promise<PreRenderResult> {
      const { includeHydrationData = true } = options;

      // 1. Extract frontmatter
      let content = rawMdx;
      let frontmatter: Record<string, unknown> = {};

      if (rawMdx.startsWith("---")) {
        const end = rawMdx.indexOf("---", 3);
        if (end > 0) {
          const fmStr = rawMdx.slice(3, end);
          frontmatter = parseFrontmatterSimple(fmStr);
          content = rawMdx.slice(end + 3);
        }
      }

      // 2. Serialize MDX - compiled source for hydration
      const rehypePlugins = createDefaultRehypePlugins();
      const remarkPlugins = createDefaultRemarkPlugins();

      const serialized = await serialize(content, {
        mdxOptions: {
          rehypePlugins,
          remarkPlugins,
        },
        scope: {},
      });

      // 3. Convert MDX to HTML for pre-render
      const html = convertMdxToHtml(content);

      // 4. Extract TOC
      const toc = extractToc(content);

      return {
        html,
        compiledSource: includeHydrationData ? serialized.compiledSource : "",
        frontmatter,
        raw: rawMdx,
        toc,
      };
    },

    /**
     * Parse MDX into document
     */
    async parseMdxFile(rawMdx: string): Promise<ParsedDoc> {
      const result = await this.preRender(rawMdx);

      return {
        compiledSource: result.html,
        frontmatter: result.frontmatter,
        raw: result.raw,
        scope: {},
      };
    },
  };
}

function convertMdxToHtml(mdx: string): string {
  let html = mdx;

  const codeBlocks: string[] = [];
  html = html.replace(/^(```[\s\S]*?```)/gm, (match) => {
    const idx = codeBlocks.length;
    codeBlocks.push(match);
    return `<!--CODEBLOCK_${idx}-->`;
  });

  html = html.replace(/^#### (.+)$/gm, (_, title) => {
    const id = slugify(title);
    return `<h4 id="${id}">${title}</h4>`;
  });
  html = html.replace(/^### (.+)$/gm, (_, title) => {
    const id = slugify(title);
    return `<h3 id="${id}">${title}</h3>`;
  });
  html = html.replace(/^## (.+)$/gm, (_, title) => {
    const id = slugify(title);
    return `<h2 id="${id}">${title}</h2>`;
  });
  html = html.replace(/^# (.+)$/gm, (_, title) => {
    const id = slugify(title);
    return `<h1 id="${id}">${title}</h1>`;
  });

  html = html.replace(/\*\*\*([^*]+)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>");
  html = html.replace(/^\d+\. (.+)$/gm, "<li>$1</li>");
  html = html.replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>");
  html = html.replace(/^---$/gm, "<hr />");

  codeBlocks.forEach((block, idx) => {
    html = html.replace(`<!--CODEBLOCK_${idx}-->`, block);
  });

  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre data-language="${lang || 'text'}"><code>${code.trim()}</code></pre>`;
  });

  const lines = html.split("\n");
  const processedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("<")) return line;
    return `<p>${trimmed}</p>`;
  });
  html = processedLines.join("\n");

  html = html.replace(/\n{3,}/g, "\n\n");

  return `<article class="prose max-w-none">\n${html}\n</article>`;
}

function extractToc(mdx: string): { id: string; title: string; level: number }[] {
  const toc: { id: string; title: string; level: number }[] = [];

  const lines = mdx.split("\n");
  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const title = match[2];
      const id = slugify(title);
      toc.push({ id, title, level });
    }
  }

  return toc;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseFrontmatterSimple(fmStr: string): Record<string, unknown> {
  const frontmatter: Record<string, unknown> = {};
  const lines = fmStr.trim().split("\n");

  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      const [, key, value] = match;
      frontmatter[key] = value.trim();
    }
  }

  return frontmatter;
}

export const preRenderer = createPreRenderer();
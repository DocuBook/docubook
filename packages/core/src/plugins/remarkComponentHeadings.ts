import type { Node } from "unist";
import { visit } from "unist-util-visit";

/**
 * Remark plugin: no headings inside component children.
 *
 * Contract (docubook):
 * - The page outline belongs to the page: h1 is the frontmatter title, h2–h6
 *   are the authored sections. A component (directive or GitHub alert) never
 *   renders an `<h1>`–`<h6>` among its children, so nothing in a callout,
 *   card, tab, accordion or step gets a heading id, an anchor link, a TOC
 *   entry or a place in the document outline — a heading in a hidden tab or
 *   a collapsed accordion would otherwise be a TOC link to nothing.
 * - `#`…`######` written inside a component becomes a plain paragraph that
 *   keeps its inline content (bold, code, links), so the text still shows.
 * - Runs after `remarkGithubAlert` and `remarkDirectiveToMdx`, on the
 *   component elements they produce.
 */
export function remarkComponentHeadings() {
  return (tree: Node) => {
    visit(tree, "mdxJsxFlowElement", (component: Node) => {
      visit(component, "heading", (heading: Node & { depth?: number }) => {
        heading.type = "paragraph";
        delete heading.depth;
      });
    });
    return tree;
  };
}

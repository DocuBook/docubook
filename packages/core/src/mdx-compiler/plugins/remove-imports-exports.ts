// MPL-2.0 — derived from next-mdx-remote (IBM). See LICENSE-MPL-2.0.
import { remove } from "unist-util-remove";
import type { Node } from "unist";

/** remark plugin: strips all `mdxjsEsm` nodes (import/export statements). */
export function removeImportsExportsPlugin() {
  return (tree: Node) => remove(tree, "mdxjsEsm");
}

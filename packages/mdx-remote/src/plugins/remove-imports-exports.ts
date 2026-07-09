import { remove } from "unist-util-remove";
import type { Node } from "unist";

/** remark plugin: strips all `mdxjsEsm` nodes (import/export statements). */
export function removeImportsExportsPlugin() {
  return (tree: Node) => remove(tree, "mdxjsEsm");
}

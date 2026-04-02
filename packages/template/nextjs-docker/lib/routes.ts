import docsTree from "@/lib/docs-tree.json"; // Import prebuilt navigation tree

export type ContextInfo = {
  icon: string;
  description: string;
  title?: string;
};

export type EachRoute = {
  title: string;
  href: string;
  noLink?: boolean;
  context?: ContextInfo;
  items?: EachRoute[];
};

export const ROUTES: EachRoute[] = docsTree;

type Page = { title: string; href: string };

function getRecursiveAllLinks(node: EachRoute): Page[] {
  const ans: Page[] = [];
  if (!node.noLink) {
    ans.push({ title: node.title, href: node.href });
  }
  node.items?.forEach((subNode) => {
    const temp = { ...subNode, href: `${node.href}${subNode.href}` };
    ans.push(...getRecursiveAllLinks(temp));
  });
  return ans;
}

export const page_routes: Page[] = ROUTES.map((route) =>
  getRecursiveAllLinks(route)
).flat();

import docuConfig from "@/docu.json"; // Import JSON file

export type EachRoute = {
  title: string;
  href: string;
  noLink?: boolean; // Sekarang mendukung boolean
  items?: EachRoute[];
};

export const ROUTES: EachRoute[] = docuConfig.routes;

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

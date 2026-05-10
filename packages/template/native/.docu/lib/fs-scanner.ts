/**
 * File System-Based Route Scanner
 * 
 * Auto-scan docs folder at build-time, merge with manual docu.json routes.
 * User can override with manual routes in docu.json.
 * 
 * Docs folder structure:
 *   docs/
 *   ├── getting-started/
 *   │   ├── introduction.mdx  → /getting-started/introduction
 *   │   └── installation.mdx  → /getting-started/installation
 *   └── api/
 *       └── reference.mdx     → /api/reference
 */

import type { DocuRoute } from "./types";
import { readdirSync, statSync } from "node:fs";
import { join, relative, extname, sep } from "node:path";

interface FileNode {
  name: string;
  relPath: string;
  absPath: string;
  isDirectory: boolean;
  children?: FileNode[];
}

function toTitleCase(str: string): string {
  return str
    .replace(/-/g, " ")
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function isDocFile(filename: string): boolean {
  const ext = extname(filename).toLowerCase();
  return [".mdx", ".md"].includes(ext);
}

function normalizePath(path: string): string {
  return path.split(sep).join("/");
}

/**
 * Recursively scan a directory and return file tree
 * 
 * @param dirPath - Absolute path to scan
 * @param docsRoot - Root docs folder for relative path calculation
 */
function scanDir(dirPath: string, docsRoot: string): FileNode[] {
  const nodes: FileNode[] = [];
  
  try {
    const entries = readdirSync(dirPath);
    
    for (const entry of entries) {
      if (entry.startsWith(".")) continue;
      
      const absPath = join(dirPath, entry);
      
      try {
        const stat = statSync(absPath);
        
        if (stat.isDirectory()) {
          const children = scanDir(absPath, docsRoot);
          if (children.length > 0) {
            nodes.push({
              name: entry,
              relPath: normalizePath(relative(docsRoot, absPath)),
              absPath,
              isDirectory: true,
              children
            });
          }
        } else if (stat.isFile() && isDocFile(entry)) {
          nodes.push({
            name: entry,
            relPath: normalizePath(
              relative(docsRoot, absPath).replace(/\.(mdx|md)$/, "")
            ),
            absPath,
            isDirectory: false
          });
        }
      } catch {
        continue;
      }
    }
  } catch {
    return nodes;
  }
  
  return nodes;
}

function fileNodesToRoutes(nodes: FileNode[], parentHref = ""): DocuRoute[] {
  const routes: DocuRoute[] = [];
  
  for (const node of nodes) {
    if (!node.isDirectory) {
      const baseName = node.name.replace(/\.(mdx|md)$/, "");
      const isIndexFile = /^(index|readme)$/i.test(baseName);
      if (isIndexFile && parentHref === "") continue;
      
      const href = parentHref 
        ? `${parentHref}/${node.relPath.split("/").pop()}`
        : `/${node.relPath}`;
      
      routes.push({
        title: toTitleCase(baseName),
        href
      });
    } else {
      const dirTitle = toTitleCase(node.name);
      const dirHref = parentHref 
        ? `${parentHref}/${node.relPath.split("/").pop()}` 
        : `/${node.relPath}`;
      
      const children = fileNodesToRoutes(node.children || [], dirHref);
      
      if (children.length === 0) continue;
      
      const indexChild = children.find(c => 
        /\/index$/i.test(c.href) || /\/readme$/i.test(c.href)
      );
      
      if (indexChild) {
        const baseHref = indexChild.href.replace(/\/(index|readme)$/i, "");
        routes.push({
          title: dirTitle,
          href: baseHref,
          items: children.filter(c => c !== indexChild)
        });
      } else {
        routes.push({
          title: dirTitle,
          href: dirHref,
          noLink: true,
          items: children
        });
      }
    }
  }
  
  return routes;
}

/**
 * Scan docs folder and convert to DocuRoute[]
 * 
 * @param docsPath - Path to docs folder (default: "./docs")
 */
export function scanDocsFolder(docsPath = "./docs"): DocuRoute[] {
  const absDocsPath = join(process.cwd(), docsPath);
  const nodes = scanDir(absDocsPath, absDocsPath);
  return fileNodesToRoutes(nodes);
}

/**
 * Resolve routes:
 * 1. If docu.json has routes, use them (manual priority)
 * 2. Else, scan docs folder (auto-detect)
 * 
 * @param docuJsonRoutes - Routes from docu.json (optional)
 */
export function resolveRoutes(
  docuJsonRoutes?: DocuRoute[]
): DocuRoute[] {
  if (docuJsonRoutes && docuJsonRoutes.length > 0) {
    return docuJsonRoutes;
  }
  return scanDocsFolder();
}
import type { ComponentType } from "react";
import { createMdxComponents } from "@docubook/mdx-content";
import { Pagination } from "./Pagination";
import {
  PaginationItem,
  PaginationButtons,
  PaginationRange,
  PaginationInfo,
  PaginationFull,
  PaginationDocs,
} from "./base/pagination";

// Basic HTML element components untuk pre-render
const BasicElements = {
  // Block elements
  h1: "h1",
  h2: "h2",
  h3: "h3",
  p: "p",
  ul: "ul",
  ol: "ol",
  li: "li",
  blockquote: "blockquote",
  pre: "pre",
  code: "code",
  hr: "hr",
  div: "div",
  span: "span",

  // Inline elements
  a: "a",
  strong: "strong",
  em: "em",
  img: "img",

  // Table elements
  table: "table",
  thead: "thead",
  tbody: "tbody",
  tfoot: "tfoot",
  tr: "tr",
  th: "th",
  td: "td",
};

export function createComponentsRegistry(): Record<string, ComponentType<any>> {
  return {
    ...BasicElements,
    Pagination,
    PaginationItem,
    PaginationButtons,
    PaginationRange,
    PaginationInfo,
    PaginationFull,
    PaginationDocs,
  };
}

export async function createFullComponentsRegistry(): Promise<Record<string, ComponentType<any>>> {
  const baseComponents = createComponentsRegistry();

  let mdxComponents = {};
  try {
    mdxComponents = createMdxComponents();
  } catch (error) {
    console.warn("MDX components not available:", error);
  }

  return {
    ...baseComponents,
    ...mdxComponents,
  };
}

export type ComponentsRegistry = ReturnType<typeof createComponentsRegistry>;
export const componentsRegistry = createComponentsRegistry();
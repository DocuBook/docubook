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
import { Toggle, ToggleGroup } from "./base/toggle";
import {
  ThemeController,
  ThemeControllerToggle,
  ThemeControllerSelect,
  ThemeControllerRadio,
} from "./base/theme-controller";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbList,
} from "./base/breadcrumbs";
import {
  Accordion,
  type CollapseProps,
  type AccordionItem,
  type AccordionProps,
} from "./base/collapse";
import {
  useDrawerState,
  DrawerTrigger,
  DrawerContent,
  DrawerSidePanel,
  type DrawerProps,
  type DrawerSide,
} from "./base/drawer";
import {
  Navbar,
  NavbarContainer,
  Logo,
  NavMenu,
  NavMenuLink,
  NavToggle,
  NavbarVersion,
  type NavMenuItem,
} from "./base/navbar";
import { ThemeToggle } from "./Theme";


// Basic HTML element components for pre-render
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
    Toggle,
    ToggleGroup,
    ThemeController,
    ThemeControllerToggle,
    ThemeControllerSelect,
    ThemeControllerRadio,
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
    BreadcrumbList,
    Accordion,
    useDrawerState,
    DrawerTrigger,
    DrawerContent,
    DrawerSidePanel,
    Navbar,
    NavbarContainer,
    Logo,
    NavMenu,
    NavMenuLink,
    NavToggle,
    NavbarVersion,
    ThemeToggle,
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
import type { ComponentType } from "react";
import { createMdxComponents } from "@docubook/mdx-content";
import {
  Dropdown,
  DropdownItem,
  DropdownLink,
  DropdownLabel,
  DropdownDivider,
} from "./base/dropdown";
import {
  Pagination,
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
import Collapse, { Accordion } from "./base/collapse";
import {
  Drawer,
  useDrawerState,
  DrawerTrigger,
  DrawerContent,
  DrawerSidePanel,
} from "./base/drawer";
import {
  Navbar as BaseNavbar,
  NavbarContainer,
  Logo as BaseLogo,
  NavMenu as BaseNavMenu,
  NavMenuLink,
  NavToggle,
  NavbarVersion,
} from "./base/navbar";
import PaginationComp from "./Pagination";
import Anchor from "./Anchor";
import { Footer } from "./Footer";
import { ThemeToggle } from "./Theme";
import { Context } from "./Context";
import Toc from "./Toc";
import { Typography } from "./Typography";
import {
  Navbar,
  NavbarLayout,
  Logo,
  NavMenu,
  NavItem,
  MobileMenuToggle,
  NavbarBrand,
  GitHubLink,
} from "./Navbar";

export { Dropdown, DropdownItem, DropdownLink, DropdownLabel, DropdownDivider };
export {
  Pagination,
  PaginationItem,
  PaginationButtons,
  PaginationRange,
  PaginationInfo,
  PaginationFull,
  PaginationDocs,
};
export { Toggle, ToggleGroup };
export { ThemeController, ThemeControllerToggle, ThemeControllerSelect, ThemeControllerRadio };
export {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbList,
};
export { Collapse, Accordion };
export { Drawer, useDrawerState, DrawerTrigger, DrawerContent, DrawerSidePanel };
export {
  BaseNavbar,
  NavbarContainer,
  BaseLogo,
  BaseNavMenu,
  NavMenuLink,
  NavToggle,
  NavbarVersion,
};
export { Footer };
export { ThemeToggle };
export { Context };
export { default as Toc } from "./Toc";
export { Typography };
export { Anchor };
export { Navbar, NavbarLayout, Logo, NavMenu, NavItem, MobileMenuToggle, NavbarBrand, GitHubLink };

export type ComponentRegistry = Record<string, ComponentType<Record<string, unknown>>>;

const BASE_COMPONENTS = {
  // Dropdown
  Dropdown,
  DropdownItem,
  DropdownLink,
  DropdownLabel,
  DropdownDivider,

  // Pagination
  Pagination,
  PaginationItem,
  PaginationButtons,
  PaginationRange,
  PaginationInfo,
  PaginationFull,
  PaginationDocs,

  // Toggle
  Toggle,
  ToggleGroup,

  // Theme
  ThemeController,
  ThemeControllerToggle,
  ThemeControllerSelect,
  ThemeControllerRadio,

  // Breadcrumb
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbList,

  // Accordion
  Collapse,
  Accordion,

  // Drawer
  Drawer,
  useDrawerState,
  DrawerTrigger,
  DrawerContent,
  DrawerSidePanel,

  // Base Navbar
  BaseNavbar,
  NavbarContainer,
  BaseLogo,
  BaseNavMenu,
  NavMenuLink,
  NavToggle,
  NavbarVersion,
} as const;

const APP_COMPONENTS = {
  AppPagination: PaginationComp,
  Footer,
  ThemeToggle,
  Context,
  Toc,
  AppTypography: Typography,
  Anchor,
  DocsNavbar: Navbar,
  NavbarLayout,
  DocsLogo: Logo,
  DocsNavMenu: NavMenu,
  NavItem,
  MobileMenuToggle,
  NavbarBrand,
  GitHubLink,
} as const;

export function createComponentsRegistry(): Record<string, unknown> {
  return {
    ...BASE_COMPONENTS,
    ...APP_COMPONENTS,
  };
}

export async function createFullComponentsRegistry(): Promise<Record<string, unknown>> {
  const baseComponents = createComponentsRegistry();

  let mdxComponents: ComponentRegistry = {};
  try {
    const mdx = createMdxComponents() as unknown as ComponentRegistry;
    mdxComponents = mdx;
  } catch {
    // MDX components not available
  }

  return { ...baseComponents, ...mdxComponents };
}

export const componentsRegistry = createComponentsRegistry();

import type { ComponentType } from "react";
import { createMdxComponents } from "@docubook/mdx-content";
import { Dropdown, DropdownItem, DropdownLink } from "@docubook/ui-react/dropdown";
import { PaginationDocs } from "@docubook/ui-react/pagination";
import { Toggle, ToggleGroup } from "@docubook/ui-react/toggle";
import { ThemeControllerToggle } from "@docubook/ui-react/theme-controller";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbPage,
  BreadcrumbList,
} from "@docubook/ui-react/breadcrumbs";
import { Collapse, Accordion } from "@docubook/ui-react/collapse";
import {
  Drawer,
  useDrawerState,
  DrawerTrigger,
  DrawerContent,
  DrawerSidePanel,
} from "@docubook/ui-react/drawer";
import { Input, InputGroup } from "@docubook/ui-react/input";
import { Kbd, FnKey } from "@docubook/ui-react/kbd";
import { Modal, useModal } from "@docubook/ui-react/modal";
import {
  Navbar as BaseNavbar,
  Logo as BaseLogo,
  NavMenu as BaseNavMenu,
  NavMenuLink,
} from "@docubook/ui-react/navbar";
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
import Search from "./Search";
import Sidebar from "./Sidebar";

export { Dropdown, DropdownItem, DropdownLink };
export { PaginationDocs };
export { Toggle, ToggleGroup };
export { ThemeControllerToggle };
export { Breadcrumb, BreadcrumbItem, BreadcrumbPage, BreadcrumbList };
export { Collapse, Accordion };
export { Drawer, useDrawerState, DrawerTrigger, DrawerContent, DrawerSidePanel };
export { Input, InputGroup };
export { Kbd, FnKey };
export { Modal, useModal };
export { BaseNavbar, BaseLogo, BaseNavMenu, NavMenuLink };
export { Footer };
export { ThemeToggle };
export { Context };
export { default as Toc } from "./Toc";
export { Typography };
export { Anchor };
export { Navbar, NavbarLayout, Logo, NavMenu, NavItem, MobileMenuToggle, NavbarBrand, GitHubLink };
export { Search };
export { Sidebar };

export type ComponentRegistry = Record<string, ComponentType<Record<string, unknown>>>;

const BASE_COMPONENTS = {
  // Dropdown
  Dropdown,
  DropdownItem,
  DropdownLink,

  // Pagination
  PaginationDocs,

  // Toggle
  Toggle,
  ToggleGroup,

  // Theme
  ThemeControllerToggle,

  // Breadcrumb
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbPage,
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

  // Input
  Input,
  InputGroup,

  // Kbd
  Kbd,
  FnKey,

  // Modal
  Modal,
  useModal,

  // Base Navbar
  BaseNavbar,
  BaseLogo,
  BaseNavMenu,
  NavMenuLink,
} as const;

const APP_COMPONENTS = {
  AppPagination: PaginationComp,
  Footer,
  ThemeToggle,
  Context,
  Toc,
  AppTypography: Typography,
  Anchor,
  Search,
  Sidebar,
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

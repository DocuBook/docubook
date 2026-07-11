import type { ComponentType } from "react";
import React from "react";
import {
  AccordionMdx,
  AccordionsMdx,
  ButtonMdx,
  CardsMdx,
  CardMdx,
  CodeBlock,
  FileMdx,
  FilesMdx,
  FolderMdx,
  ImageMdx,
  KbdMdx,
  LinkMdx,
  NoteMdx,
  ReleaseMdx,
  ChangesMdx,
  StepMdx,
  StepsMdx,
  TableMdx,
  TableHeaderMdx,
  TableBodyMdx,
  TableFooterMdx,
  TableRowMdx,
  TableHeadMdx,
  TableCellMdx,
  TabMdx,
  TabsMdx,
  TooltipMdx,
  YoutubeMdx,
  MermaidMdx,
} from "../components";

// Mermaid (~400KB) is lazy-loaded on client — only fetched on pages with ```mermaid blocks.
// SSR uses the eager import (React.lazy doesn't work with renderToString).
const MermaidLazy =
  typeof window !== "undefined"
    ? React.lazy(() => import("../components/MermaidMdx").then((m) => ({ default: m.MermaidMdx })))
    : MermaidMdx;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MdxComponentMap = Record<string, ComponentType<any>>;

export function createMdxComponents(customComponents: MdxComponentMap = {}): MdxComponentMap {
  return {
    Tabs: TabsMdx,
    Tab: TabMdx,
    table: TableMdx,
    thead: TableHeaderMdx,
    tbody: TableBodyMdx,
    tfoot: TableFooterMdx,
    tr: TableRowMdx,
    th: TableHeadMdx,
    td: TableCellMdx,
    pre: CodeBlock,
    a: LinkMdx,
    Link: LinkMdx,
    Card: CardMdx,
    Button: ButtonMdx,
    Note: NoteMdx,
    Steps: StepsMdx,
    Step: StepMdx,
    Accordion: AccordionMdx,
    Accordions: AccordionsMdx,
    Cards: CardsMdx,
    Kbd: KbdMdx,
    Release: ReleaseMdx,
    Changes: ChangesMdx,
    File: FileMdx,
    Files: FilesMdx,
    Folder: FolderMdx,
    Image: ImageMdx,
    img: ImageMdx,
    Youtube: YoutubeMdx,
    Tooltip: TooltipMdx,
    Mermaid: MermaidLazy,
    ...customComponents,
  };
}

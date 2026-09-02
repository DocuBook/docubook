import { createElement, type ComponentType } from "react";
import { Callout, type CalloutType } from "../components/Callout";
import {
  AccordionMdx,
  AccordionsMdx,
  CardsMdx,
  CardMdx,
  CodeBlock,
  TreeMdx,
  ImageMdx,
  LinkMdx,
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

// oxlint-disable-next-line typescript/no-explicit-any
export type MdxComponentMap = Record<string, ComponentType<any>>;

function callout(type: CalloutType): ComponentType<Record<string, unknown>> {
  return (props) => createElement(Callout, { type, ...props });
}

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
    Tip: callout("tip"),
    Info: callout("info"),
    Danger: callout("danger"),
    Warning: callout("warning"),
    Success: callout("success"),
    Steps: StepsMdx,
    Step: StepMdx,
    Accordion: AccordionMdx,
    Accordions: AccordionsMdx,
    Cards: CardsMdx,
    Tree: TreeMdx,
    Image: ImageMdx,
    img: ImageMdx,
    Youtube: YoutubeMdx,
    Tooltip: TooltipMdx,
    Mermaid: MermaidMdx,
    ...customComponents,
  };
}

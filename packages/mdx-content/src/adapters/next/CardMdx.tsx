"use client";

import { CardMdx as CoreCardMdx } from "../../components/CardMdx.js";
import type { CardMdxProps as CoreCardMdxProps } from "../../components/CardMdx.js";
import { LinkMdx } from "./LinkMdx.js";

export type CardMdxProps = Omit<CoreCardMdxProps, "__LinkComponent">;

export function CardMdx(props: CardMdxProps) {
    return <CoreCardMdx {...props} __LinkComponent={LinkMdx} />;
}

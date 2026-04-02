"use client";

import { CardMdx as CoreCardMdx } from "../../components/CardMdx";
import type { CardMdxProps as CoreCardMdxProps } from "../../components/CardMdx";
import { LinkMdx } from "./LinkMdx";

export type CardMdxProps = Omit<CoreCardMdxProps, "__LinkComponent">;

export function CardMdx(props: CardMdxProps) {
    return <CoreCardMdx {...props} __LinkComponent={LinkMdx} />;
}

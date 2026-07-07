"use client";

import { ButtonMdx as CoreButtonMdx } from "../../components/ButtonMdx";
import type { ButtonMdxProps as CoreButtonMdxProps } from "../../components/ButtonMdx";
import { LinkMdx } from "./LinkMdx";

export type ButtonMdxProps = Omit<CoreButtonMdxProps, "__LinkComponent">;

export function ButtonMdx(props: ButtonMdxProps) {
    return <CoreButtonMdx {...props} __LinkComponent={LinkMdx} />;
}

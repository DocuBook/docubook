"use client";

import { ButtonMdx as CoreButtonMdx } from "../../components/ButtonMdx.js";
import type { ButtonMdxProps as CoreButtonMdxProps } from "../../components/ButtonMdx.js";
import { LinkMdx } from "./LinkMdx.js";

export type ButtonMdxProps = Omit<CoreButtonMdxProps, "__LinkComponent">;

export function ButtonMdx(props: ButtonMdxProps) {
    return <CoreButtonMdx {...props} __LinkComponent={LinkMdx} />;
}

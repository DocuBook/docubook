import type { ComponentProps } from "react";

export type LinkMdxProps = ComponentProps<"a">;

export function LinkMdx({ href, rel, target, ...props }: LinkMdxProps) {
    if (!href) return null;

    const external = /^https?:\/\//.test(href);
    const computedTarget = target ?? (external ? "_blank" : undefined);
    const computedRel = rel ?? (external ? "noopener noreferrer" : undefined);

    return <a href={href} target={computedTarget} rel={computedRel} {...props} />;
}

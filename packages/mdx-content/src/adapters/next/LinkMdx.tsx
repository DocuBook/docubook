import NextLink from "next/link";
import type { LinkMdxProps } from "../../components/LinkMdx";

export function LinkMdx({ href, rel, target, ...props }: LinkMdxProps) {
    if (!href) return null;

    const external = /^https?:\/\//.test(href);
    const computedTarget = target ?? (external ? "_blank" : undefined);
    const computedRel = rel ?? (external ? "noopener noreferrer" : undefined);

    return <NextLink href={href} target={computedTarget} rel={computedRel} {...props} />;
}

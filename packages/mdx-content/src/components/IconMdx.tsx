import * as LucideIcons from "lucide-react";
import type { LucideProps } from "lucide-react";
import type { ReactNode, ComponentType } from "react";

export type IconName = keyof typeof LucideIcons;
export type IconProp = IconName | string;

const DEFAULT_ICON_SIZE = 20;

export function resolveLucideIcon(icon?: IconProp): ReactNode {
    if (!icon) {
        return undefined;
    }

    const IconComponent = LucideIcons[icon as IconName] as ComponentType<LucideProps> | undefined;

    if (!IconComponent) {
        // Unknown icon key: avoid rendering invalid React elements.
        return undefined;
    }

    return <IconComponent size={DEFAULT_ICON_SIZE} />;
}

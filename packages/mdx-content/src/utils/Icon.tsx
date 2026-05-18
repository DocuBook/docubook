import * as LucideIcons from "lucide-react";
import type { LucideProps } from "lucide-react";
import type { ReactNode, ComponentType } from "react";

export type IconName = keyof typeof LucideIcons;
export type IconProp = IconName | string;

const DEFAULT_ICON_SIZE = 20;

export function resolveLucideIcon(icon?: IconProp): ReactNode {
  const normalized = typeof icon === "string" ? icon.trim() : icon;
  if (!normalized || !Object.hasOwn(LucideIcons, normalized)) {
    return undefined;
  }

  const IconComponent = LucideIcons[normalized as IconName] as ComponentType<LucideProps>;

  return <IconComponent size={DEFAULT_ICON_SIZE} />;
}

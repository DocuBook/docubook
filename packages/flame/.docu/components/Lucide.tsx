import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Get Lucide icon component by name
 * Icon names must match Lucide's export names exactly (e.g., "Zap", "BookOpen", "Search")
 */
export function getLucideIcon(name: string): LucideIcon | null {
  if (!name) return null;
  const icon = (LucideIcons as Record<string, LucideIcon | undefined>)[name];
  return icon || null;
}

/**
 * Render Lucide icon component
 */
export function renderLucideIcon(name: string, className?: string) {
  const Icon = getLucideIcon(name);
  return Icon ? <Icon className={className} /> : null;
}

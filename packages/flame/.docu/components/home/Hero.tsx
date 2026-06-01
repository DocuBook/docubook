"use client";

import type { Hero as HeroType, HeroAction } from "../../node/types";
import { cn } from "../../node/utils";
import { renderLucideIcon } from "../Lucide";
import { getSocialIcon } from "../Social";

interface HeroProps {
  hero: HeroType;
  className?: string;
}

interface ActionButtonProps {
  action: HeroAction;
}

function isExternalLink(link: string): boolean {
  return /^https?:\/\//.test(link);
}

function renderActionButtonIcon(iconName: string | undefined, className?: string) {
  if (!iconName) return null;

  // Try Lucide icon first
  const lucideIcon = renderLucideIcon(iconName, className);
  if (lucideIcon) return lucideIcon;

  // Fallback to social icon
  const SocialIcon = getSocialIcon(iconName);
  if (SocialIcon) return <SocialIcon className={className} />;

  return null;
}

function ActionButton({ action }: ActionButtonProps) {
  const themeClasses = {
    primary: "bg-primary text-primary-content hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-content hover:bg-secondary/90",
    ghost: "bg-transparent text-muted-foreground border border-base-300 hover:bg-base-200",
  };

  const isExternal = isExternalLink(action.link);

  return (
    <a
      href={action.link}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium transition-colors",
        themeClasses[action.theme || "primary"]
      )}
    >
      {renderActionButtonIcon(action.icon, "h-4 w-4")}
      {action.text}
    </a>
  );
}

export function Hero({ hero, className }: HeroProps) {
  const { tagline, headline, description, actions } = hero;

  return (
    <div className={cn("mx-auto max-w-4xl px-6 py-32 sm:py-44", className)}>
      <div className="text-center">
        {tagline && <p className="text-primary mb-4 text-lg font-semibold">{tagline}</p>}
        <h1 className="text-balance text-5xl font-semibold tracking-tight sm:text-7xl">
          {headline}
        </h1>
        {description && (
          <p className="text-muted-foreground mt-8 text-pretty text-lg sm:text-xl">{description}</p>
        )}
        {actions && actions.length > 0 && (
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {actions.map((action, index) => (
              <ActionButton key={index} action={action} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

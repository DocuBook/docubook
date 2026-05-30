"use client";

import * as icons from "lucide-react";
import type { Hero as HeroType, HeroAction } from "../../node/types";
import { cn } from "../../node/utils";
import { getSocialIcon } from "../Social";

interface HeroProps {
  hero: HeroType;
  className?: string;
}

function getIconComponent(iconName: string) {
  // First try lucide icons
  const lucideIcon = (icons as unknown as Record<string, icons.LucideIcon>)[iconName];
  if (lucideIcon) return lucideIcon;

  // Then try social icons
  const socialIcon = getSocialIcon(iconName);
  if (socialIcon) return socialIcon;

  return null;
}

function ActionButton({ action }: { action: HeroAction }) {
  const Icon = action.icon ? getIconComponent(action.icon) : null;

  const themeClasses = {
    primary: "bg-primary text-primary-content hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-content hover:bg-secondary/90",
    ghost: "bg-transparent border border-base-300 hover:bg-base-200",
  };

  return (
    <a
      href={action.link}
      target={action.target}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium transition-colors",
        themeClasses[action.theme || "primary"]
      )}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {action.text}
    </a>
  );
}

export function Hero({ hero, className }: HeroProps) {
  const { tagline, headline, description, image, actions } = hero;

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
        {image && (
          <div className="mt-12">
            <img
              src={image.src}
              alt={image.alt || ""}
              className="mx-auto max-h-64 rounded-lg object-contain"
            />
          </div>
        )}
      </div>
    </div>
  );
}

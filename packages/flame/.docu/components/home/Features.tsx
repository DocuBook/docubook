"use client";

import type { HomeFeature } from "../../node/types";
import { cn } from "../../node/utils";
import { renderLucideIcon } from "../Lucide";

interface FeaturesProps {
  features: HomeFeature[];
  className?: string;
}

interface FeatureCardProps {
  feature: HomeFeature;
  index: number;
}

function FeatureCard({ feature, index }: FeatureCardProps) {
  const Wrapper = feature.link ? "a" : "div";
  const wrapperProps = feature.link ? { href: feature.link } : {};

  // Use index-based patternId to avoid collisions
  const patternId = `grid-${index}`;

  return (
    <Wrapper
      {...wrapperProps}
      className={cn(
        "border-base-200 bg-base-100 hover:border-primary/40 group relative overflow-hidden rounded-2xl border p-6 transition-all hover:shadow-lg",
        feature.link && "cursor-pointer"
      )}
    >
      {/* Grid pattern background */}
      <svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        style={{ color: "var(--color-primary)" }}
        aria-hidden="true"
      >
        <defs>
          <pattern id={patternId} width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              opacity="0.15"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>

      {/* Content */}
      <div className="relative z-10">
        {feature.icon && (
          <div className="bg-primary/10 mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg">
            {renderLucideIcon(feature.icon, "h-6 w-6 text-primary")}
          </div>
        )}
        <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
        <p className="text-muted-foreground text-sm">{feature.description}</p>
      </div>
    </Wrapper>
  );
}

export function Features({ features, className }: FeaturesProps) {
  if (!features || features.length === 0) return null;

  return (
    <div className={cn("mx-auto max-w-5xl px-6 pb-24", className)}>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <FeatureCard key={index} feature={feature} index={index} />
        ))}
      </div>
    </div>
  );
}

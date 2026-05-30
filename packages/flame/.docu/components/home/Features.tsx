"use client";

import * as icons from "lucide-react";
import type { HomeFeature } from "../../node/types";
import { cn } from "../../node/utils";

interface FeaturesProps {
  features: HomeFeature[];
  className?: string;
}

interface FeatureCardProps {
  feature: HomeFeature;
}

function FeatureCard({ feature }: FeatureCardProps) {
  const Icon = feature.icon
    ? (icons as unknown as Record<string, icons.LucideIcon>)[feature.icon]
    : null;

  const Wrapper = feature.link ? "a" : "div";
  const wrapperProps = feature.link ? { href: feature.link } : {};

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
        className="text-base-300/50 absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id={`grid-${feature.title}`}
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grid-${feature.title})`} />
      </svg>

      {/* Content */}
      <div className="relative z-10">
        {Icon && (
          <div className="bg-primary/10 mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg">
            <Icon className="text-primary h-6 w-6" />
          </div>
        )}
        <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
        <p className="text-base-content/70 text-sm">{feature.description}</p>
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
          <FeatureCard key={index} feature={feature} />
        ))}
      </div>
    </div>
  );
}

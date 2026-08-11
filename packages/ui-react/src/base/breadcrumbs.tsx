import type { ReactNode } from "react";
import { cn } from "../utils/cn";

export interface BreadcrumbProps {
  children: ReactNode;
  className?: string;
}
export interface BreadcrumbItemProps {
  children: ReactNode;
  className?: string;
}

export function Breadcrumb({ children, className }: BreadcrumbProps) {
  return (
    <div className={cn("breadcrumbs text-sm", className)}>
      <ul>{children}</ul>
    </div>
  );
}

export function BreadcrumbItem({ children, className }: BreadcrumbItemProps) {
  return <li className={cn(className)}>{children}</li>;
}

export function BreadcrumbPage({ children, className }: BreadcrumbItemProps) {
  return <span className={cn(className)}>{children}</span>;
}

export function BreadcrumbList({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

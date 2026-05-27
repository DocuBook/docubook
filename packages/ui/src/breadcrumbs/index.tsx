import type { ReactNode } from "react";
import { cn } from "../cn";

export interface BreadcrumbProps {
  children: ReactNode;
  className?: string;
}

export interface BreadcrumbItemProps {
  children: ReactNode;
  className?: string;
}

export interface BreadcrumbLinkProps {
  href?: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
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

export function BreadcrumbLink({ href, children, className, onClick }: BreadcrumbLinkProps) {
  if (href) {
    return (
      <a href={href} className={cn("link link-hover", className)}>
        {children}
      </a>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn("link link-hover", className)}>
        {children}
      </button>
    );
  }

  return <span className={cn(className)}>{children}</span>;
}

export function BreadcrumbPage({ children, className }: BreadcrumbItemProps) {
  return <span className={cn(className)}>{children}</span>;
}

import { ReactNode } from "react";

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

export function Breadcrumb({ children, className = "" }: BreadcrumbProps) {
    return (
        <div className={`breadcrumbs text-sm ${className}`}>
            <ul>{children}</ul>
        </div>
    );
}

export function BreadcrumbItem({ children, className = "" }: BreadcrumbItemProps) {
    return <li className={className}>{children}</li>;
}

export function BreadcrumbLink({
    href,
    children,
    className = "",
    onClick
}: BreadcrumbLinkProps) {
    const baseClass = "link link-hover";

    if (href) {
        return (
            <a href={href} className={`${baseClass} ${className}`}>
                {children}
            </a>
        );
    }

    if (onClick) {
        return (
            <button
                type="button"
                onClick={onClick}
                className={`${baseClass} ${className}`}
            >
                {children}
            </button>
        );
    }

    return <span className={className}>{children}</span>;
}

export function BreadcrumbPage({ children, className = "" }: BreadcrumbItemProps) {
    return <span className={className}>{children}</span>;
}

export function BreadcrumbSeparator({ className = "" }: { className?: string }) {
    return <li className={className}>/</li>;
}

export function BreadcrumbList({ children }: BreadcrumbItemProps) {
    return <>{children}</>;
}
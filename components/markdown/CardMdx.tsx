import React, { ReactNode } from "react";
import * as Icons from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

type IconName = keyof typeof Icons;

interface CardProps {
  title: string;
  icon?: IconName;
  href?: string;
  horizontal?: boolean;
  children: ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ title, icon, href, horizontal, children, className }) => {
  const Icon = icon ? (Icons[icon] as React.FC<{ className?: string }>) : null;

  const content = (
    <div
      className={clsx(
        "border rounded-lg shadow-sm p-4 transition-all duration-200",
        "bg-card text-card-foreground border-border",
        "hover:bg-accent/5 hover:border-accent/30",
        "flex gap-2",
        horizontal ? "flex-row items-center gap-1" : "flex-col space-y-1",
        className
      )}
    >
      {Icon && <Icon className="w-5 h-5 text-primary flex-shrink-0" />}
      <div className="flex-1 min-w-0 my-auto h-full">
        <span className="text-base font-semibold text-foreground">{title}</span>
        <div className="text-sm text-muted-foreground -mt-3">{children}</div>
      </div>
    </div>
  );

  return href ? <Link className="no-underline block" href={href}>{content}</Link> : content;
};

export default Card;

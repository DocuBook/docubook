"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import {
  Info,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import React from "react";

const noteVariants = cva(
  "relative w-full rounded-lg border border-l-4 p-4 mb-4 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        note: "bg-muted/30 border-border border-l-primary/50 text-foreground [&>svg]:text-primary",
        danger: "border-destructive/20 border-l-destructive/60 bg-destructive/5 text-destructive [&>svg]:text-destructive dark:border-destructive/30",
        warning: "border-orange-500/20 border-l-orange-500/60 bg-orange-500/5 text-orange-600 dark:text-orange-400 [&>svg]:text-orange-600 dark:[&>svg]:text-orange-400",
        success: "border-emerald-500/20 border-l-emerald-500/60 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 [&>svg]:text-emerald-600 dark:[&>svg]:text-emerald-400",
      },
    },
    defaultVariants: {
      variant: "note",
    },
  }
);

const iconMap = {
  note: Info,
  danger: ShieldAlert,
  warning: AlertTriangle,
  success: CheckCircle2,
};

interface NoteProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof noteVariants> {
  title?: string;
  type?: "note" | "danger" | "warning" | "success";
}

export default function Note({
  className,
  title = "Note",
  type = "note",
  children,
  ...props
}: NoteProps) {
  const Icon = iconMap[type] || Info;

  return (
    <div
      className={cn(noteVariants({ variant: type }), className)}
      {...props}
    >
      <Icon className="h-5 w-5" />
      <div className="pl-8">
        <h5 className="mb-1 font-medium leading-none tracking-tight">
          {title}
        </h5>
        <div className="text-sm [&_p]:leading-relaxed opacity-90">
          {children}
        </div>
      </div>
    </div>
  );
}

import { cn } from "@/lib/utils";
import clsx from "clsx";
import { PropsWithChildren } from "react";
import {
  Info,
  AlertTriangle,
  ShieldAlert,
  CheckCircle,
} from "lucide-react";

type NoteProps = PropsWithChildren & {
  title?: string;
  type?: "note" | "danger" | "warning" | "success";
};

const iconMap = {
  note: <Info size={16} className="text-blue-500" />,
  danger: <ShieldAlert size={16} className="text-red-500" />,
  warning: <AlertTriangle size={16} className="text-orange-500" />,
  success: <CheckCircle size={16} className="text-green-500" />,
};

export default function Note({
  children,
  title = "Note",
  type = "note",
}: NoteProps) {
  const noteClassNames = clsx({
    "dark:bg-stone-950/25 bg-stone-50": type === "note",
    "dark:bg-red-950 bg-red-100 border-red-200 dark:border-red-900":
      type === "danger",
    "bg-orange-50 border-orange-200 dark:border-orange-900 dark:bg-orange-900/50":
      type === "warning",
    "dark:bg-green-950 bg-green-100 border-green-200 dark:border-green-900":
      type === "success",
  });

  return (
    <div
      className={cn(
        "border rounded-md px-5 pb-0.5 mt-5 mb-7 text-sm tracking-wide",
        noteClassNames
      )}
    >
      <div className="flex items-center gap-2 font-bold -mb-2.5 pt-6">
        {iconMap[type]}
        <span className="text-base">{title}:</span>
      </div>
      {children}
    </div>
  );
}

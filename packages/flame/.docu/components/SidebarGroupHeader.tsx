import { renderLucideIcon } from "./Lucide";

interface SidebarGroupHeaderProps {
  icon?: string;
  title: string;
}

export default function SidebarGroupHeader({ icon, title }: SidebarGroupHeaderProps) {
  return (
    <div className="sidebar-group-header mb-1.5 flex items-center gap-2.5 font-medium text-gray-900 dark:text-gray-200">
      {icon && (
        <span className="flex h-4 w-4 shrink-0 items-center justify-center">
          {renderLucideIcon(icon, "h-3.5 w-3.5")}
        </span>
      )}
      <h3 className="sidebar-title font-[inherit] text-[length:inherit] leading-[inherit]">
        <span>{title}</span>
      </h3>
    </div>
  );
}

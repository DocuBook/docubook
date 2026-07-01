import { renderLucideIcon } from "./Lucide";

interface SidebarGroupHeaderProps {
  icon?: string;
  title: string;
}

export default function SidebarGroupHeader({ icon, title }: SidebarGroupHeaderProps) {
  return (
    <div className="sidebar-group-header mb-3.5 flex items-center gap-2.5 pl-4 font-medium text-gray-900 lg:mb-2.5 dark:text-gray-200">
      {icon && renderLucideIcon(icon, "sidebar-group-icon h-3.5 w-3.5 bg-current")}
      <h3 className="sidebar-title font-[inherit] text-[length:inherit] leading-[inherit]">
        <span>{title}</span>
      </h3>
    </div>
  );
}

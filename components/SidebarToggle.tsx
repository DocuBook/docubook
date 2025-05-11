import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  isOpen: boolean;
  onToggle: () => void;
};

export function SidebarToggle({ isOpen, onToggle }: Props) {
  return (
    <div className="absolute left-0 top-4 z-20">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="rounded-full border shadow bg-background"
        aria-label="Toggle Sidebar"
      >
        {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </Button>
    </div>
  );
}

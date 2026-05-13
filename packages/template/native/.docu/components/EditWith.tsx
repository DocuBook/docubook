import { SquarePen } from "lucide-react";
import { isEditEnabled, getEditLink, getRepoUrl } from "../lib/helpers";

export interface EditWithProps {
  filePath: string;
  text?: string;
  className?: string;
}

export default function EditWith({
  filePath,
  text = "Edit this page",
  className = "",
}: EditWithProps) {
  if (!isEditEnabled()) return null;

  const repoUrl = getRepoUrl();
  if (!repoUrl) return null;

  const editUrl = getEditLink(repoUrl, filePath);

  return (
    <div className={`text-right ${className}`}>
      <a
        href={editUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Edit this page"
        className="flex items-center gap-1 no-underline"
      >
        <SquarePen className="h-4 w-4" />
        {text}
      </a>
    </div>
  );
}

import { SquarePen } from "lucide-react";
import { isEditEnabled, getEditLink, getRepoUrl } from "../helpers";

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
                className="link link-hover flex items-center gap-1"
            >
                <SquarePen className="w-4 h-4" />
                {text}
            </a>
        </div>
    );
}
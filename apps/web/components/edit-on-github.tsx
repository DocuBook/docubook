import React from 'react';
import docuConfig from '@/docu.json'; // Import JSON
import { SquarePenIcon } from 'lucide-react';
import Link from 'next/link';

interface EditThisPageProps {
  filePath: string;
}

const EditThisPage: React.FC<EditThisPageProps> = ({ filePath }) => {
  const { repository } = docuConfig;

  if (!repository?.editLink || !repository.url || !repository.editPathTemplate) return null;

  const editUrl = `${repository.url}${repository.editPathTemplate.replace("{filePath}", filePath)}`;

  return (
    <div className="text-right">
      <Link
        href={editUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Edit this page on Git"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground no-underline"
      >
        <span className="flex justify-start items-center gap-1">Edit this page
        <SquarePenIcon className="w-4 h-4" /></span>
      </Link>
    </div>
  );
};

export default EditThisPage;

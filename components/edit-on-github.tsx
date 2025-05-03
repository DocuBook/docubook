import React from 'react';
import docuConfig from '@/docu.json'; // Import JSON
import { SquarePenIcon } from 'lucide-react';
import Link from 'next/link';

interface EditThisPageProps {
  filePath: string;
}

const EditThisPage: React.FC<EditThisPageProps> = ({ filePath }) => {
  const { repository } = docuConfig;
  const editUrl = `${repository.url}${repository.editPathTemplate.replace("{filePath}", filePath)}`;

  return (
    <div style={{ textAlign: 'right' }}>
      <Link
        href={editUrl}
        target='_blank'
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          textDecoration: 'none',
          fontWeight: 'bold',
        }}
      >
        <span className='text-primary text-sm max-[480px]:hidden'>Edit this page</span>
        <SquarePenIcon className="w-4 h-4 text-primary" />
      </Link>
    </div>
  );
};

export default EditThisPage;

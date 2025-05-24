'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

const GitHubStarButton: React.FC = () => {
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    fetch('https://api.github.com/repos/gitfromwildan/docubook')
      .then((res) => res.json())
      .then((data) => {
        if (data.stargazers_count !== undefined) {
          setStars(data.stargazers_count);
        }
      })
      .catch((error) => console.error('Failed to fetch stars:', error));
  }, []);

  const formatStars = (count: number) =>
    count >= 1000 ? `${(count / 1000).toFixed(1)}K` : `${count}`;

  return (
    <Link
      href="https://github.com/gitfromwildan/docubook"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground border no-underline"
    >
      <svg
        height="16"
        width="16"
        viewBox="0 0 16 16"
        aria-hidden="true"
        className="fill-current mr-1.5"
      >
        <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 005.47 7.59c.4.07.55-.17.55-.38v-1.32c-2.22.48-2.69-1.07-2.69-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.06-.49.06-.49.81.06 1.23.83 1.23.83.72 1.23 1.89.88 2.35.67.07-.52.28-.88.5-1.08-1.77-.2-3.64-.88-3.64-3.93 0-.87.31-1.58.82-2.14-.08-.2-.36-1.01.08-2.12 0 0 .67-.21 2.2.82a7.7 7.7 0 012.01-.27 7.7 7.7 0 012.01.27c1.53-1.03 2.2-.82 2.2-.82.44 1.11.16 1.92.08 2.12.51.56.82 1.27.82 2.14 0 3.06-1.87 3.73-3.65 3.93.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0016 8c0-4.42-3.58-8-8-8z" />
      </svg>
      {stars !== null ? formatStars(stars) : '...'}
    </Link>
  );
};

export default GitHubStarButton;

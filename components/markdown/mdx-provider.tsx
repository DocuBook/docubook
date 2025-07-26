'use client';

import { MDXRemote } from 'next-mdx-remote/rsc';
import { Kbd } from './KeyboardMdx';

// Define components mapping
const components = {
  // Keyboard components
  Kbd: Kbd as React.ComponentType<React.HTMLAttributes<HTMLElement> & { type?: 'window' | 'mac' }>,
  kbd: Kbd as React.ComponentType<React.HTMLAttributes<HTMLElement> & { type?: 'window' | 'mac' }>,
};

interface MDXProviderWrapperProps {
  source: string;
}

export function MDXProviderWrapper({ source }: MDXProviderWrapperProps) {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <MDXRemote
        source={source}
        components={components}
        options={{
          parseFrontmatter: true,
        }}
      />
    </div>
  );
}

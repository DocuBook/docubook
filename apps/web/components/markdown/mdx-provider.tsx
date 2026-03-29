import { parseMdx } from '@docubook/core';
import type { ComponentType, HTMLAttributes } from 'react';
import { Kbd } from './KeyboardMdx';

// Define components mapping
const components = {
  // Keyboard components
  Kbd: Kbd as ComponentType<HTMLAttributes<HTMLElement> & { type?: 'window' | 'mac' }>,
  kbd: Kbd as ComponentType<HTMLAttributes<HTMLElement> & { type?: 'window' | 'mac' }>,
};

interface MDXProviderWrapperProps {
  source: string;
}

export async function MDXProviderWrapper({ source }: MDXProviderWrapperProps) {
  const { content } = await parseMdx(source, { components });

  return (
    <div className="prose dark:prose-invert max-w-none">
      {content}
    </div>
  );
}

'use client';

import { MDXProvider } from '@mdx-js/react';
import { components } from './mdx-components';

// Create a properly typed components object
const typedComponents = {
  ...components,
  // Add any default HTML elements you want to override
  // or keep their default behavior
  kbd: components.kbd as React.ComponentType<React.HTMLAttributes<HTMLElement>>,
  Kbd: components.Kbd as React.ComponentType<React.HTMLAttributes<HTMLElement> & { type?: 'window' | 'mac' }>,
};

export function MDXProviderWrapper({ children }: { children: React.ReactNode }) {
  return <MDXProvider components={typedComponents}>{children}</MDXProvider>;
}

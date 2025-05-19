import { Kbd as KbdComponent } from './KeyboardMdx';
import type { MDXComponents } from 'mdx/types';

// Export all components that should be available in MDX files
export const components: MDXComponents = {
  // Register both Kbd and kbd to handle both cases
  Kbd: KbdComponent as any, // We'll handle the type in the MDXProvider

  // You can add other MDX components here as needed
  // They will be available in your MDX files
  // Example:
  // h1: (props) => <h1 className="text-2xl font-bold" {...props} />,
};

export default components;

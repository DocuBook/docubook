import { createContext } from 'react';

// Create a context to check if a component is inside an accordion group
export const AccordionGroupContext = createContext<{ inGroup: boolean } | null>(null);
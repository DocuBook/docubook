import React from 'react';

// Map of special keys to their Mac symbols
const macKeyMap: Record<string, string> = {
  command: '⌘',
  cmd: '⌘',
  option: '⌥',
  alt: '⌥',
  shift: '⇧',
  ctrl: '⌃',
  control: '⌃',
  tab: '⇥',
  caps: '⇪',
  enter: '⏎',
  return: '⏎',
  delete: '⌫',
  escape: '⎋',
  esc: '⎋',
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
  space: '␣',
};

// Map of special keys to their Windows display text
const windowsKeyMap: Record<string, string> = {
  command: 'Win',
  cmd: 'Win',
  option: 'Alt',
  alt: 'Alt',
  ctrl: 'Ctrl',
  control: 'Ctrl',
  delete: 'Del',
  escape: 'Esc',
  esc: 'Esc',
  enter: 'Enter',
  return: 'Enter',
  tab: 'Tab',
  caps: 'Caps',
  shift: 'Shift',
  space: 'Space',
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
};

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  /** The key to display (e.g., 'cmd', 'ctrl', 'a') */
  show?: string;
  /** Platform style - 'window' or 'mac' */
  type?: 'window' | 'mac';
  /** Custom content to display (overrides automatic rendering) */
  children?: React.ReactNode;
}

const KbdComponent: React.FC<KbdProps> = ({
  show: keyProp,
  type = 'window',
  children,
  ...props
}) => {
  // Get the display text based on the key and type
  const getKeyDisplay = (): React.ReactNode => {
    if (!keyProp || typeof keyProp !== 'string') return null;

    const lowerKey = keyProp.toLowerCase();

    // For Mac type, return the symbol if it exists
    if (type === 'mac') {
      return macKeyMap[lowerKey] || keyProp;
    }

    // For Windows, return the formatted key if it exists, otherwise capitalize the first letter
    return windowsKeyMap[lowerKey] || (keyProp.charAt(0).toUpperCase() + keyProp.slice(1));
  };

  // Determine what to render
  const renderContent = () => {
    // If children are provided, always use them
    if (children !== undefined && children !== null && children !== '') {
      return children;
    }
    // Otherwise use the generated display
    return getKeyDisplay() || keyProp || '';
  };

  return (
    <kbd
      className="inline-flex items-center justify-center px-2 py-1 mx-0.5 text-xs font-mono font-medium text-foreground bg-secondary/70 border rounded-md"
      {...props}
    >
      {renderContent()}
    </kbd>
  );
};

// Export the component
export const Kbd = KbdComponent;
// Default export for backward compatibility
export default KbdComponent;

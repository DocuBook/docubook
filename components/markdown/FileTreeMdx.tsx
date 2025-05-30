'use client';

import React, { useState, ReactNode, Children, isValidElement, cloneElement } from 'react';
import { ChevronRight, File as FileIcon, Folder as FolderIcon, FolderOpen } from 'lucide-react';

interface FileProps {
  name: string;
  children?: ReactNode;
}

const FileComponent = ({ name }: FileProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const fileExtension = name.split('.').pop()?.toUpperCase();

  return (
    <div
      className={`
        flex items-center gap-2 py-1.5 pl-7 pr-3 text-sm rounded-md
        transition-colors duration-150 cursor-default select-none
        ${isHovered ? 'bg-accent/10' : 'hover:bg-muted/50'}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      tabIndex={-1}
    >
      <FileIcon className={`
        h-3.5 w-3.5 flex-shrink-0 transition-colors
        ${isHovered ? 'text-accent' : 'text-muted-foreground'}
      `} />
      <span className="font-mono text-sm text-foreground truncate">{name}</span>
      {isHovered && fileExtension && (
        <span className="ml-auto text-xs text-muted-foreground/80">
          {fileExtension}
        </span>
      )}
    </div>
  );
};

const FolderComponent = ({ name, children }: FileProps) => {
  const [isOpen, setIsOpen] = useState(true); // Set to true by default
  const [isHovered, setIsHovered] = useState(false);
  const hasChildren = React.Children.count(children) > 0;

  return (
    <div className="relative">
      <div
        className={`
          flex items-center gap-2 py-1.5 pl-4 pr-3 rounded-md
          transition-colors duration-150 select-none
          ${isHovered ? 'bg-muted/60' : ''}
          ${isOpen ? 'text-foreground' : 'text-foreground/80'}
          ${hasChildren ? 'cursor-pointer' : 'cursor-default'}
        `}
        onClick={() => hasChildren && setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        tabIndex={-1}
        onKeyDown={(e) => e.preventDefault()}
      >
        {hasChildren ? (
          <ChevronRight
            className={`
              h-3.5 w-3.5 flex-shrink-0 transition-transform duration-200
              ${isOpen ? 'rotate-90' : ''}
              ${isHovered ? 'text-foreground/70' : 'text-muted-foreground'}
            `}
          />
        ) : (
          <div className="w-3.5" />
        )}
        {isOpen ? (
          <FolderOpen className={`
            h-4 w-4 flex-shrink-0 transition-colors
            ${isHovered ? 'text-accent' : 'text-muted-foreground'}
          `} />
        ) : (
          <FolderIcon className={`
            h-4 w-4 flex-shrink-0 transition-colors
            ${isHovered ? 'text-accent/80' : 'text-muted-foreground/80'}
          `} />
        )}
        <span className={`
          font-medium transition-colors duration-150
          ${isHovered ? 'text-accent' : ''}
        `}>
          {name}
        </span>
      </div>
      {isOpen && hasChildren && (
        <div className="ml-5 border-l-2 border-muted/50 pl-2">
          {children}
        </div>
      )}
    </div>
  );
};

export const Files = ({ children }: { children: ReactNode }) => {
  return (
    <div
      className="
        rounded-xl border border-muted/50
        bg-card/50 backdrop-blur-sm
        shadow-sm overflow-hidden
        transition-all duration-200
        hover:shadow-md hover:border-muted/60
      "
      onKeyDown={(e) => e.preventDefault()}
    >
      <div className="p-2">
        {Children.map(children, (child, index) => {
          if (isValidElement(child)) {
            return cloneElement(child, { key: index });
          }
          return null;
        })}
      </div>
    </div>
  );
};

export const Folder = ({ name, children }: FileProps) => {
  return <FolderComponent name={name}>{children}</FolderComponent>;
};

export const File = ({ name }: FileProps) => {
  return <FileComponent name={name} />;
};

// MDX Components
export const FileTreeMdx = {
  Files,
  File,
  Folder,
};

export default FileTreeMdx;

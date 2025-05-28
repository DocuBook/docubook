'use client';

import React, { useState, ReactNode, Children, isValidElement, cloneElement } from 'react';
import { ChevronRight, ChevronDown, File as FileIcon, Folder as FolderIcon, FolderOpen } from 'lucide-react';

interface FileTreeProps {
  children: ReactNode;
  defaultOpen?: boolean;
}

interface FileProps {
  name: string;
  children?: ReactNode;
}

const FileComponent = ({ name }: FileProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`
        flex items-center gap-2 py-1.5 pl-7 pr-3 text-sm
        transition-all duration-200 ease-in-out rounded-md
        ${isHovered
          ? 'bg-blue-50 dark:bg-blue-900/30'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <FileIcon className={`h-3.5 w-3.5 transition-colors ${isHovered ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'}`} />
      <span className="font-mono text-sm text-gray-700 dark:text-gray-300">{name}</span>
      {isHovered && (
        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
          {name.split('.').pop()?.toUpperCase()}
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
          flex items-center gap-2 py-1.5 pl-4 pr-3 rounded-md cursor-pointer
          transition-all duration-200 ease-in-out
          ${isHovered ? 'bg-gray-50 dark:bg-gray-800/50' : ''}
          ${isOpen ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}
        `}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {hasChildren ? (
          <ChevronRight
            className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? 'transform rotate-90' : ''}`}
          />
        ) : (
          <div className="w-3.5" />
        )}
        {isOpen ? (
          <FolderOpen className="h-4 w-4 text-blue-500 dark:text-blue-400" />
        ) : (
          <FolderIcon className="h-4 w-4 text-blue-400 dark:text-blue-500" />
        )}
        <span className="font-medium">{name}</span>
      </div>
      {isOpen && hasChildren && (
        <div className="ml-5 border-l-2 border-gray-100 dark:border-gray-700/50 pl-2">
          {children}
        </div>
      )}
    </div>
  );
};

export const Files = ({ children }: { children: ReactNode }) => {
  return (
    <div className="
      rounded-xl border border-gray-100 dark:border-gray-700/50
      bg-white/50 dark:bg-gray-800/30 backdrop-blur-sm
      shadow-sm overflow-hidden
      transition-all duration-200
      hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600/50
    ">
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

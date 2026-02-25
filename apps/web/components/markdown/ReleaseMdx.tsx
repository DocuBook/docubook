import React, { PropsWithChildren } from 'react';
import { cn } from '@/lib/utils';
import { PlusCircle, Wrench, Zap, AlertTriangle, XCircle } from 'lucide-react';

interface ReleaseProps extends PropsWithChildren {
  version: string;
  title: string;
  date?: string;
}

function Release({ version, title, date, children }: ReleaseProps) {

  return (
    <div className="mb-16 group">
      <div className="flex items-center gap-3 mt-6 mb-2">
        <div
          id={version}
          className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary transition-colors hover:bg-primary/15 scroll-m-20 backdrop-blur-sm"
        >
          v{version}
        </div>
        {date && (
          <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
            <span className="h-1 w-1 rounded-full bg-muted-foreground/30"></span>
            <time dateTime={date}>
              {new Date(date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </time>
          </div>
        )}
      </div>
      <h3 className="text-2xl font-bold text-foreground/90 mb-6 !mt-0">
        {title}
      </h3>
      <div className="space-y-8">
        {children}
      </div>
    </div>
  );
}

interface ChangesProps extends PropsWithChildren {
  type: 'added' | 'fixed' | 'improved' | 'deprecated' | 'removed';
}

const typeConfig = {
  added: {
    label: 'Added',
    className: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
    icon: PlusCircle,
  },
  fixed: {
    label: 'Fixed',
    className: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300',
    icon: Wrench,
  },
  improved: {
    label: 'Improved',
    className: 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300',
    icon: Zap,
  },
  deprecated: {
    label: 'Deprecated',
    className: 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300',
    icon: AlertTriangle,
  },
  removed: {
    label: 'Removed',
    className: 'bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300',
    icon: XCircle,
  },
} as const;

function Changes({ type, children }: ChangesProps) {
  const config = typeConfig[type] || typeConfig.added;

  return (
    <div className="space-y-3 mb-8">
      <div className="flex items-center gap-2">
        <div className={cn("px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5", config.className)}>
          <config.icon className="h-3.5 w-3.5" />
          <span>{config.label}</span>
        </div>
      </div>
      <ul className="list-none pl-0 space-y-2 text-foreground/80">
        {React.Children.map(children, (child, index) => {
          // Jika teks dimulai dengan - atau *, hapus karakter tersebut
          const processedChild = typeof child === 'string'
            ? child.trim().replace(/^[-*]\s+/, '')
            : child;

          return (
            <li key={index} className="leading-relaxed">
              {processedChild}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export { Release, Changes };

const ReleaseMdx = {
  Release,
  Changes
};

export default ReleaseMdx;

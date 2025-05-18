"use client";

import { ReactNode, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type AccordionProps = {
    title: string;
    children?: ReactNode;
    defaultOpen?: boolean;
    className?: string;
};

const Accordion = ({
    title,
    children,
    defaultOpen = false,
    className,
}: AccordionProps) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className={cn("border rounded-lg overflow-hidden", className)}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center my-auto space-x-2 space-y-2 w-full px-4 h-12 transition-colors bg-background dark:hover:bg-muted/50 hover:bg-muted/15"
            >
                <ChevronRight
                    className={cn(
                        "w-4 h-4 text-muted-foreground transition-transform duration-200",
                        isOpen && "rotate-90"
                    )}
                />
                <h3 className="font-medium text-base text-foreground pb-2">{title}</h3>
            </button>

            {isOpen && (
                <div className="px-4 py-3 border-t dark:bg-muted/50 bg-muted/15">
                    {children}
                </div>
            )}
        </div>
    );
};

export default Accordion;

"use client";

import { ReactNode, useState, useContext } from 'react';
import { ChevronRight } from 'lucide-react';
import * as Icons from "lucide-react";
import { cn } from '@/lib/utils';
import { AccordionGroupContext } from '@/components/contexts/AccordionContext';

type AccordionProps = {
    title: string;
    children?: ReactNode;
    defaultOpen?: boolean;
    icon?: keyof typeof Icons;
};

const Accordion: React.FC<AccordionProps> = ({
    title,
    children,
    defaultOpen = false,
    icon,
}: AccordionProps) => {
    const groupContext = useContext(AccordionGroupContext);
    const isInGroup = groupContext?.inGroup === true;
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const Icon = icon ? (Icons[icon] as React.FC<{ className?: string }>) : null;

    // The main wrapper div for the accordion.
    // All styling logic for the accordion container is handled here.
    return (
        <div
            className={cn(
                // Style for STANDALONE: full card with border & shadow
                !isInGroup && "border rounded-lg shadow-sm",
                // Style for IN GROUP: only a bottom border separator
                isInGroup && "border-b last:border-b-0 border-border"
            )}
        >
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 w-full px-4 py-3 transition-colors bg-muted/40 dark:bg-muted/20 hover:bg-muted/70 dark:hover:bg-muted/70 cursor-pointer text-start"
            >
                <ChevronRight
                    className={cn(
                        "w-4 h-4 text-muted-foreground transition-transform duration-200 flex-shrink-0",
                        isOpen && "rotate-90"
                    )}
                />
                {Icon && <Icon className="text-foreground w-4 h-4 flex-shrink-0" />}
                <h3 className="font-medium text-base text-foreground !m-0">{title}</h3>
            </button>

            {isOpen && (
                <div className="px-4 py-3 dark:bg-muted/10 bg-muted/15">
                    {children}
                </div>
            )}
        </div>
    );
};

export default Accordion;
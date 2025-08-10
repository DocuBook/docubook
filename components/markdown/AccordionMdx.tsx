"use client";

import { ReactNode, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import * as Icons from "lucide-react";
import { cn } from '@/lib/utils';

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
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const Icon = icon ? (Icons[icon] as React.FC<{ className?: string }>) : null;

    return (
        <div className={cn("border rounded-lg overflow-hidden")}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 w-full px-4 h-12 transition-colors bg-background dark:hover:bg-muted/50 hover:bg-muted/15"
            >
                <ChevronRight
                    className={cn(
                        "w-4 h-4 text-muted-foreground transition-transform duration-200",
                        isOpen && "rotate-90"
                    )}
                />
                {Icon && <Icon className="text-foreground w-4 h-4"/> }
                <h3 className="font-medium text-base text-foreground m-0">{title}</h3>
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

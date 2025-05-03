"use client";

import { ListIcon } from "lucide-react";
import TocObserver from "./toc-observer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface MobTocProps {
  tocs: {
    level: number;
    text: string;
    href: string;
  }[];
}

export default function MobToc({ tocs }: MobTocProps) {
  return (
    <div className="lg:hidden block w-full">
      <Accordion type="single" collapsible>
        <AccordionItem value="toc">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <ListIcon className="w-4 h-4" />
              <span className="font-medium text-sm">On this page</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="h-auto py-2">
            <TocObserver data={tocs} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

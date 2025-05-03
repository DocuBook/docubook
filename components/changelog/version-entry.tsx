"use client";

import { useState } from "react";
import { VersionTag } from "./version-tag";
import { ChangeGroup } from "./change-group";
import { formatDate2 } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface VersionEntryProps {
  version: string;
  date: string;
  description?: string;
  image?: string;
  changes: {
    Added?: string[];
    Improved?: string[];
    Fixed?: string[];
    Deprecated?: string[];
    Removed?: string[];
  };
  isLast?: boolean;
}

export function VersionEntry({ 
  version, 
  date, 
  description,
  image, 
  changes,
  isLast 
}: VersionEntryProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div id={`v${version}`} className="relative scroll-mt-24">
      <div className="relative pb-12">
        {/* Version header */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center gap-3">
            <VersionTag version={version} />
            <time className="text-sm text-muted-foreground">
              {formatDate2(date)}
            </time>
          </div>
          
          {description && (
            <p className="text-dark text-xl">{description}</p>
          )}

            {image && (
            <div className="relative w-full h-0 pb-[56.25%] rounded-lg overflow-hidden border">
              <Image
              src={image}
              alt={`Version ${version} preview`}
              fill
              className="object-cover"
              priority
              quality={90}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
            )}
        </div>

        {/* Changes */}
        <div className="space-y-6">
          {Object.entries(changes).map(([type, items]) => (
            items && items.length > 0 && (
              <ChangeGroup 
                key={type} 
                type={type as keyof typeof changes}
                changes={items}
                expanded={expanded}
              />
            )
          ))}
        </div>

        {/* Show more/less button */}
        {Object.values(changes).some(items => items && items.length > 5) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="mt-4 text-muted-foreground hover:text-foreground"
          >
            {expanded ? (
              <>
                Show less
                <ChevronUpIcon className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Show more
                <ChevronDownIcon className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>

      {/* Version divider */}
      {!isLast && (
        <div className="absolute left-0 bottom-0 w-full">
          <Separator className="my-8" />
        </div>
      )}
    </div>
  );
}
"use client";

import { CommandIcon, SearchIcon } from "lucide-react";
import { DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function SearchTrigger() {
  return (
    <DialogTrigger asChild>
      <div className="relative flex-1 cursor-pointer max-w-[140px]">
        <div className="flex items-center">
          <div className="md:hidden p-2 -ml-2">
            <SearchIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="hidden md:block w-full">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="w-full rounded-full dark:bg-background/95 bg-background border h-9 pl-10 pr-0 sm:pr-4 text-sm shadow-sm overflow-ellipsis"
              placeholder="Search"
              readOnly // This input is for display only
            />
            <div className="flex absolute top-1/2 -translate-y-1/2 right-2 text-xs font-medium font-mono items-center gap-0.5 dark:bg-accent bg-accent text-white px-2 py-0.5 rounded-full">
              <CommandIcon className="w-3 h-3" />
              <span>K</span>
            </div>
          </div>
        </div>
      </div>
    </DialogTrigger>
  );
}
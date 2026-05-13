import { PropsWithChildren } from "react";

export function Typography({ children }: PropsWithChildren) {
  return (
    <div className="prose prose-zinc dark:prose-invert prose-code:font-code dark:prose-code:bg-stone-900/25 prose-code:bg-stone-50 prose-pre:bg-background max-lg:prose-headings:scroll-mt-54 prose-headings:scroll-mt-4 prose-code:text-sm prose-code:leading-6 dark:prose-code:text-white prose-code:text-stone-800 prose-code:p-1 prose-code:rounded-md prose-code:border prose-img:rounded-md prose-img:border prose-code:before:content-none prose-code:after:content-none prose-code:px-1.5 prose-code:overflow-x-auto prose-img:my-3 prose-h2:my-4 prose-h2:mt-8 w-[85vw] max-w-[500px]! min-w-full! pt-2 sm:mx-auto sm:w-full">
      {children}
    </div>
  );
}

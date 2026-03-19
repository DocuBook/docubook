import { buttonVariants } from "@/components/ui/button";
import { page_routes } from "@/lib/routes";
import Link from "next/link";
import { getMetadata } from "@/app/layout";
import { CopyCommand } from "@/components/home/copycommand";
import { Mascot } from "@/components/home/Mascot";
import AnimatedShinyText from "@/components/ui/animated-shiny-text";
import { ArrowUpRightIcon, TerminalSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata = getMetadata({
  title: "Home",
});

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center px-2 py-8 text-center sm:py-36">
      <Link
        href="https://www.npmjs.com/package/@docubook/cli" target="_blank"
        className="mb-5 sm:text-lg flex items-center gap-2 underline underline-offset-4 sm:-mt-12"
      >
        <div className="z-10 flex min-h-10 items-center justify-center max-[800px]:mt-10">
          <div
            className={cn(
              "group rounded-full border border-black/5 bg-black/5 text-base text-white transition-all ease-in hover:cursor-pointer hover:bg-accent dark:border-white/5 dark:bg-transparent dark:hover:bg-accent",
            )}
          >
            <AnimatedShinyText className="inline-flex items-center justify-center px-4 py-1 transition ease-out hover:text-neutral-100 hover:duration-300 hover:dark:text-neutral-200">
              <TerminalSquare className="size-4 mr-2 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
              <span>DocuBook CLI</span>
              <ArrowUpRightIcon className="size-4 ml-2 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
            </AnimatedShinyText>
          </div>
        </div>
      </Link>
      <div className="w-full max-w-[800px] pb-8">
        <h1 className="mb-4 text-2xl font-bold sm:text-5xl">
          The Universal Documentation Engine for React Framework.
        </h1>
        <p className="mb-8 sm:text-xl text-muted-foreground">
          An open-source alternative to Mintlify or GitBook. Just write in MDX — it works with pretty much any React framework.
        </p>
      </div>
      <div className="flex flex-row items-center gap-5">
        <Link
          href={`/docs${page_routes[0].href}`}
          className={buttonVariants({
            className:
              "px-6 bg-accent text-white hover:bg-primary dark:bg-accent dark:hover:bg-primary",
            size: "lg",
          })}
        >
          Get Started
        </Link>
        <Link
          href="https://www.youtube.com/channel/UCWRCKHQCS-LCjd2WfDJCvRg?sub_confirmation=1"
          target="_blank"
          className={buttonVariants({
            variant: "secondary",
            className: "px-6 bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700",
            size: "lg",
          })}
        >
          Subscribe Now
        </Link>
      </div>
      <CopyCommand />
      <Mascot className="py-8" />
    </div>
  );
}

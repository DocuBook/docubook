import { buttonVariants } from "@/components/ui/button";
import { page_routes } from "@/lib/routes-config";
import { ArrowRightIcon, FileJson, GitCommitHorizontal, SquarePlay } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import AnimatedShinyText from "@/components/ui/animated-shiny-text";
import { getMetadata } from "@/app/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = getMetadata({
  title: "Home",
});

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center px-2 py-8 text-center sm:py-36">
      <Link
        href="/docs/changelog/version-1"
        className="mb-5 sm:text-lg flex items-center gap-2 underline underline-offset-4 sm:-mt-12"
      >
        <div className="z-10 flex min-h-10 items-center justify-center max-[800px]:mt-10">
          <div
            className={cn(
              "group rounded-full border border-black/5 bg-black/5 text-base text-white transition-all ease-in hover:cursor-pointer hover:bg-accent dark:border-white/5 dark:bg-transparent dark:hover:bg-accent",
            )}
          >
            <AnimatedShinyText className="inline-flex items-center justify-center px-4 py-1 transition ease-out hover:text-neutral-100 hover:duration-300 hover:dark:text-neutral-200">
              <span>🚀 New Version - Release v1.16.0</span>
              <ArrowRightIcon className="ml-1 size-3 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
            </AnimatedShinyText>
          </div>
        </div>
      </Link>
    <div className="w-full max-w-[800px] pb-8">
        <h1 className="mb-4 text-2xl font-bold sm:text-5xl">DocuBook Starter Templates</h1>
        <p className="mb-8 sm:text-xl text-muted-foreground">
            Get started by editing app/page.tsx . Save and see your changes instantly.{' '}
            <Link className="text-primary underline" href="https://www.docubook.pro/docs/getting-started/introduction" target="_blank">
            Read Documentations
            </Link>
        </p>
    </div>
      <div className="flex flex-row items-center gap-6 mb-10">
        <Link
          href={`/docs${page_routes[0].href}`}
          className={buttonVariants({
            className: "px-6 bg-accent text-white hover:bg-primary dark:bg-accent dark:hover:bg-primary",
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-12">
        <Card className="px-2 py-6">
          <CardHeader className="flex flex-row justify-center items-center gap-3">
            <FileJson className="size-6 text-primary" />
            <CardTitle className="text-xl">docu.json</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Edit the docu.json file to change the content in the header, footer and sidebar.</p>
          </CardContent>
        </Card>
        <Card className="px-2 py-6">
          <CardHeader className="flex flex-row justify-center items-center gap-3">
            <GitCommitHorizontal className="size-6 text-primary" />
            <CardTitle className="text-xl">CHANGELOG.md</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Manage changes to each version of your application in the CHANGELOG.md file.</p>
          </CardContent>
        </Card>
        <Card className="px-2 py-6">
          <CardHeader className="flex flex-row justify-center items-center gap-3">
            <SquarePlay className="size-6 text-primary" />
            <CardTitle className="text-xl">Docu Play</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Easy to write interactive markdown content with a playground.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

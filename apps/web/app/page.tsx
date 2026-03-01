import { buttonVariants } from "@/components/ui/button";
import { page_routes } from "@/lib/routes";
import Link from "next/link";
import { getMetadata } from "@/app/layout";
import { CopyCommand } from "@/components/home/copycommand";
import { Mascot } from "@/components/home/Mascot";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";

export const metadata = getMetadata({
  title: "Home",
});

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center px-2 py-8 text-center sm:py-36">
      <Link
        href="/docs/changelog" className="flex items-center gap-2 py-6">
        <InteractiveHoverButton>
          v2.3.0 Available Now!
        </InteractiveHoverButton>
      </Link>
      <div className="w-full max-w-[800px] pb-8">
        <h1 className="mb-4 text-2xl font-bold sm:text-5xl">
          Hello Docu, Smooth sailing when making docs.
        </h1>
        <p className="mb-8 sm:text-xl text-muted-foreground">
          An open-source Software <span className="underline decoration-dotted" >Mintlify / Gitbook / Docusaurus</span> alternative. Free forever with no feature limitations.
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
      <Mascot />
    </div>
  );
}

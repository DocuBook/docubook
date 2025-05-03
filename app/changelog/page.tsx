import { Suspense } from "react";
import { getChangelogEntries } from "@/lib/changelog";
import { VersionEntry } from "@/components/changelog/version-entry";
import { VersionToc } from "@/components/changelog/version-toc";
import { getMetadata } from "@/app/layout";
import docuConfig from "@/docu.json";
import { FloatingVersionToc } from "@/components/changelog/floating-version";

export const metadata = getMetadata({
  title: "Changelog",
  description: "Latest updates and improvements to DocuBook",
  image: "release-note.png",
});

export default async function ChangelogPage() {
  const entries = await getChangelogEntries();
  const { meta } = docuConfig;
  return (
    <div className="flex flex-col w-full">
      <div className="border-b">
        <div className="py-8">
          <h1 className="text-2xl font-extrabold">Changelog</h1>
            <p className="text-lg text-muted-foreground mt-2">
            Latest updates and improvements to {meta.title}
           </p>
        </div>
      </div>

      <div className="md:container py-8">
        <div className="flex items-start gap-8">
          <Suspense fallback={<div className="lg:flex hidden flex-[1.5] min-w-[238px]" />}>
            <VersionToc
              versions={entries.map(({ version, date }) => ({ version, date }))}
            />
          </Suspense>

          <main className="flex-1 lg:flex-[5.25] min-w-0">
            <div className="relative">
              <div className="absolute left-0 top-0 h-full w-px bg-border lg:block hidden" />
              <div className="lg:pl-12 pl-0 lg:pt-8">
                {entries.map((entry, index) => (
                    <section
                        id={`version-${entry.version}`}
                        key={entry.version}
                        className="scroll-mt-20" // Tambahkan margin atas saat scroll
                     >
                        <VersionEntry {...entry} isLast={index === entries.length - 1} />
                    </section>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
          {/* Floating TOC for smaller screens */}
            {entries.length > 0 && (
            <FloatingVersionToc
                versions={entries.map(({ version, date }) => ({ version, date }))}
            />
            )}
    </div>
  );
}

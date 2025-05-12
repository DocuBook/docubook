import { Suspense } from "react";
import { getChangelogEntries } from "@/lib/changelog";
import { VersionEntry } from "@/components/changelog/version-entry";
import { VersionToc } from "@/components/changelog/version-toc";
import { FloatingVersionToc } from "@/components/changelog/floating-version";

export default async function ChangelogPage() {
  const entries = await getChangelogEntries();

  return (
    <div className="flex items-start">
          <Suspense fallback={<div className="lg:flex hidden flex-[1.5]" />}>
            <VersionToc
              versions={entries.map(({ version, date }) => ({ version, date }))}
            />
          </Suspense>

          <main className="flex-1 md:flex-[5.25] min-w-0 max-w-[800px]">
            <div className="relative">
              <div className="absolute left-0 top-0 h-full w-px bg-border md:block hidden" />
              <div className="md:px-12 md:py-8 max-md:py-10">
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
          {/* Floating TOC for smaller screens */}
            {entries.length > 0 && (
            <FloatingVersionToc
                versions={entries.map(({ version, date }) => ({ version, date }))}
            />
            )}
    </div>
  );
}

import type { ReactNode } from "react";
import DocsBreadcrumb from "../../components/Breadcrumb";
import Pagination from "../../components/Pagination";
import { Typography } from "../../components/Typography";
import EditWith from "../../components/EditWith";
import { formatDate2 } from "../../lib/utils";
import type { TocItem } from "../../lib/types";

interface DocsPageProps {
  slug: string[];
  title: string;
  description?: string;
  date?: string;
  content: ReactNode;
  tocs: TocItem[];
  filePath: string;
  repoUrl?: string;
}

export default function DocsPage({
  slug,
  title,
  description,
  date,
  content,
  tocs,
  filePath,
  repoUrl,
}: DocsPageProps) {
  const pathname = slug.join("/");
  const tocsJson = JSON.stringify(tocs);

  return (
    <div className="flex w-full flex-1 px-0 pb-4 lg:h-[calc(100vh-4rem)] lg:px-8 lg:pb-8">
      <div
        id="scroll-container"
        className="bg-base-100 border-base-300 relative flex w-full flex-col items-start rounded-b-3xl border shadow-md max-lg:scroll-p-54 lg:h-full lg:flex-row lg:overflow-y-auto lg:rounded-xl"
      >
        <div className="w-full min-w-0 flex-[7] px-4 py-4 lg:px-8 lg:py-8">
          {/* Mobile bar - island */}
          <div
            id="mobile-bar-island"
            className="lg:hidden"
            data-tocs={tocsJson}
            data-title={title}
            data-repo={repoUrl || ""}
          />

          <DocsBreadcrumb paths={slug} />
          <Typography>
            <h1 className="-mt-0.5 text-3xl">{title}</h1>
            {description && (
              <p className="text-muted-foreground -mt-4 text-[16.5px]">{description}</p>
            )}
            <div>{content}</div>
            <div className="border-base-300 my-8 flex items-center border-b-2 border-dashed">
              <EditWith className="text-muted-foreground" filePath={filePath} />
              {date && (
                <p className="text-muted-foreground ml-auto text-[13px]">
                  Last updated {formatDate2(date)}
                </p>
              )}
            </div>
            <Pagination pathname={pathname} />
          </Typography>
        </div>

        {/* Desktop TOC - island */}
        {tocs.length > 0 && (
          <div
            id="toc-island"
            data-tocs={tocsJson}
            className="sticky top-4 hidden h-[calc(100vh-8rem)] min-w-[240px] flex-[3] self-start lg:flex lg:px-4 lg:py-6"
          />
        )}
      </div>
    </div>
  );
}

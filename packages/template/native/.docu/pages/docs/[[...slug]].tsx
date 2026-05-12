import type { ReactNode } from "react";
import DocsBreadcrumb from "../../components/Breadcrumb";
import Pagination from "../../components/Pagination";
import Toc from "../../components/Toc";
import Sidebar from "../../components/Sidebar";
import { Typography } from "../../components/Typography";
import EditWith from "../../components/EditWith";
import { formatDate2 } from "../../lib/utils";
import { getRepoUrl } from "../../lib/helpers";
import type { TocItem } from "../../lib/types";

interface DocsPageProps {
  slug: string[];
  title: string;
  description?: string;
  date?: string;
  content: ReactNode;
  tocs: TocItem[];
  filePath: string;
}

export default function DocsPage({
  slug,
  title,
  description,
  date,
  content,
  tocs,
  filePath,
}: DocsPageProps) {
  const pathname = slug.join("/");
  const repoUrl = getRepoUrl();

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar tocs={tocs} title={title} repoUrl={repoUrl} />

      <div className="flex min-w-0 flex-1 flex-col lg:flex-row">
        <div className="min-w-0 flex-1 px-4 py-4 lg:px-8 lg:py-8">
          <DocsBreadcrumb paths={slug} />
          <Typography>
            <h1>{title}</h1>
            {description && <p className="text-base-content/60 -mt-4 text-base">{description}</p>}
            <div>{content}</div>
            <div className="border-base-300 my-8 flex items-center justify-between border-b border-dashed pb-4">
              <EditWith filePath={filePath} />
              {date && (
                <p className="text-base-content/50 text-xs">Last updated {formatDate2(date)}</p>
              )}
            </div>
            <Pagination pathname={pathname} />
          </Typography>
        </div>

        <div className="hidden xl:block xl:w-56 xl:shrink-0 xl:py-8 xl:pr-4">
          <div className="sticky top-20">
            <Toc tocs={tocs} />
          </div>
        </div>
      </div>
    </div>
  );
}

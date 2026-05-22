import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Fragment } from "react";

export default function DocsBreadcrumb({ paths }: { paths: string[] }) {
  return (
    <div className="pb-5 max-lg:pt-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <span>Docs</span>
          </BreadcrumbItem>
          {paths.map((path, index) => (
            <Fragment key={`${path}-${index}`}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {index < paths.length - 1 ? (
                  <span>{toTitleCase(path)}</span>
                ) : (
                  <BreadcrumbPage>{toTitleCase(path)}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}

const acronyms = new Set([
  "mdx",
  "api",
  "pdf",
  "cli",
  "ui",
  "css",
  "html",
  "yaml",
  "json",
  "ssr",
  "ssg",
]);

function toTitleCase(input: string): string {
  return input
    .split("-")
    .map((w) => (acronyms.has(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

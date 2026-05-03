import { Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "./base/breadcrumbs";

export interface DocsBreadcrumbProps {
  paths: string[];
  baseHref?: string;
}

function toTitleCase(input: string): string {
  return input
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function DocsBreadcrumb({
  paths,
  baseHref = "/docs"
}: DocsBreadcrumbProps) {
  return (
    <Breadcrumb className="py-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/index.html">
            Docs
          </BreadcrumbLink>
        </BreadcrumbItem>
        {paths.map((path, index) => (
          <Fragment key={`${path}-${index}`}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {index < paths.length - 1 ? (
                <BreadcrumbLink
                  href={`${baseHref}/${paths.slice(0, index + 1).join("/")}.html`}
                >
                  {toTitleCase(path)}
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>
                  {toTitleCase(path)}
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
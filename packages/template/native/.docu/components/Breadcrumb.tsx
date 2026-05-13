import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "./base/breadcrumbs";

export interface DocsBreadcrumbProps {
  paths: string[];
}

function toTitleCase(input: string): string {
  return input
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function DocsBreadcrumb({ paths }: DocsBreadcrumbProps) {
  return (
    <Breadcrumb className="py-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <span className="text-muted-foreground">Docs</span>
        </BreadcrumbItem>
        {paths.map((path, index) => (
          <BreadcrumbItem key={`${path}-${index}`}>
            {index < paths.length - 1 ? (
              <span className="text-muted-foreground">{toTitleCase(path)}</span>
            ) : (
              <BreadcrumbPage className="text-base-content">{toTitleCase(path)}</BreadcrumbPage>
            )}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

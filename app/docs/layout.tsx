import { Leftbar } from "@/components/leftbar";
import { MDXProviderWrapper } from "@/components/markdown/mdx-provider";

export default function DocsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex items-start gap-8">
      <Leftbar key="leftbar" />
      <div className="flex-[5.25]">
        <MDXProviderWrapper>
          {children}
        </MDXProviderWrapper>
      </div>
    </div>
  );
}

import { Leftbar } from "@/components/leftbar";
import DocsNavbar from "@/components/DocsNavbar";
import "@/styles/override.css";

export default function DocsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="docs-layout flex flex-col min-h-screen w-full">
      <div className="flex flex-1 items-start w-full">
        <Leftbar key="leftbar" />
        <main className="flex-1 min-w-0 dark:bg-background/50 min-h-screen flex flex-col">
          <DocsNavbar />
          <div className="flex-1 w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

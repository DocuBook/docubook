import Link from "next/link";
import { ModeToggle } from "@/components/theme-toggle";
import docuConfig from "@/docu.json";
import * as LucideIcons from "lucide-react"; // Import all icons

export function Footer() {
  const { footer } = docuConfig;
  const { meta } = docuConfig;
  return (
    <footer className="w-full py-4 px-2 border-t lg:py-8 bg-background">
      <div className="container flex flex-wrap items-center justify-between text-sm">
        <div className="items-start justify-center hidden gap-4 lg:flex-col lg:flex lg:w-3/5">
            <h3 className="text-lg font-bold font-code">{meta.title}</h3>
            <span className="w-3/4 text-base text-wrap text-muted-foreground">{meta.description}</span>
            <div className="flex items-center gap-6 mt-2">
                <FooterButtons />
            </div>
        </div>
        <div className="flex flex-col items-start justify-center w-full gap-4 mt-4 xl:items-end lg:w-2/5">
            <p className="text-center text-muted-foreground">
                Copyright © {new Date().getFullYear()} {footer.copyright} - <MadeWith />
            </p>
            <div className="hidden lg:flex">
                <ModeToggle />
            </div>
        </div>
      </div>
    </footer>
  );
}

export function FooterButtons() {
  const { footer } = docuConfig;

  return (
    <>
      {footer.social?.map((item) => {
        const IconComponent = (LucideIcons[item.iconName as keyof typeof LucideIcons] ?? LucideIcons["Globe"]) as unknown as React.FC<{ className?: string }>;
        return (
          <Link
            key={item.name}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={item.name}
          >
            <IconComponent className="w-4 h-4 text-gray-800 transition-colors dark:text-gray-400 hover:text-primary" />
          </Link>
        );
      })}
    </>
  );
}

export function MadeWith() {
  return (
    <>
      <span className="text-muted-foreground">Made with </span>
      <span className="text-primary">
        <Link href="https://www.docubook.pro" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 text-muted-foreground">
            DocuBook
        </Link></span>
    </>
  );
}

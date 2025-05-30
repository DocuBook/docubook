import Link from "next/link";
import { ModeToggle } from "@/components/theme-toggle";
import docuData from "@/docu.json";
import * as LucideIcons from "lucide-react";

// Define types for docu.json
interface SocialItem {
  name: string;
  url: string;
  iconName: string;
}

interface FooterConfig {
  copyright: string;
  social?: SocialItem[];
}

// Type assertion for docu.json
const docuConfig = docuData as {
  footer: FooterConfig;
};

export function Footer() {
  const { footer } = docuConfig;
  return (
    <footer className="w-full py-8 border-t bg-background">
      <div className="container flex flex-col lg:flex-row items-center justify-between text-sm">
        <div className="flex flex-col items-center lg:items-start justify-start gap-4 w-full lg:w-3/5 text-center lg:text-left">
            <p className="text-muted-foreground">
                Copyright © {new Date().getFullYear()} {footer.copyright} - <MadeWith />
            </p>
            <div className="flex items-center justify-center lg:justify-start gap-6 mt-2 w-full">
                <FooterButtons />
            </div>
        </div>
        <div className="hidden lg:flex items-center justify-end lg:w-2/5">
            <ModeToggle />
        </div>
      </div>
    </footer>
  );
}

export function FooterButtons() {
  const footer = docuConfig?.footer;

  // Jangan render apapun jika tidak ada data sosial
  if (!footer || !Array.isArray(footer.social) || footer.social.length === 0) {
    return null;
  }

  return (
    <>
      {footer.social.map((item) => {
        const IconComponent =
          (LucideIcons[item.iconName as keyof typeof LucideIcons] ??
            LucideIcons["Globe"]) as React.FC<{ className?: string }>;

        return (
          <Link
            key={item.name}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={item.name}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <IconComponent className="w-4 h-4" />
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
        </Link>
        </span>
    </>
  );
}

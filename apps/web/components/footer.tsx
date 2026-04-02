import Link from "next/link";
import { ModeToggle } from "@/components/ThemeToggle";
import docuData from "@/docu.json";
import AuroraText from "@/components/ui/aurora";
import { getSocialIconByName } from "@/lib/icon";

// Define types for docu.json
interface SocialItem {
  name: string;
  url: string;
}

interface FooterConfig {
  copyright: string;
  social?: SocialItem[];
}

// Type assertion for docu.json
const docuConfig = docuData as {
  footer: FooterConfig;
};

interface FooterProps {
  id?: string;
}

export function Footer({ id }: FooterProps) {
  const { footer } = docuConfig;
  return (
    <footer id={id} className="w-full py-8 border-t bg-background">
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

  // Don't render anything if there is no social data
  if (!footer || !Array.isArray(footer.social) || footer.social.length === 0) {
    return null;
  }

  return (
    <>
      {footer.social.map((item) => {
        const IconComponent = getSocialIconByName(item.name);

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
      <span className="text-muted-foreground">Built by </span>
      <span className="text-primary">
        <Link href="https://github.com/gitfromwildan" target="_blank" rel="noopener noreferrer">
          <AuroraText>wildan.dev</AuroraText>
        </Link></span>
    </>
  );
}

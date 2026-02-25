import docuData from "@/docu.json";
import Image from "next/image";
import Link from "next/link";

// Define types for docu.json
interface SponsorItem {
  url: string;
  image: string;
  title: string;
  description?: string;
}

interface NavbarConfig {
  title?: string;
  logo?: {
    light?: string;
    dark?: string;
  };
  links?: Array<{
    title: string;
    href: string;
    external?: boolean;
  }>;
}

interface FooterConfig {
  text?: string;
  links?: Array<{
    title: string;
    href: string;
    external?: boolean;
  }>;
}

interface MetaConfig {
  title?: string;
  description?: string;
  favicon?: string;
  socialBanner?: string;
}

interface RepositoryConfig {
  url: string;
  editUrl?: string;
  branch?: string;
  directory?: string;
}

interface RouteItem {
  title: string;
  href: string;
  noLink?: boolean;
  context?: {
    icon: string;
    description: string;
    title: string;
  };
  items?: RouteItem[];
}

interface RouteConfig {
  title: string;
  href: string;
  noLink?: boolean;
  context?: {
    icon: string;
    description: string;
    title: string;
  };
  items?: RouteItem[];
}

interface DocuConfig {
  sponsor?: {
    title?: string;
    item?: SponsorItem;
  };
  navbar: NavbarConfig;
  footer: FooterConfig;
  meta: MetaConfig;
  repository: RepositoryConfig;
  routes: RouteConfig[];
}

// Type assertion for docu.json
const docuConfig = docuData as DocuConfig;

export function Sponsor() {
  // Safely get sponsor data with optional chaining and default values
  const sponsor = docuConfig?.sponsor || {};
  const item = sponsor?.item;
  
  // Return null if required fields are missing
  if (!item?.url || !item?.image || !item?.title) {
    return null;
  }

  return (
    <div className="mt-4">
      {sponsor?.title && (
        <h2 className="mb-4 text-sm font-medium">{sponsor.title}</h2>
      )}
      <Link
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col justify-center gap-2 p-4 border rounded-lg hover:shadow transition-shadow"
      >
        <div className="relative w-8 h-8 flex-shrink-0">
          <Image
            src={item.image}
            alt={item.title}
            fill
            className="object-contain"
            sizes="32px"
          />
        </div>
        <div className="text-center sm:text-left">
          <h3 className="text-sm font-medium">{item.title}</h3>
          {item.description && (
            <p className="text-muted-foreground text-sm">{item.description}</p>
          )}
        </div>
      </Link>
    </div>
  );
}

export default Sponsor;

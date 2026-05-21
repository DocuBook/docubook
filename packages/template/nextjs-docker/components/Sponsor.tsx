import docuData from "@/docu.json";
import Image from "next/image";
import Link from "next/link";

interface SponsorItem {
  url: string;
  image: string;
  title: string;
  description?: string;
}

const docuConfig = docuData as { sponsor?: { title?: string; item?: SponsorItem } };

export function Sponsor() {
  const sponsor = docuConfig?.sponsor || {};
  const item = sponsor?.item;

  if (!item?.url || !item?.image || !item?.title) {
    return null;
  }

  return (
    <div className="mt-4">
      {sponsor?.title && <h2 className="mb-4 text-sm font-medium">{sponsor.title}</h2>}
      <Link
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col justify-center gap-2 rounded-lg border p-4 transition-shadow hover:shadow"
      >
        <div className="relative h-8 w-8 shrink-0">
          <Image src={item.image} alt={item.title} fill className="object-contain" sizes="32px" />
        </div>
        <div className="text-center sm:text-left">
          <h3 className="text-sm font-medium">{item.title}</h3>
          {item.description && <p className="text-muted-foreground text-sm">{item.description}</p>}
        </div>
      </Link>
    </div>
  );
}

export default Sponsor;

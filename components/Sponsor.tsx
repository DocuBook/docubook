import docuConfig from "@/docu.json";
import Image from "next/image";
import Link from "next/link";

export function Sponsor() {
  const sponsor = docuConfig.sponsor;
  const item = sponsor?.item;

  if (!item) return null;

  return (
    <div className="mt-4">
      <h2 className="mb-4 text-sm font-medium">{sponsor.title || "Sponsor"}</h2>
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
          />
        </div>
        <div className="text-center sm:text-left">
          <h3 className="text-sm font-medium">{item.title}</h3>
          <p className="text-muted-foreground text-sm">{item.description}</p>
        </div>
      </Link>
    </div>
  );
}

export default Sponsor;

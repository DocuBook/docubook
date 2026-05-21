import { getMetadata } from "@/app/layout";
import { AuroraText } from "@/components/ui/aurora";
import { ShineBorder } from "@/components/ui/shine-border";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import docuConfig from "@/docu.json";

export const metadata = getMetadata({
  title: "Showcase",
  description:
    "This is where we highlight the coolest, cleanest, and most creative docs made with Docu.",
});

const cards =
  (
    docuConfig as {
      showcase?: { title: string; description: string; image: string; url: string }[];
    }
  ).showcase ?? [];

export default function Showcase() {
  return (
    <div className="flex flex-col items-center justify-center px-2 py-8 text-center sm:py-36">
      <div className="w-full max-w-[800px] pb-8">
        <AuroraText className="text-lg">Built with Docu</AuroraText>
        <h1 className="mb-4 text-2xl font-bold sm:text-5xl">
          Showcasing Awesome Docs from Our Community
        </h1>
        <p className="text-muted-foreground mb-8 sm:text-xl">
          This is where we highlight the coolest, cleanest, and most creative docs made with Docu.
          Take a scroll, get inspired, and see what is possible when docs meet design.
        </p>
      </div>
      <div className="w-full max-w-7xl">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, index) => (
            <Card
              key={index}
              className="bg-background relative flex h-full max-h-[200px] min-h-[200px] flex-col justify-between overflow-hidden rounded-2xl border p-6 shadow-md"
            >
              <ShineBorder
                shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]}
                className="pointer-events-none z-0"
              />
              <div className="text-left">
                <CardHeader className="mb-4 flex flex-row items-center gap-3 p-0">
                  <Image
                    src={card.image}
                    alt={card.title}
                    width={24}
                    height={24}
                    className="text-primary"
                  />
                  <CardTitle className="text-lg">{card.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground mb-auto space-y-2 p-0 text-sm">
                  <p className="line-clamp-2">{card.description}</p>
                </CardContent>
              </div>
              <CardFooter className="mt-auto flex items-end justify-between p-0">
                <Link href={card.url} target="_blank">
                  <InteractiveHoverButton className="text-sm">Visit Website</InteractiveHoverButton>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

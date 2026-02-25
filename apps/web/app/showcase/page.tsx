import { getMetadata } from "@/app/layout";
import { AuroraText } from "@/components/ui/aurora";
import { ShineBorder } from "@/components/ui/shine-border";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";

export const metadata = getMetadata({
  title: "Showcase",
  description: "This is where we highlight the coolest, cleanest, and most creative docs made with Docu.",
});

const cards = [
  {
    icon: (
        <Image
          src="/images/tutoraddons.svg"
          alt="Tutor Addons"
          width={24}
          height={24}
          className="text-primary"
        />
      ),
    title: "Tutor Addons",
    desc: "Supercharge Your TutorLMS With Powerful Addons like Payment Gateway, Affiliates, and more.",
    url: "https://docs.tutoraddons.com/",
  },
  {
    icon: (
        <Image
          src="/images/addonpro.svg"
          alt="Addon Sejoli Pro"
          width={24}
          height={24}
          className="text-primary"
        />
      ),
    title: "Addon Sejoli Pro",
    desc: "Functions for the sejoli plugin from custom member areas, orders manager, tracking UTM, courses and invoices.",
    url: "https://docs.addonsejoli.pro/",
  },
  {
    icon: (
        <Image
          src="/images/docu.svg"
          alt="Docu Starter"
          width={24}
          height={24}
          className="text-primary"
        />
      ),
    title: "Docu Starter",
    desc: "An open-source Software Mintlify / Gitbook / Docusaurus alternative. Free forever with no feature limitations.",
    url: "https://demo.docubook.pro/",
  },
];

export default function Showcase() {
  return (
    <div className="flex flex-col items-center justify-center px-2 py-8 text-center sm:py-36">
        <div className="w-full max-w-[800px] pb-8">
            <AuroraText className="text-lg">Built with Docu</AuroraText>
            <h1 className="mb-4 text-2xl font-bold sm:text-5xl">
            Showcasing Awesome Docs from Our Community
            </h1>
            <p className="mb-8 sm:text-xl text-muted-foreground">
            This is where we highlight the coolest, cleanest, and most creative docs made with Docu. Take a scroll, get inspired, and see what is possible when docs meet design.
            </p>
        </div>
        <div className="w-full max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card, index) => (
                <Card
                    key={index}
                    className="relative overflow-hidden flex flex-col justify-between h-full p-6 rounded-2xl shadow-md border bg-background min-h-[200px] max-h-[200px]"
                    >
                <ShineBorder
                    shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]}
                    className="pointer-events-none z-0"/>
                <div className="text-left">
                    <CardHeader className="flex flex-row items-center gap-3 p-0 mb-4">
                        {card.icon}
                        <CardTitle className="text-lg">{card.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 text-sm text-muted-foreground space-y-2 mb-auto">
                        <p className="line-clamp-2">{card.desc}</p>
                    </CardContent>
                </div>
                    <CardFooter className="mt-auto flex justify-between items-end p-0">
                        <Link
                            href={card.url} target="_blank">
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

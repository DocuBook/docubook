import { PropsWithChildren } from "react";
import { getMetadata } from "@/app/layout";

export const metadata = getMetadata({
    title: "Playground",
    description: "Test and experiment with DocuBook markdown components in real-time",
    image: "img-playground.png",
  });

export default function PlaygroundLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex flex-col min-h-screen">
      {children}
    </div>
  );
}

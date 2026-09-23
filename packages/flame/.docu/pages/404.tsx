import { BackgroundBlobs, Hero } from "../components/home";
import { servedBasePath } from "../node/paths";

export default function NotFoundPage() {
  return (
    <main className="bg-base-100 relative isolate flex min-h-screen w-full items-center justify-center overflow-hidden">
      <BackgroundBlobs />
      <Hero
        hero={{
          headline: "404",
          description: "Page not found",
          actions: [{ text: "Go to Docs", link: `${servedBasePath()}/` }],
        }}
      />
    </main>
  );
}

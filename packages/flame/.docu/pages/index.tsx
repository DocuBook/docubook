import { loadDocuConfig } from "../node/paths";
import { docsHtmlHref, isExternalUrl } from "../node/utils";
import { Hero, Features } from "../components/home";
import type { HomeFeature } from "../node/types";

const docuConfig = loadDocuConfig();

interface RouteContext {
  icon?: string;
  title?: string;
  description?: string;
}

interface RouteItem {
  title: string;
  href: string;
  context?: RouteContext;
  items?: RouteItem[];
}

export default function IndexPage() {
  const { meta, home } = docuConfig;
  const routes = (docuConfig.routes as RouteItem[]) || [];

  // Docs pages under /docs/ are flat .html files; the root /docs is
  // docs/index.html via directory index — no .html suffix needed.
  const linkWithHtml = (link: string) => {
    if (isExternalUrl(link)) return link;
    if (link.startsWith("/docs/")) return `${link}.html`;
    return link;
  };

  // Use home.features if configured, otherwise fallback to routes with context
  const features: HomeFeature[] =
    home?.features?.map((f) => ({
      ...f,
      link: f.link ? linkWithHtml(f.link) : undefined,
    })) ||
    routes
      .filter((r) => r.context)
      .map((route) => ({
        icon: route.context?.icon,
        title: route.context?.title || route.title,
        description: route.context?.description || "",
        link: docsHtmlHref(`/docs${route.href}${route.items?.[0]?.href || ""}`),
      }));

  // Use home.hero if configured, otherwise fallback to meta
  const hero = home?.hero
    ? {
        ...home.hero,
        actions: home.hero.actions?.map((a) => ({
          ...a,
          link: linkWithHtml(a.link),
        })),
      }
    : {
        headline: meta.title,
        description: meta.description,
      };

  return (
    <div className="bg-base-100 relative isolate min-h-screen overflow-hidden">
      <div className="absolute right-4 top-4 z-10" id="theme-island" />

      {/* Background gradient blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 -translate-x-1/2 blur-3xl sm:-top-80"
      >
        <div
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
          className="from-primary to-accent h-[40rem] w-[80rem] bg-gradient-to-tr opacity-20"
        />
      </div>

      {/* Hero Section */}
      <Hero hero={hero} />

      {/* Features Section */}
      <Features features={features} />

      {/* Bottom gradient blob */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/2 -z-10 translate-x-1/4 blur-3xl"
      >
        <div
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
          className="from-accent to-primary h-[30rem] w-[70rem] bg-gradient-to-tr opacity-20"
        />
      </div>
    </div>
  );
}

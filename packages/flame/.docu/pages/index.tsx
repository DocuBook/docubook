import { loadDocuConfig } from "../node/paths";
import { docsHtmlHref, isExternalUrl } from "../node/utils";
import { Hero, Features, BackgroundBlobs } from "../components/home";
import { ThemeToggle } from "../components/Theme";
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
      <div className="absolute top-4 right-4 z-10">
        <div id="theme-toggle-island">
          <ThemeToggle />
        </div>
      </div>

      <BackgroundBlobs />

      {/* Hero Section */}
      <Hero hero={hero} />

      {/* Features Section */}
      <Features features={features} />
    </div>
  );
}

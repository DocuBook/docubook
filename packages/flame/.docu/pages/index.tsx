import * as icons from "lucide-react";
import docuConfig from "../../docu.json" with { type: "json" };

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
  const { meta } = docuConfig;
  const routes = (docuConfig.routes as RouteItem[]) || [];
  const cards = routes.filter((r) => r.context);

  return (
    <div className="bg-base-100 relative isolate min-h-screen">
      <div className="absolute top-4 right-4 z-10" id="theme-island" />

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

      {/* Hero */}
      <div className="mx-auto max-w-2xl py-32 sm:py-44">
        <div className="text-center">
          <h1 className="text-5xl font-semibold tracking-tight text-balance sm:text-7xl">
            {meta.title}
          </h1>
          <p className="text-muted-foreground mt-8 text-lg text-pretty sm:text-xl">
            {meta.description}
          </p>
        </div>
      </div>

      {/* Showcase Cards */}
      {cards.length > 0 && (
        <div className="relative mx-auto max-w-4xl px-6 pb-24">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {cards.map((route) => {
              const Icon = (icons as unknown as Record<string, icons.LucideIcon>)[
                route.context!.icon || ""
              ];
              return (
                <a
                  key={route.href}
                  href={`/docs${route.href}${route.items?.[0]?.href || ""}`}
                  className="group"
                >
                  <div className="border-primary/20 bg-primary/5 group-hover:border-primary/40 relative flex aspect-[16/9] items-center justify-center overflow-hidden rounded-2xl border transition">
                    {/* Grid pattern */}
                    <svg
                      className="absolute inset-0 h-full w-full"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <defs>
                        <pattern
                          id={`grid-${route.href}`}
                          width="40"
                          height="40"
                          patternUnits="userSpaceOnUse"
                        >
                          <path
                            d="M 40 0 L 0 0 0 40"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="0.5"
                            className="text-primary/15"
                          />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill={`url(#grid-${route.href})`} />
                    </svg>
                    {Icon && (
                      <Icon className="text-primary relative z-10" size={80} strokeWidth={1} />
                    )}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">
                    {route.context!.title || route.title}
                  </h3>
                  <p className="text-muted-foreground text-m mt-1">{route.context!.description}</p>
                </a>
              );
            })}
          </div>
        </div>
      )}

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

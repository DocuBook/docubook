import { BookOpen, House } from "lucide-react";
import { BackgroundBlobs } from "../components/home";
import { loadDocuConfig, servedBasePath, servedDeployPath } from "../node/paths";
import { cn, docsAssetSrc } from "../node/utils";

/**
 * The generated 404 page.
 *
 * Rendered to static HTML with no client script (the `notFound` page family
 * ships CSS only), so every motion here is CSS. The host serves this file at
 * whatever URL was requested, which is why every URL on it is root-absolute.
 *
 * The mascot is the project's own logo (`navbar.logo` in docu.json) as an
 * `<img>`, animated with CSS transforms. That keeps it light — the file is
 * already part of the site and cached — and safe: an SVG loaded through
 * `<img>` cannot run scripts, unlike one inlined into the page. Without a
 * logo, a small inline illustration takes its place.
 */

function siteLogoSrc(): string | undefined {
  try {
    const src = loadDocuConfig().navbar?.logo?.src;
    return src ? docsAssetSrc(src, servedBasePath(), servedDeployPath()) : undefined;
  } catch {
    return undefined;
  }
}

/** Fallback mascot: a lost page with a question mark. */
function LostPageIllustration() {
  return (
    <svg
      viewBox="0 0 120 140"
      className="text-primary h-28 w-24 sm:h-32 sm:w-28"
      fill="none"
      stroke="currentColor"
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path
        d="M22 8h52l30 30v86a8 8 0 0 1-8 8H22a8 8 0 0 1-8-8V16a8 8 0 0 1 8-8z"
        className="fill-base-100"
      />
      <path d="M74 8v22a8 8 0 0 0 8 8h22" />
      <path d="M46 72a14 14 0 1 1 20 12.6c-4 2-6 4.6-6 8.4v3" />
      <circle cx="60" cy="110" r="1.5" fill="currentColor" />
    </svg>
  );
}

/** A small question mark that rises and fades around the mascot. */
function FloatingMark({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn(
        "text-primary/60 motion-safe:animate-mascot-drift absolute h-5 w-5 opacity-0",
        className
      )}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M9 9a3 3 0 1 1 4.2 2.75c-.75.35-1.2 1-1.2 1.85V14" />
      <circle cx="12" cy="18" r="0.6" fill="currentColor" />
    </svg>
  );
}

function Mascot({ logoSrc }: { logoSrc?: string }) {
  return (
    <div
      className="relative flex h-44 w-44 items-center justify-center sm:h-52 sm:w-52"
      aria-hidden="true"
    >
      {/* Soft halo, pulsing slowly behind the mascot. */}
      <div className="bg-primary/10 motion-safe:animate-mascot-halo absolute inset-6 rounded-full" />
      {/* The delays share the `motion-safe:` variant with the animation: Tailwind
          then emits them after the `animation` shorthand, which would otherwise
          reset `animation-delay` to 0s and make all three rise together. */}
      <FloatingMark className="top-4 left-6" />
      <FloatingMark className="top-10 right-4 motion-safe:[animation-delay:1.6s]" />
      <FloatingMark className="top-2 right-14 motion-safe:[animation-delay:3.2s]" />
      {/* The mascot floats and looks around; its shadow shrinks as it rises. */}
      <div className="motion-safe:animate-mascot-float relative">
        {logoSrc ? (
          <img
            src={logoSrc}
            alt=""
            width={112}
            height={112}
            decoding="async"
            className="h-24 w-24 object-contain drop-shadow-xl sm:h-28 sm:w-28"
          />
        ) : (
          <LostPageIllustration />
        )}
      </div>
      <div className="bg-base-content/20 motion-safe:animate-mascot-shadow absolute bottom-3 h-3 w-20 rounded-[50%] blur-sm" />
    </div>
  );
}

function ActionLink({
  href,
  icon,
  label,
  variant,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  variant: "primary" | "ghost";
}) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors",
        "focus-visible:ring-primary focus-visible:ring-offset-base-100 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
        variant === "primary"
          ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
          : "border-base-300 text-base-content hover:bg-base-200 border"
      )}
    >
      {icon}
      {label}
    </a>
  );
}

export default function NotFoundPage() {
  const deployPath = servedDeployPath();
  const homeHref = `${deployPath}/`;
  const docsHref = `${deployPath}${servedBasePath()}/`;
  // At a root deployment the docs and the home page share `/`: one button.
  const sameTarget = docsHref === homeHref;
  const iconClass = "h-4 w-4 shrink-0";

  return (
    <main className="bg-base-100 text-base-content relative isolate flex min-h-screen w-full items-center justify-center overflow-hidden px-6">
      <BackgroundBlobs />
      <div className="mx-auto flex w-full max-w-xl flex-col items-center py-20 text-center">
        <Mascot logoSrc={siteLogoSrc()} />
        <h1 className="from-primary to-accent mt-8 bg-gradient-to-br bg-clip-text text-7xl font-bold tracking-tight text-transparent sm:text-8xl">
          404
        </h1>
        <p className="mt-4 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          Page not found
        </p>
        <p className="text-muted-foreground mt-3 max-w-md text-base text-pretty">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="mt-10 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center">
          {sameTarget ? (
            <ActionLink
              href={homeHref}
              icon={<House className={iconClass} aria-hidden="true" />}
              label="Back to home"
              variant="primary"
            />
          ) : (
            <>
              <ActionLink
                href={docsHref}
                icon={<BookOpen className={iconClass} aria-hidden="true" />}
                label="Go to docs"
                variant="primary"
              />
              <ActionLink
                href={homeHref}
                icon={<House className={iconClass} aria-hidden="true" />}
                label="Back to home"
                variant="ghost"
              />
            </>
          )}
        </div>
      </div>
    </main>
  );
}

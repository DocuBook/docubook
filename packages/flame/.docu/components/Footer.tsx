import Social from "./Social";

export function Footer() {
  return (
    <footer className="text-muted-foreground mt-auto flex w-full flex-col items-start gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
      <Social />
      <aside className="sm:ml-auto">
        <p className="text-xs">
          Made with{" "}
          <a
            href="https://docubook.pro"
            target="_blank"
            rel="noopener noreferrer"
            className="link link-hover text-muted-foreground font-medium"
          >
            DocuBook
          </a>
        </p>
      </aside>
    </footer>
  );
}

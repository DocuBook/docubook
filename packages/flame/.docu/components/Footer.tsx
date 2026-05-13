import Social from "./Social";

export function Footer() {
  return (
    <footer className="footer footer-center bg-base-200 text-base-content border-base-300 border-t p-6">
      <div className="flex w-full max-w-4xl items-center justify-between">
        <Social />
        <aside>
          <p>
            Made with{" "}
            <a
              href="https://docubook.pro"
              target="_blank"
              rel="noopener noreferrer"
              className="link link-hover font-semibold"
            >
              DocuBook
            </a>
          </p>
        </aside>
      </div>
    </footer>
  );
}

import Social from "./Social";

export function Footer() {
    return (
        <footer className="footer footer-center p-6 bg-base-200 text-base-content border-base-300 border-t">
            <div className="flex items-center justify-between w-full max-w-4xl">
                <Social />
                <aside>
                    <p>
                        Made with {" "}
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
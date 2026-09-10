export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center px-4 py-8">
      <div className="bg-base-100 border-base-300 flex min-h-[50vh] w-full max-w-5xl flex-col items-center justify-center rounded-xl border shadow-md">
        <h1 className="text-6xl font-bold">404</h1>
        <p className="text-base-content/60 py-4 text-xl">Page not found</p>
        <a
          href="/docs/"
          className="bg-primary text-primary-foreground mt-2 rounded-lg px-4 py-2 font-medium"
        >
          Go to Docs
        </a>
      </div>
    </main>
  );
}

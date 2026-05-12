export default function NotFoundPage() {
  return (
    <div className="hero bg-base-100 min-h-screen">
      <div className="hero-content text-center">
        <div className="max-w-md">
          <h1 className="text-6xl font-bold">404</h1>
          <p className="text-base-content/70 py-4 text-xl">Page not found</p>
          <a href="/docs/" className="btn btn-primary">
            Go to Docs
          </a>
        </div>
      </div>
    </div>
  );
}

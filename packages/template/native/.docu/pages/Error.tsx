interface ErrorPageProps {
  message?: string;
}

export default function ErrorPage({ message }: ErrorPageProps) {
  return (
    <div className="hero bg-base-100 min-h-screen">
      <div className="hero-content text-center">
        <div className="max-w-md">
          <h1 className="text-error text-5xl font-bold">Error</h1>
          <p className="text-base-content/70 py-4">{message || "Something went wrong."}</p>
          <a href="/docs/" className="btn btn-primary">
            Go to Docs
          </a>
        </div>
      </div>
    </div>
  );
}

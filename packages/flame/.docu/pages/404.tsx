export default function NotFoundPage() {
  return (
    <div className="flex w-full flex-1 px-0 pb-4 lg:h-[calc(100vh-4rem)] lg:px-8 lg:pb-8">
      <div className="bg-base-100 border-base-300 flex w-full flex-col items-center justify-center rounded-b-3xl border shadow-md lg:rounded-xl">
        <h1 className="text-6xl font-bold">404</h1>
        <p className="text-base-content/60 py-4 text-xl">Page not found</p>
        <a href="/docs/" className="btn btn-primary mt-2">
          Go to Docs
        </a>
      </div>
    </div>
  );
}

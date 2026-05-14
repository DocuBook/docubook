import docuConfig from "../../docu.json" with { type: "json" };

export default function IndexPage() {
  const { meta } = docuConfig;

  return (
    <div className="hero bg-base-100 relative min-h-screen">
      <div className="absolute top-4 right-4" id="theme-island" />
      <div className="hero-content text-center">
        <div className="max-w-md">
          <h1 className="text-5xl font-bold">{meta.title}</h1>
          <p className="text-base-content/70 py-6">{meta.description}</p>
          <a href="/docs/getting-started/introduction" className="btn btn-primary">
            Get Started
          </a>
        </div>
      </div>
    </div>
  );
}

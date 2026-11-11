// Copy from the "DocuBook — Deploy" frame in docubook.pen. Facts mirror packages/flame/docs/getting-started/deployment.mdx.
export const buildSteps = {
  comments: [
    "# 01  Build the site",
    "# 02  Everything lands in one folder",
    "# 03  Or let Flame set up GitHub Pages",
  ],
  runtimes: [
    { name: "Bun", commands: ["bun run build", "ls .docu/dist", "bun run deploy"] },
    { name: "Node.js", commands: ["npm run build", "ls .docu/dist", "npm run deploy"] },
    { name: "Deno", commands: ["deno task build", "ls .docu/dist", "deno task deploy"] },
  ],
};

// One group per tier of the podium, top to bottom. `tag` is the tier's label in the drawing.
export const hostGroups = [
  {
    label: "Zero configuration",
    tag: "Zero config",
    title: "Upload the folder.",
    description:
      "These hosts drop the .html suffix on their own. Deploy the build output as it is.",
    hosts: [
      { name: "Cloudflare Pages", config: "none" },
      { name: "AWS Amplify Hosting", config: "none" },
      { name: "GitHub Pages", config: "flame deploy" },
    ],
    chips: ["Clean URLs: automatic"],
  },
  {
    label: "One config file",
    tag: "One config file",
    title: "Turn on clean URLs.",
    description: "Clean URLs are one setting away. The file sits at the root of your repository.",
    hosts: [
      { name: "Vercel", config: "vercel.json" },
      { name: "Netlify", config: "netlify.toml" },
      { name: "Firebase Hosting", config: "firebase.json" },
      { name: "Azure Static Web Apps", config: "staticwebapp.config.json" },
      { name: "Render", config: "dashboard rule" },
      { name: "Heroku", config: "static.json" },
    ],
    chips: ["Clean URLs: yes"],
  },
  {
    label: "Docker",
    tag: "Docker",
    title: "Ship an image.",
    description:
      "flame deploy --docker writes a Dockerfile, an nginx.conf and a .dockerignore for any host that runs images.",
    hosts: [
      { name: "Coolify", config: "Dockerfile" },
      { name: "Fly.io", config: "fly deploy" },
      { name: "Railway", config: "auto-detect" },
      { name: "VPS", config: "docker run" },
    ],
    chips: ["nginx", "--ci builds on push"],
  },
];

export const subpathConfig = `{
  "meta": {
    "title": "Acme Docs",
    "baseURL": "https://acme.github.io/handbook",
    "basePath": "/docs"
  }
}`;

---
"@docubook/flame": patch
---

Fix navigation on sites hosted under a path, such as a GitHub Pages project site (`meta.baseURL: "https://acme.github.io/handbook"`). Sidebar, navbar, pagination, logo, landing and 404 links now include the deployment path instead of pointing at the origin root, the client sidebar renders and highlights the active page again, and the dev server keeps serving deployment-free links. Node and Deno builds now fail with a clear error if a server module leaks into the browser bundle, instead of shipping pages that crash on load.

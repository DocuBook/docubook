import { runDeploy } from "./deploy.shared";

try {
  await runDeploy();
} catch (err) {
  console.error("Deploy failed:", err);
  process.exit(1);
}
// See build.deno.ts — react-dom/server's browser build keeps Deno's event
// loop alive after the in-process build; force a clean exit.
process.exit(0);

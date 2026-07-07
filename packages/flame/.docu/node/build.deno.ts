import { runBuildCli } from "./build.impl";

await runBuildCli();
// Deno resolves react-dom/server to server.browser.js (its `deno` export
// condition), which opens a module-scope MessageChannel that keeps the event
// loop alive after the build completes — force a clean exit.
process.exit(0);

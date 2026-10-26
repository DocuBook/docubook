/* global process */
/**
 * Supervisor for `flame dev` in a workspace checkout.
 *
 * The dev server loads sibling @docubook packages from their built `dist/`
 * for server rendering and the client bundle. When one of them is rebuilt
 * (`vite build --watch`), the dev server exits with DEV_RESTART_EXIT_CODE
 * (see `.docu/node/dev-watch.ts`) and this supervisor starts a fresh one, so
 * SSR and the browser bundle load the new code together.
 *
 * Only used when a sibling package is linked from a workspace — projects that
 * install flame from npm run the dev server in-process as before.
 */
import { spawn } from "node:child_process";
import { realpathSync } from "node:fs";
import { createRequire } from "node:module";
import { constants } from "node:os";
import { sep } from "node:path";

/** Keep in sync with DEV_RESTART_EXIT_CODE in `.docu/node/dev-watch.ts`. */
export const DEV_RESTART_EXIT_CODE = 75;

/** Keep in sync with DEV_SUPERVISED_ENV in `.docu/node/dev-watch.ts`. */
export const DEV_SUPERVISED_ENV = "FLAME_DEV_SUPERVISED";

/** Keep in sync with WATCHED_PACKAGES in `.docu/node/dev-watch.ts`. */
export const WATCHED_PACKAGES = [
  "@docubook/core",
  "@docubook/markdown",
  "@docubook/ui-react",
  "@docubook/themes-colors",
];

/**
 * True when any of `names` resolves outside `node_modules` from `fromUrl`,
 * i.e. it is linked from a workspace and can be rebuilt while dev runs.
 */
export function hasWorkspacePackages(fromUrl, names = WATCHED_PACKAGES) {
  const require = createRequire(fromUrl);
  return names.some((name) => {
    try {
      return !realpathSync(require.resolve(name)).split(sep).includes("node_modules");
    } catch {
      return false;
    }
  });
}

/**
 * Run `command args` with stdio inherited and start it again whenever it exits
 * with DEV_RESTART_EXIT_CODE. SIGINT/SIGTERM are forwarded and end supervision.
 * Resolves with the exit code to finish with.
 */
export function superviseDev(command, args, { env = process.env, onRestart } = {}) {
  return new Promise((resolve) => {
    let child = null;
    let stopping = false;

    const forward = (signal) => {
      stopping = true;
      // A terminal Ctrl+C already reaches the child through the process group;
      // forwarding covers a signal sent to this process alone.
      if (child && child.exitCode === null && child.signalCode === null) child.kill(signal);
    };
    const onSigint = () => forward("SIGINT");
    const onSigterm = () => forward("SIGTERM");
    process.on("SIGINT", onSigint);
    process.on("SIGTERM", onSigterm);

    const finish = (code) => {
      process.off("SIGINT", onSigint);
      process.off("SIGTERM", onSigterm);
      resolve(code);
    };

    const start = () => {
      child = spawn(command, args, {
        stdio: "inherit",
        env: { ...env, [DEV_SUPERVISED_ENV]: "1" },
      });
      child.on("error", (error) => {
        console.error(`flame: failed to start the dev server: ${error.message}`);
        finish(1);
      });
      child.on("exit", (code, signal) => {
        if (code === DEV_RESTART_EXIT_CODE && !stopping) {
          onRestart?.();
          start();
          return;
        }
        if (code !== null) finish(code);
        else finish(signal ? 128 + (constants.signals[signal] ?? 0) : 1);
      });
    };

    start();
  });
}

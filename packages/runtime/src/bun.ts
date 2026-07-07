import type { FetchHandler, RuntimeAdapter, ServerOptions } from "./types.js";

/** Minimal ambient view of the Bun global — only what the adapter touches. */
declare const Bun: {
  serve(options: { port: number; hostname?: string; idleTimeout?: number; fetch: FetchHandler }): {
    port?: number;
    hostname?: string;
    stop(closeActiveConnections?: boolean): void | Promise<void>;
  };
};

export const bunAdapter: RuntimeAdapter = {
  name: "bun",

  serve(fetch: FetchHandler, options: ServerOptions) {
    const server = Bun.serve({
      port: options.port,
      hostname: options.hostname,
      idleTimeout: options.idleTimeout,
      fetch,
    });
    return {
      port: server.port ?? options.port,
      hostname: server.hostname ?? options.hostname ?? "localhost",
      stop: () => server.stop(),
    };
  },
};

import type { FetchHandler, RuntimeAdapter, ServerOptions } from "./types.js";

/** Minimal ambient view of the Deno global — only what the adapter touches. */
declare const Deno: {
  serve(
    options: { port?: number; hostname?: string; onListen?: (addr: unknown) => void },
    handler: (req: Request) => Response | Promise<Response>
  ): {
    addr: { port: number; hostname: string };
    shutdown(): Promise<void>;
  };
};

export const denoAdapter: RuntimeAdapter = {
  name: "deno",

  serve(fetch: FetchHandler, options: ServerOptions) {
    const server = Deno.serve(
      {
        port: options.port,
        hostname: options.hostname,
        onListen: () => {
          // Suppress Deno's default "Listening on ..." log; callers print their own.
        },
      },
      fetch
    );
    return {
      port: server.addr.port,
      hostname: server.addr.hostname,
      stop: () => server.shutdown(),
    };
  },
};

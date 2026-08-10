export interface ServerOptions {
  port: number;
  hostname?: string;
  /** Seconds a connection may stay idle before being closed. */
  idleTimeout?: number;
}

export interface ServerHandle {
  port: number;
  hostname: string;
  stop(): void | Promise<void>;
}

export type FetchHandler = (req: Request) => Response | Promise<Response>;

export interface RuntimeAdapter {
  name: string;
  serve(fetch: FetchHandler, options: ServerOptions): ServerHandle | Promise<ServerHandle>;
}

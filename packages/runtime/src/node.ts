import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { FetchHandler, RuntimeAdapter, ServerHandle, ServerOptions } from "./types";

function toWebRequest(req: IncomingMessage, port: number, hostname: string): Request {
  const host = req.headers.host ?? `${hostname}:${port}`;
  const url = `http://${host}${req.url ?? "/"}`;
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v);
    } else {
      headers.set(key, value);
    }
  }
  const method = req.method ?? "GET";
  const hasBody = method !== "GET" && method !== "HEAD";
  return new Request(url, {
    method,
    headers,
    // IncomingMessage is an async iterable of Buffer chunks; Request accepts
    // an async iterable body when half-duplex is declared.
    body: hasBody ? (req as unknown as BodyInit) : undefined,
    // @ts-expect-error -- required by undici for streaming request bodies
    duplex: hasBody ? "half" : undefined,
  });
}

async function writeResponse(response: Response, res: ServerResponse): Promise<void> {
  const headers: Record<string, string | string[]> = {};
  const setCookie = response.headers.getSetCookie?.() ?? [];
  response.headers.forEach((value, key) => {
    if (key === "set-cookie") return;
    headers[key] = value;
  });
  if (setCookie.length > 0) headers["set-cookie"] = setCookie;

  // Flush headers immediately so streaming responses (SSE) reach the client
  // before the first body chunk.
  res.writeHead(response.status, headers);

  if (!response.body) {
    res.end();
    return;
  }

  const reader = response.body.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      // Incremental piping — never buffer the full body (SSE streams forever).
      const ok = res.write(value);
      if (!ok) await new Promise<void>((resolve) => res.once("drain", resolve));
    }
    res.end();
  } catch {
    // Client disconnected mid-stream; cancel the source.
    await reader.cancel().catch(() => {});
    res.destroy();
  }
}

export const nodeAdapter: RuntimeAdapter = {
  name: "node",

  serve(fetch: FetchHandler, options: ServerOptions): Promise<ServerHandle> {
    const hostname = options.hostname ?? "localhost";

    const server = createServer((req, res) => {
      Promise.resolve()
        .then(() => fetch(toWebRequest(req, options.port, hostname)))
        .then((response) => writeResponse(response, res))
        .catch((err) => {
          console.error(err);
          if (!res.headersSent) {
            res.writeHead(500, { "Content-Type": "text/plain" });
          }
          res.end("Internal Server Error");
        });
    });

    if (options.idleTimeout !== undefined) {
      server.timeout = options.idleTimeout * 1000;
      // keepAliveTimeout must not undercut idleTimeout or Node closes
      // long-lived SSE connections early.
      server.keepAliveTimeout = options.idleTimeout * 1000;
    }

    return new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(options.port, () => {
        const address = server.address();
        const port = typeof address === "object" && address ? address.port : options.port;
        resolve({
          port,
          hostname,
          stop: () =>
            new Promise<void>((res2, rej2) => {
              server.closeAllConnections?.();
              server.close((err) => (err ? rej2(err) : res2()));
            }),
        });
      });
    });
  },
};

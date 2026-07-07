import { afterEach, describe, expect, it } from "vitest";
import { nodeAdapter } from "../node.js";
import type { ServerHandle } from "../types.js";

let handle: ServerHandle | null = null;

afterEach(async () => {
  if (handle) {
    await handle.stop();
    handle = null;
  }
});

describe("nodeAdapter", () => {
  it("serves a basic GET request with status, headers, and body", async () => {
    handle = await nodeAdapter.serve(
      () => new Response("hello", { status: 201, headers: { "X-Test": "yes" } }),
      { port: 0 }
    );

    const res = await fetch(`http://localhost:${handle.port}/`);
    expect(res.status).toBe(201);
    expect(res.headers.get("x-test")).toBe("yes");
    expect(await res.text()).toBe("hello");
  });

  it("constructs a Request with method, url, headers, and body", async () => {
    let seen: { method: string; pathname: string; header: string | null; body: string } | null =
      null;
    handle = await nodeAdapter.serve(
      async (req) => {
        seen = {
          method: req.method,
          pathname: new URL(req.url).pathname,
          header: req.headers.get("x-custom"),
          body: await req.text(),
        };
        return new Response("ok");
      },
      { port: 0 }
    );

    await fetch(`http://localhost:${handle.port}/some/path?q=1`, {
      method: "POST",
      headers: { "X-Custom": "value", "Content-Type": "text/plain" },
      body: "payload",
    });

    expect(seen).toEqual({
      method: "POST",
      pathname: "/some/path",
      header: "value",
      body: "payload",
    });
  });

  it("streams response chunks incrementally (SSE)", async () => {
    let controller!: ReadableStreamDefaultController<Uint8Array>;
    handle = await nodeAdapter.serve(
      () => {
        const stream = new ReadableStream<Uint8Array>({
          start(c) {
            controller = c;
            c.enqueue(new TextEncoder().encode("data: connected\n\n"));
          },
        });
        return new Response(stream, { headers: { "Content-Type": "text/event-stream" } });
      },
      { port: 0 }
    );

    const res = await fetch(`http://localhost:${handle.port}/__hmr`);
    expect(res.headers.get("content-type")).toBe("text/event-stream");

    const reader = res.body!.getReader();
    const first = await reader.read();
    expect(new TextDecoder().decode(first.value)).toContain("data: connected");

    // A later chunk must arrive without the stream having been closed first —
    // proves the bridge pipes incrementally instead of buffering.
    controller.enqueue(new TextEncoder().encode("data: reload\n\n"));
    const second = await reader.read();
    expect(new TextDecoder().decode(second.value)).toContain("data: reload");

    controller.close();
    await reader.cancel();
  });

  it("resolves an ephemeral port and stops cleanly", async () => {
    handle = await nodeAdapter.serve(() => new Response("ok"), { port: 0 });
    expect(handle.port).toBeGreaterThan(0);
    await handle.stop();
    await expect(fetch(`http://localhost:${handle.port}/`)).rejects.toThrow();
    handle = null;
  });
});

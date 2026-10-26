import { afterEach, describe, expect, it } from "vitest";
import { enqueueClientBuild } from "../node/hydrate.node";

const savedEnv = process.env.NODE_ENV;

afterEach(() => {
  if (savedEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = savedEnv;
});

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => (resolve = r));
  return { promise, resolve };
}

describe("enqueueClientBuild", () => {
  it("does not start a build while another is still running", async () => {
    const order: string[] = [];
    const gate = deferred();
    const first = enqueueClientBuild(async () => {
      order.push("first:start");
      await gate.promise;
      order.push("first:end");
      return 1;
    });
    const second = enqueueClientBuild(async () => {
      order.push("second:start");
      return 2;
    });
    await new Promise((r) => setTimeout(r, 10));
    expect(order).toEqual(["first:start"]);
    gate.resolve();
    expect(await Promise.all([first, second])).toEqual([1, 2]);
    expect(order).toEqual(["first:start", "first:end", "second:start"]);
  });

  it("keeps going after a failed build", async () => {
    const failed = enqueueClientBuild(async () => {
      throw new Error("boom");
    });
    const next = enqueueClientBuild(async () => "ok");
    await expect(failed).rejects.toThrow("boom");
    await expect(next).resolves.toBe("ok");
  });

  // Each dev rebuild saves NODE_ENV, lets Vite set "production", then restores
  // it. Overlapping rebuilds used to capture a sibling's leaked value and pin it.
  it("leaves NODE_ENV restored after rapid successive builds", async () => {
    delete process.env.NODE_ENV;
    const viteLikeBuild = () =>
      enqueueClientBuild(async () => {
        const before = process.env.NODE_ENV;
        try {
          process.env.NODE_ENV ??= "production";
          await new Promise((r) => setTimeout(r, 5));
          return before;
        } finally {
          if (before === undefined) delete process.env.NODE_ENV;
          else process.env.NODE_ENV = before;
        }
      });
    const seen = await Promise.all([viteLikeBuild(), viteLikeBuild(), viteLikeBuild()]);
    expect(seen).toEqual([undefined, undefined, undefined]);
    expect(process.env.NODE_ENV).toBeUndefined();
  });
});

import { describe, expect, it } from "vitest";
import { isRemoteReference, resolveOptions } from "../options";

describe("resolveOptions", () => {
  it("fills defaults for missing options", () => {
    expect(resolveOptions(undefined)).toEqual({
      layout: "card",
      logo: undefined,
      siteName: undefined,
      pages: { docs: true, index: true, home: true },
      fonts: [],
    });
  });

  it("keeps valid options", () => {
    expect(
      resolveOptions({
        layout: "minimal",
        logo: false,
        siteName: "Acme",
        pages: { home: false },
        fonts: [{ path: "fonts/NotoSans.ttf", weight: 400, style: "normal" }],
      })
    ).toEqual({
      layout: "minimal",
      logo: false,
      siteName: "Acme",
      pages: { docs: true, index: true, home: false },
      fonts: [{ path: "fonts/NotoSans.ttf", weight: 400, style: "normal" }],
    });
  });

  it.each([
    [[], /options must be an object/],
    [{ layot: "card" }, /unknown option "layot"/],
    [{ layout: "github" }, /"layout" must be one of "card", "minimal"/],
    [{ logo: "" }, /"logo" must be a file path or false/],
    [{ logo: true }, /"logo" must be a file path or false/],
    [{ logo: "https://cdn.example.com/logo.svg" }, /must be a local file/],
    [{ logo: "data:image/svg+xml;base64,AAAA" }, /must be a local file/],
    [{ siteName: " " }, /"siteName" must be a non-empty string/],
    [{ pages: true }, /"pages" must be an object/],
    [{ pages: { landing: false } }, /unknown key "pages.landing"/],
    [{ pages: { docs: "no" } }, /"pages.docs" must be true or false/],
    [{ fonts: "a.ttf" }, /"fonts" must be an array/],
    [{ fonts: [{}] }, /"fonts\[0\].path" must be a file path/],
    [{ fonts: [{ path: "//cdn/x.woff2" }] }, /must be a local file/],
    [{ fonts: [{ path: "a.ttf", weight: 0 }] }, /weight" must be a number from 1 to 1000/],
    [{ fonts: [{ path: "a.ttf", style: "oblique" }] }, /style" must be "normal" or "italic"/],
  ])("rejects %j", (input, message) => {
    expect(() => resolveOptions(input)).toThrow(message);
  });

  it("prefixes errors with the plugin name and shows an example", () => {
    expect(() => resolveOptions({ layout: 1 })).toThrow(/^\[plugin:og-image\][\s\S]*Example:/);
  });
});

describe("isRemoteReference", () => {
  it.each(["https://x.dev/a.svg", "http://x", "//cdn.x/a.svg", "data:image/png;base64,AA"])(
    "treats %s as remote",
    (value) => expect(isRemoteReference(value)).toBe(true)
  );

  it.each(["/docs/assets/logo.svg", "./logo.svg", "brand/logo.png", "C:\\site\\logo.svg"])(
    "treats %s as local",
    (value) => expect(isRemoteReference(value)).toBe(false)
  );
});

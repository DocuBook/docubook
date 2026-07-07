import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { LinkMdx } from "../components/LinkMdx.js";

describe("LinkMdx", () => {
  it("renders external link with target _blank", () => {
    const { container } = render(<LinkMdx href="https://example.com">Link</LinkMdx>);
    const a = container.querySelector("a");
    expect(a?.getAttribute("target")).toBe("_blank");
    expect(a?.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("renders internal link without target", () => {
    const { container } = render(<LinkMdx href="/docs/intro">Intro</LinkMdx>);
    const a = container.querySelector("a");
    expect(a?.getAttribute("target")).toBeNull();
    expect(a?.getAttribute("rel")).toBeNull();
  });

  it("returns null when href is missing", () => {
    const { container } = render(<LinkMdx>No href</LinkMdx>);
    expect(container.querySelector("a")).toBeNull();
  });

  it("respects custom target and rel", () => {
    const { container } = render(
      <LinkMdx href="https://x.com" target="_self" rel="nofollow">
        X
      </LinkMdx>
    );
    const a = container.querySelector("a");
    expect(a?.getAttribute("target")).toBe("_self");
    expect(a?.getAttribute("rel")).toBe("nofollow");
  });
});

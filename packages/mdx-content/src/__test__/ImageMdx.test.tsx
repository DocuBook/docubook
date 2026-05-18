import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ImageMdx } from "../components/ImageMdx";

describe("ImageMdx", () => {
  it("renders image with src", () => {
    const { container } = render(<ImageMdx src="/test.png" alt="Test" />);
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("alt")).toBe("Test");
  });

  it("returns null when src is missing", () => {
    const { container } = render(<ImageMdx />);
    expect(container.querySelector("img")).toBeNull();
  });

  it("renders with zoom disabled", () => {
    const { container } = render(<ImageMdx src="/img.png" zoom={false} />);
    const button = container.querySelector("button");
    expect(button?.getAttribute("aria-label")).toBe("Image");
  });

  it("renders with custom width and height", () => {
    const { container } = render(<ImageMdx src="/img.png" width={400} height={200} />);
    const img = container.querySelector("img");
    expect(img?.getAttribute("width")).toBe("400");
    expect(img?.getAttribute("height")).toBe("200");
  });

  it("renders with default alt text", () => {
    const { container } = render(<ImageMdx src="/x.png" />);
    expect(container.querySelector("img")?.getAttribute("alt")).toBe("image");
  });
});

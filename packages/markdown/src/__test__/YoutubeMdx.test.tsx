import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { YoutubeMdx } from "../components/YoutubeMdx";

describe("YoutubeMdx", () => {
  it("renders iframe with videoId", () => {
    const { container } = render(<YoutubeMdx videoId="OPM2t54T-Vo" />);
    const iframe = container.querySelector("iframe");
    expect(iframe).not.toBeNull();
    expect(iframe?.getAttribute("src")).toContain("OPM2t54T-Vo");
  });

  it("uses default title", () => {
    const { container } = render(<YoutubeMdx videoId="abc123" />);
    expect(container.querySelector("iframe")?.getAttribute("title")).toBe("YouTube video");
  });

  it("accepts custom title", () => {
    const { container } = render(<YoutubeMdx videoId="abc123" title="My Video" />);
    expect(container.querySelector("iframe")?.getAttribute("title")).toBe("My Video");
  });

  it("uses youtube-nocookie domain", () => {
    const { container } = render(<YoutubeMdx videoId="test" />);
    expect(container.querySelector("iframe")?.getAttribute("src")).toContain(
      "youtube-nocookie.com"
    );
  });
});

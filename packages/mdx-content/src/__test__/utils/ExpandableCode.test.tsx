import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, act } from "@testing-library/react";
import { ExpandableCode } from "../../utils/ExpandableCode";

afterEach(() => {
  cleanup();
});

describe("ExpandableCode", () => {
  it("renders pre content when not expandable", async () => {
    let container: HTMLElement;
    await act(async () => {
      ({ container } = render(
        <ExpandableCode
          isExpandable={false}
          totalLines={5}
          preContent={<code>short code</code>}
          preProps={{}}
        />
      ));
    });
    expect(container!.querySelector("pre")).not.toBeNull();
    expect(container!.textContent).toContain("short code");
  });

  it("renders without expand button when lines <= 20", async () => {
    let container: HTMLElement;
    await act(async () => {
      ({ container } = render(
        <ExpandableCode
          isExpandable={true}
          totalLines={10}
          preContent={<code>few lines</code>}
          preProps={{}}
        />
      ));
    });
    expect(container!.querySelector(".code-block-expandable-toggle")).toBeNull();
  });

  it("renders expand button when lines > 20", async () => {
    let container: HTMLElement;
    await act(async () => {
      ({ container } = render(
        <ExpandableCode
          isExpandable={true}
          totalLines={30}
          preContent={<code>many lines</code>}
          preProps={{}}
        />
      ));
    });
    const btn = container!.querySelector(".code-block-expandable-toggle");
    expect(btn).not.toBeNull();
    expect(btn?.textContent).toContain("See all 30 lines");
  });

  it("passes className to pre element", async () => {
    let container: HTMLElement;
    await act(async () => {
      ({ container } = render(
        <ExpandableCode
          isExpandable={false}
          totalLines={5}
          preContent={<code>x</code>}
          preProps={{}}
          className="language-ts"
        />
      ));
    });
    expect(container!.querySelector("pre")?.className).toContain("language-ts");
  });

  it("does not crash with empty preContent", async () => {
    let container: HTMLElement;
    await act(async () => {
      ({ container } = render(
        <ExpandableCode isExpandable={true} totalLines={25} preContent={null} preProps={{}} />
      ));
    });
    expect(container!.querySelector("pre")).not.toBeNull();
  });
});

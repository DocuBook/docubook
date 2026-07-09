import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { normalizeImporterPath } from "../node/security";

describe("normalizeImporterPath", () => {
  const CWD = process.cwd();
  // Canonical normalized form for a cwd-relative path: resolve() collapses
  // segments and the helper converts any backslashes to forward slashes, so
  // routing the expected side through the same helper keeps assertions honest
  // on both POSIX and Windows.
  const expectNormalized = (rel: string) => normalizeImporterPath(resolve(CWD, rel));

  it("is idempotent", () => {
    const input = `${CWD}/.docu/components/../components/Lucide.tsx`;
    const once = normalizeImporterPath(input);
    expect(normalizeImporterPath(once)).toBe(once);
  });

  it("collapses parent-directory segments", () => {
    expect(normalizeImporterPath(`${CWD}/.docu/components/../components/Lucide.tsx`)).toBe(
      expectNormalized(".docu/components/Lucide.tsx")
    );
  });

  it("collapses redundant separators", () => {
    expect(normalizeImporterPath(`${CWD}//.docu///components/Lucide.tsx`)).toBe(
      expectNormalized(".docu/components/Lucide.tsx")
    );
  });

  it("strips trailing slashes", () => {
    expect(normalizeImporterPath(`${resolve(CWD, ".docu/components")}/`)).toBe(
      expectNormalized(".docu/components")
    );
  });

  it("makes relative paths absolute against cwd", () => {
    expect(normalizeImporterPath(".docu/components/Lucide.tsx")).toBe(
      expectNormalized(".docu/components/Lucide.tsx")
    );
  });

  it("converts backslashes to forward slashes", () => {
    const input = `${CWD}\\sub\\dir`;
    const result = normalizeImporterPath(input);
    expect(result).not.toContain("\\");
    expect(result).toBe(`${CWD.replace(/\\/g, "/")}/sub/dir`);
  });
});

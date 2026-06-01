import { describe, it, expect, vi } from "vitest";
import { stripJsx, extractRecords } from "../node/search-indexer";

// Mock external & internal path modules to prevent extractRecords from throwing errors
vi.mock("@docubook/core", () => ({
  extractFrontmatterWithContent: <T>(raw: string) => {
    // We cast to T to satisfy the generic constraint and avoid the unused-var error
    const frontmatter = {
      title: "Test Page",
      description: "Test Description",
    } as Record<string, string> as unknown as T;

    // Simulates a simple frontmatter separation for testing purposes
    if (raw.startsWith("---")) {
      return {
        frontmatter,
        strippedContent: raw.replace(/---[\s\S]*?---/, "").trim(),
      };
    }
    return {
      frontmatter: {} as unknown as T,
      strippedContent: raw,
    };
  },
}));

vi.mock("./paths", () => ({
  DOCS_DIR: "/mock/docs",
  ASSETS_DIR: "/mock/assets",
  loadDocuConfig: () => ({
    routes: [{ href: "/getting-started", title: "Getting Started" }],
    meta: { title: "Docubook Docs" },
  }),
}));

describe("Search Indexer Test Suite", () => {
  // ==========================================
  // UNIT TEST: stripJsx
  // ==========================================
  describe("stripJsx()", () => {
    it("should remove inline self-closing components", () => {
      const input = "Hello <Button label='Click' /> world";
      expect(stripJsx(input)).toBe("Hello  world");
    });

    it("should remove paired components while preserving their inner text", () => {
      const input = "This is an <Badge variant='success'>Important</Badge> text.";
      expect(stripJsx(input)).toBe("This is an Important text.");
    });

    it("should successfully remove deeply nested components", () => {
      const input = "Outer <Box><Card><Text>Inner</Text></Card></Box> End";
      expect(stripJsx(input)).toBe("Outer Inner End");
    });

    it("should handle empty components", () => {
      const input = "Start <Empty></Empty> Finish";
      expect(stripJsx(input)).toBe("Start  Finish");
    });

    it("should leave content intact if no JSX is present", () => {
      const input = "This is plain text without any components.";
      expect(stripJsx(input)).toBe(input);
    });
  });

  // ==========================================
  // UNIT TEST: Table Row Skip
  // ==========================================
  describe("extractRecords() - Table Row Skip", () => {
    it("should skip Markdown table rows so they are not indexed as content", () => {
      const mdxContent = `
# Table Heading
| Header 1 | Header 2 |
| -------- | -------- |
| Row 1    | Data 1   |
| Row 2    | Data 2   |

Normal paragraph text after the table that should be indexed.
      `;

      const records = extractRecords("getting-started/page-1", mdxContent);

      // Check if any markdown table rows accidentally got indexed
      const tableContentRecord = records.find(
        (r) =>
          r.type === "content" && (r.content?.includes("Row 1") || r.content?.includes("Header 1"))
      );

      // Verify table rows DO NOT exist in the content records
      expect(tableContentRecord).toBeUndefined();

      // Verify the standard paragraph following the table is correctly indexed
      const normalContentRecord = records.find(
        (r) => r.type === "content" && r.content?.includes("Normal paragraph text")
      );
      expect(normalContentRecord).toBeDefined();
    });
  });

  // ==========================================
  // INTEGRATION TEST: JSX + Heading + Table Combination
  // ==========================================
  describe("extractRecords() - Complex Combination", () => {
    it("should execute stripJsx before line parsing and correctly ignore tables", () => {
      const mdxContent = `---
title: Integration Guide
---
# <Icon name="setup" /> How to Setup

Make sure to use the <Alert type="info">Don't forget to install bun</Alert> component first.

| Feature | Status |
| --- | --- |
| JSX | Safe |

## Final Subheading
      `;

      const records = extractRecords("getting-started/integration", mdxContent);

      // 1. Verify paragraph content containing JSX
      const contentRecords = records.filter((r) => r.type === "content");
      const paragraphRecord = contentRecords.find((r) =>
        r.content?.includes("Don't forget to install bun")
      );

      expect(paragraphRecord).toBeDefined();
      // Ensure the <Alert> tags are stripped out but the inner text remains intact
      expect(paragraphRecord?.content).not.toContain("<Alert>");
      expect(paragraphRecord?.content).toContain(
        "Make sure to use the Don't forget to install bun component first."
      );

      // 2. Ensure table rows are skipped entirely within a complex document layout
      const hasTableText = records.some(
        (r) => r.content?.includes("Feature") || r.content?.includes("Safe")
      );
      expect(hasTableText).toBe(false);
    });
  });
});

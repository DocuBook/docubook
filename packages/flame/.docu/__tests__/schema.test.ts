import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("docu.schema.json — sidebar field", () => {
  const schemaPath = join(import.meta.dirname, "..", "..", "docu.schema.json");
  const schema: Record<string, unknown> = JSON.parse(readFileSync(schemaPath, "utf-8"));

  it("has a sidebar property", () => {
    const properties = schema.properties as Record<string, unknown>;
    expect(properties.sidebar).toBeDefined();
  });

  it("defines sidebar as object type", () => {
    const sidebar = (schema.properties as Record<string, unknown>).sidebar as Record<
      string,
      unknown
    >;
    expect(sidebar.type).toBe("object");
  });

  it("has context enum with dropdown and separator", () => {
    const sidebar = (schema.properties as Record<string, unknown>).sidebar as Record<
      string,
      unknown
    >;
    const context = sidebar.properties as Record<string, unknown>;
    const contextProp = context.context as Record<string, unknown>;
    expect(contextProp.enum).toEqual(["dropdown", "separator"]);
  });

  it("defaults context to dropdown", () => {
    const sidebar = (schema.properties as Record<string, unknown>).sidebar as Record<
      string,
      unknown
    >;
    const context = sidebar.properties as Record<string, unknown>;
    const contextProp = context.context as Record<string, unknown>;
    expect(contextProp.default).toBe("dropdown");
  });

  it("does not allow additional properties on sidebar", () => {
    const sidebar = (schema.properties as Record<string, unknown>).sidebar as Record<
      string,
      unknown
    >;
    expect(sidebar.additionalProperties).toBe(false);
  });
});

describe("docu.schema.json — plugins field", () => {
  const schemaPath = join(import.meta.dirname, "..", "..", "docu.schema.json");
  const schema: Record<string, unknown> = JSON.parse(readFileSync(schemaPath, "utf-8"));

  it("is valid JSON", () => {
    expect(() => JSON.parse(readFileSync(schemaPath, "utf-8"))).not.toThrow();
  });

  it("has a plugins property", () => {
    const properties = schema.properties as Record<string, unknown>;
    expect(properties.plugins).toBeDefined();
  });

  it("defines plugins as array type", () => {
    const plugins = (schema.properties as Record<string, unknown>).plugins as Record<
      string,
      unknown
    >;
    expect(plugins.type).toBe("array");
  });

  it("validates string items (simple plugin names)", () => {
    const plugins = (schema.properties as Record<string, unknown>).plugins as Record<
      string,
      unknown
    >;
    const items = plugins.items as Record<string, unknown>;
    const oneOf = items.oneOf as Record<string, unknown>[];
    const stringItem = oneOf.find((o: Record<string, unknown>) => o.type === "string");
    expect(stringItem).toBeDefined();
    expect(stringItem!.description).toContain("package name");
  });

  it("validates tuple items (factory with options)", () => {
    const plugins = (schema.properties as Record<string, unknown>).plugins as Record<
      string,
      unknown
    >;
    const items = plugins.items as Record<string, unknown>;
    const oneOf = items.oneOf as Record<string, unknown>[];
    const tupleItem = oneOf.find((o: Record<string, unknown>) => o.type === "array");
    expect(tupleItem).toBeDefined();
    expect((tupleItem as Record<string, unknown>).minItems).toBe(2);
    expect((tupleItem as Record<string, unknown>).maxItems).toBe(2);
  });

  it("is draft-07 compliant", () => {
    expect(schema.$schema).toBe("http://json-schema.org/draft-07/schema#");
  });
});

describe("docu.schema.json — repo.url field", () => {
  const schemaPath = join(import.meta.dirname, "..", "..", "docu.schema.json");
  const schema: Record<string, unknown> = JSON.parse(readFileSync(schemaPath, "utf-8"));

  const repoProps = ((schema.properties as Record<string, unknown>).repo as Record<string, unknown>)
    .properties as Record<string, unknown>;

  it("defines url as string type", () => {
    const url = repoProps.url as Record<string, unknown>;
    expect(url.type).toBe("string");
  });

  it("has format uri on url", () => {
    const url = repoProps.url as Record<string, unknown>;
    expect(url.format).toBe("uri");
  });

  it("description mentions all supported platforms", () => {
    const url = repoProps.url as Record<string, unknown>;
    const desc = url.description as string;
    expect(desc).toContain("GitHub");
    expect(desc).toContain("GitLab");
    expect(desc).toContain("Bitbucket");
    expect(desc).toContain("Gitea");
    expect(desc).toContain("Codeberg");
    expect(desc).toContain("Forgejo");
  });

  it("has examples for all major platforms", () => {
    const url = repoProps.url as Record<string, unknown>;
    const examples = url.examples as string[];
    expect(examples.some((e) => e.includes("github.com"))).toBe(true);
    expect(examples.some((e) => e.includes("gitlab.com"))).toBe(true);
    expect(examples.some((e) => e.includes("bitbucket.org"))).toBe(true);
    expect(examples.some((e) => e.includes("gitea.com"))).toBe(true);
    expect(examples.some((e) => e.includes("codeberg.org"))).toBe(true);
  });
});

describe("docu.schema.json — repo.path field", () => {
  const schemaPath = join(import.meta.dirname, "..", "..", "docu.schema.json");
  const schema: Record<string, unknown> = JSON.parse(readFileSync(schemaPath, "utf-8"));

  const repoProps = ((schema.properties as Record<string, unknown>).repo as Record<string, unknown>)
    .properties as Record<string, unknown>;

  it("has a path property", () => {
    expect(repoProps.path).toBeDefined();
  });

  it("defines path as string type", () => {
    const path = repoProps.path as Record<string, unknown>;
    expect(path.type).toBe("string");
  });

  it("has a pattern requiring {filePath} placeholder", () => {
    const path = repoProps.path as Record<string, unknown>;
    expect(path.pattern).toBe("\\{filePath\\}");
  });

  it("pattern rejects value without {filePath}", () => {
    const path = repoProps.path as Record<string, unknown>;
    const regex = new RegExp(path.pattern as string);
    expect(regex.test("blob/main/")).toBe(false);
    expect(regex.test("blob/main")).toBe(false);
    expect(regex.test("")).toBe(false);
  });

  it("pattern accepts value with {filePath}", () => {
    const path = repoProps.path as Record<string, unknown>;
    const regex = new RegExp(path.pattern as string);
    expect(regex.test("blob/main/{filePath}")).toBe(true);
    expect(regex.test("blob/main/apps/web/{filePath}")).toBe(true);
    expect(regex.test("-/blob/main/{filePath}")).toBe(true);
    expect(regex.test("src/branch/main/{filePath}")).toBe(true);
    expect(regex.test("src/main/{filePath}")).toBe(true);
  });

  it("has examples covering all major platforms", () => {
    const path = repoProps.path as Record<string, unknown>;
    const examples = path.examples as string[];
    expect(examples).toBeDefined();
    // GitHub
    expect(examples.some((e) => e.startsWith("blob/main/"))).toBe(true);
    // GitLab
    expect(examples.some((e) => e.startsWith("-/blob/main/"))).toBe(true);
    // Bitbucket
    expect(examples.some((e) => e.startsWith("src/main/"))).toBe(true);
    // Gitea/Forgejo
    expect(examples.some((e) => e.startsWith("src/branch/main/"))).toBe(true);
    // All examples contain {filePath}
    expect(examples.every((e) => e.includes("{filePath}"))).toBe(true);
  });

  it("description mentions {filePath} and auto-detect", () => {
    const path = repoProps.path as Record<string, unknown>;
    expect(path.description as string).toContain("{filePath}");
    expect(path.description as string).toContain("auto-detect");
  });
});

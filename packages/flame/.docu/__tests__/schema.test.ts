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

describe("docu.schema.json — meta.basePath field", () => {
  const schemaPath = join(import.meta.dirname, "..", "..", "docu.schema.json");
  const schema: Record<string, unknown> = JSON.parse(readFileSync(schemaPath, "utf-8"));

  const metaProps = ((schema.properties as Record<string, unknown>).meta as Record<string, unknown>)
    .properties as Record<string, unknown>;

  it("has a basePath property", () => {
    expect(metaProps.basePath).toBeDefined();
  });

  it("defines basePath as string type", () => {
    const basePath = metaProps.basePath as Record<string, unknown>;
    expect(basePath.type).toBe("string");
  });

  it("documents the default and the empty-string root case", () => {
    const basePath = metaProps.basePath as Record<string, unknown>;
    const desc = basePath.description as string;
    expect(desc).toContain("/docs");
    expect(desc.toLowerCase()).toContain("empty");
  });

  it("warns that basePath is configured independently of baseURL", () => {
    // The prefix is appended to baseURL when building canonical/OG urls, so a
    // baseURL that already carries the path would double-count it.
    const basePath = metaProps.basePath as Record<string, unknown>;
    expect(basePath.description as string).toContain("baseURL");
  });

  it("is accepted — meta does not reject additional properties", () => {
    const meta = (schema.properties as Record<string, unknown>).meta as Record<string, unknown>;
    // additionalProperties: false means an undeclared field would be flagged by
    // editors; declaring basePath is what makes the config valid.
    expect(meta.additionalProperties).toBe(false);
    expect(Object.keys(metaProps)).toContain("basePath");
  });

  it("pins the canonical form so editors flag unnormalized prefixes", () => {
    const pattern = metaProps.basePath as Record<string, unknown>;
    const regex = new RegExp(pattern.pattern as string);

    for (const valid of ["", "/", "/docs", "/repo/docs", "/docs-me", "/v1.2_beta~x"]) {
      expect(regex.test(valid)).toBe(true);
    }
    // The build normalizes these and warns; the schema makes the editor say so
    // before the build has to.
    for (const invalid of ["/DOCS", "/Docs", "/docs me", "/docs/", "docs", "/docs%20me"]) {
      expect(regex.test(invalid)).toBe(false);
    }
  });
});

describe("docu.schema.json — experimental.pages field", () => {
  const schemaPath = join(import.meta.dirname, "..", "..", "docu.schema.json");
  const schema: Record<string, unknown> = JSON.parse(readFileSync(schemaPath, "utf-8"));
  const properties = schema.properties as Record<string, unknown>;
  const experimental = properties.experimental as Record<string, unknown>;

  it("has an experimental object that rejects unknown keys", () => {
    expect(experimental).toBeDefined();
    expect(experimental.type).toBe("object");
    expect(experimental.additionalProperties).toBe(false);
  });

  it("defines pages as a boolean that defaults to off", () => {
    const pages = (experimental.properties as Record<string, unknown>).pages as Record<
      string,
      unknown
    >;
    expect(pages.type).toBe("boolean");
    expect(pages.default).toBe(false);
  });

  it("documents what moves under the docs prefix and how deploys handle the root", () => {
    const pages = (experimental.properties as Record<string, unknown>).pages as Record<
      string,
      unknown
    >;
    const desc = pages.description as string;
    expect(desc).toContain("index.html");
    expect(desc).toContain("<basePath>/404.html");
    expect(desc).toContain("<basePath>/_flame/");
    expect(desc).toContain("meta.basePath");
    expect(desc).toContain("--docker");
    expect(desc).not.toContain("not supported");
  });

  it("rejects a root basePath only while experimental.pages is true", () => {
    const rule = (schema.allOf as Record<string, any>[])[0]!;
    // Condition: the flag is literally true.
    expect(rule.if.required).toEqual(["experimental"]);
    expect(rule.if.properties.experimental.properties.pages).toEqual({ const: true });
    expect(rule.if.properties.experimental.required).toEqual(["pages"]);
    // Consequence: basePath must not be a root form.
    const basePath = rule.then.properties.meta.properties.basePath;
    const root = new RegExp(basePath.not.pattern);
    for (const value of ["", "/", "///"]) {
      expect(root.test(value), JSON.stringify(value)).toBe(true);
    }
    // Whitespace-only values are rejected by the canonical pattern for every
    // project, so the flag rule does not need to repeat them.
    const canonical = new RegExp(
      ((schema.properties as any).meta.properties.basePath as { pattern: string }).pattern
    );
    for (const value of [" ", "   ", "\t"]) {
      expect(canonical.test(value), JSON.stringify(value)).toBe(false);
    }
    for (const value of ["/docs", "docs", "/handbook/v2", "/a"]) {
      expect(root.test(value), value).toBe(false);
    }
    expect(basePath.description).toContain("'/docs'");
    expect(basePath.description).toContain("cannot share the origin");
  });

  it("marks the home section as ignored under the flag", () => {
    const home = properties.home as Record<string, unknown>;
    expect(home.description as string).toContain("experimental.pages");
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

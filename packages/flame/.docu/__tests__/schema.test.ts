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

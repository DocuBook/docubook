import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";

vi.mock("prompts", () => ({ default: vi.fn() }));
vi.mock("../utils/templateDetect.js", () => ({
  getAvailableTemplates: () => [{ id: "test", name: "Test", description: "test template" }],
}));

const prompts = (await import("prompts")).default;
const { collectUserInput } = await import("../cli/promptHandler.js");

describe("collectUserInput", () => {
  beforeEach(() => {
    vi.spyOn(fs, "existsSync").mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws when CLI-provided dir is empty string", async () => {
    await expect(collectUserInput("")).rejects.toThrow("Project name cannot be empty");
  });

  it("throws when CLI-provided dir is whitespace only", async () => {
    await expect(collectUserInput("   ")).rejects.toThrow("Project name cannot be empty");
  });

  it("throws when directory already exists", async () => {
    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    await expect(collectUserInput("existing-dir")).rejects.toThrow("already exists");
  });

  it("throws when user cancels prompts", async () => {
    prompts.mockImplementation((_questions, opts) => {
      opts.onCancel();
      return {};
    });
    await expect(collectUserInput(undefined)).rejects.toThrow("cancelled");
  });
});

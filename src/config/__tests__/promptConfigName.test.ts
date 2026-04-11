import { describe, it, expect, vi } from "vitest";
import { promptConfigName } from "../promptConfigName.js";

function mockRlFactory(answer: string) {
  return () => ({
    question: (_prompt: string, cb: (answer: string) => void) => cb(answer),
    close: vi.fn(),
  });
}

describe("promptConfigName", () => {
  it("returns the only option without prompting when one config exists", async () => {
    const result = await promptConfigName(["my-cortex"], false, mockRlFactory("ignored"));

    expect(result).toBe("my-cortex");
  });

  it("returns default when user presses Enter with includeDefault", async () => {
    const result = await promptConfigName(["work"], true, mockRlFactory(""));

    expect(result).toBe("default");
  });

  it("selects by number", async () => {
    const result = await promptConfigName(["work", "personal"], true, mockRlFactory("2"));

    expect(result).toBe("work");
  });

  it("selects by name", async () => {
    const result = await promptConfigName(["work", "personal"], true, mockRlFactory("personal"));

    expect(result).toBe("personal");
  });

  it("falls back to first option for invalid input", async () => {
    const result = await promptConfigName(["work", "personal"], true, mockRlFactory("bogus"));

    expect(result).toBe("default");
  });

  it("throws when no configs available and no default", async () => {
    await expect(
      promptConfigName([], false, mockRlFactory(""))
    ).rejects.toThrow("No configurations available");
  });

  it("returns default automatically when only default exists", async () => {
    const result = await promptConfigName([], true, mockRlFactory("ignored"));

    expect(result).toBe("default");
  });

  it("selects by number without default", async () => {
    const result = await promptConfigName(["alpha", "beta"], false, mockRlFactory("2"));

    expect(result).toBe("beta");
  });

  it("selects by name without default", async () => {
    const result = await promptConfigName(["alpha", "beta"], false, mockRlFactory("alpha"));

    expect(result).toBe("alpha");
  });
});

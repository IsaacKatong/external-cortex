import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../runCommand.js", () => ({
  runCommand: vi.fn(),
}));

import { runCommand } from "../runCommand.js";
import { buildForGitHubPages } from "../buildForGitHubPages.js";

const mockRunCommand = vi.mocked(runCommand);

describe("buildForGitHubPages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("runs vite build with the correct base path and config name", () => {
    buildForGitHubPages("my-site", "my-config");

    expect(mockRunCommand).toHaveBeenCalledWith(
      "npx",
      ["vite", "build", "--base", "/my-site/"],
      { cwd: process.cwd(), env: expect.objectContaining({ EC_CONFIG_NAME: "my-config" }) }
    );
  });

  it("uses the provided project root", () => {
    buildForGitHubPages("my-site", "my-config", "/custom/root");

    expect(mockRunCommand).toHaveBeenCalledWith(
      "npx",
      ["vite", "build", "--base", "/my-site/"],
      { cwd: "/custom/root", env: expect.objectContaining({ EC_CONFIG_NAME: "my-config" }) }
    );
  });

  it("throws when vite build fails", () => {
    mockRunCommand.mockImplementation(() => {
      throw new Error("vite build failed");
    });

    expect(() => buildForGitHubPages("my-site", "default")).toThrow("vite build failed");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../runCommand.js", () => ({
  runCommand: vi.fn(),
}));

import { runCommand } from "../runCommand.js";
import { createGitHubRepo } from "../createGitHubRepo.js";

const mockRunCommand = vi.mocked(runCommand);

describe("createGitHubRepo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls gh repo create with the correct arguments", () => {
    mockRunCommand.mockReturnValue(
      JSON.stringify({ fullName: "user/my-repo", url: "https://github.com/user/my-repo" })
    );

    createGitHubRepo("my-repo");

    expect(mockRunCommand).toHaveBeenCalledWith(
      "gh",
      [
        "repo",
        "create",
        "my-repo",
        "--public",
        "--description",
        "External Cortex – hosted with GitHub Pages",
        "--json",
        "fullName,url",
      ],
      { stdio: "pipe" }
    );
  });

  it("returns the full name and HTML URL from gh output", () => {
    mockRunCommand.mockReturnValue(
      JSON.stringify({ fullName: "user/my-repo", url: "https://github.com/user/my-repo" })
    );

    const result = createGitHubRepo("my-repo");

    expect(result).toEqual({
      fullName: "user/my-repo",
      htmlUrl: "https://github.com/user/my-repo",
    });
  });

  it("throws when gh fails", () => {
    mockRunCommand.mockImplementation(() => {
      throw new Error("gh: not authenticated");
    });

    expect(() => createGitHubRepo("my-repo")).toThrow("gh: not authenticated");
  });
});

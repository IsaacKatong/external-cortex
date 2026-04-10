import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolve } from "node:path";

vi.mock("../runCommand.js", () => ({
  runCommand: vi.fn(),
}));

vi.mock("../detectGitProtocol.js", () => ({
  detectGitProtocol: vi.fn(),
  buildRemoteUrl: vi.fn(),
}));

import { runCommand } from "../runCommand.js";
import { detectGitProtocol, buildRemoteUrl } from "../detectGitProtocol.js";
import { uploadToGitHubPages } from "../uploadToGitHubPages.js";

const mockRunCommand = vi.mocked(runCommand);
const mockDetectGitProtocol = vi.mocked(detectGitProtocol);
const mockBuildRemoteUrl = vi.mocked(buildRemoteUrl);

describe("uploadToGitHubPages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDetectGitProtocol.mockReturnValue("ssh");
    mockBuildRemoteUrl.mockReturnValue("git@github.com:user/my-repo.git");
  });

  it("initializes git, commits, and pushes to the remote", () => {
    const root = "/project";
    const distDir = resolve(root, "dist");

    uploadToGitHubPages("user/my-repo", root);

    const calls = mockRunCommand.mock.calls;

    expect(calls[0]).toEqual(["git", ["init"], { cwd: distDir }]);
    expect(calls[1]).toEqual(["git", ["checkout", "-b", "main"], { cwd: distDir }]);
    expect(calls[2]).toEqual(["git", ["add", "-A"], { cwd: distDir }]);
    expect(calls[3]).toEqual([
      "git",
      ["commit", "-m", "Deploy External Cortex to GitHub Pages"],
      { cwd: distDir },
    ]);
    expect(calls[4]).toEqual([
      "git",
      ["remote", "add", "origin", "git@github.com:user/my-repo.git"],
      { cwd: distDir },
    ]);
    expect(calls[5]).toEqual([
      "git",
      ["push", "-u", "origin", "main", "--force"],
      { cwd: distDir },
    ]);
  });

  it("detects the git protocol and builds the remote URL", () => {
    mockDetectGitProtocol.mockReturnValue("https");
    mockBuildRemoteUrl.mockReturnValue("https://github.com/user/my-repo.git");

    uploadToGitHubPages("user/my-repo", "/project");

    expect(mockDetectGitProtocol).toHaveBeenCalled();
    expect(mockBuildRemoteUrl).toHaveBeenCalledWith("user/my-repo", "https");
  });

  it("enables GitHub Pages via the gh API", () => {
    uploadToGitHubPages("user/my-repo", "/project");

    const calls = mockRunCommand.mock.calls;
    const ghApiCall = calls[6];

    expect(ghApiCall).toEqual([
      "gh",
      [
        "api",
        "--method",
        "POST",
        "repos/user/my-repo/pages",
        "-f",
        "source[branch]=main",
        "-f",
        "source[path]=/",
      ],
      { stdio: "pipe" },
    ]);
  });

  it("returns the correct GitHub Pages URL", () => {
    const result = uploadToGitHubPages("user/my-repo", "/project");

    expect(result.pagesUrl).toBe("https://user.github.io/my-repo/");
  });
});

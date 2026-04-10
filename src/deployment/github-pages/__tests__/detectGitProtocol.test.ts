import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../runCommand.js", () => ({
  runCommand: vi.fn(),
}));

import { runCommand } from "../runCommand.js";
import { detectGitProtocol, buildRemoteUrl } from "../detectGitProtocol.js";

const mockRunCommand = vi.mocked(runCommand);

describe("detectGitProtocol", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns ssh when gh config reports ssh", () => {
    mockRunCommand.mockReturnValue("ssh\n");

    expect(detectGitProtocol()).toBe("ssh");
    expect(mockRunCommand).toHaveBeenCalledWith(
      "gh",
      ["config", "get", "git_protocol", "-h", "github.com"],
      { stdio: "pipe" }
    );
  });

  it("returns https when gh config reports https", () => {
    mockRunCommand.mockReturnValue("https\n");

    expect(detectGitProtocol()).toBe("https");
  });

  it("falls back to https when gh config fails", () => {
    mockRunCommand.mockImplementation(() => {
      throw new Error("gh not found");
    });

    expect(detectGitProtocol()).toBe("https");
  });

  it("falls back to https for unexpected protocol values", () => {
    mockRunCommand.mockReturnValue("ftp\n");

    expect(detectGitProtocol()).toBe("https");
  });
});

describe("buildRemoteUrl", () => {
  it("builds an SSH URL", () => {
    expect(buildRemoteUrl("user/repo", "ssh")).toBe("git@github.com:user/repo.git");
  });

  it("builds an HTTPS URL", () => {
    expect(buildRemoteUrl("user/repo", "https")).toBe(
      "https://github.com/user/repo.git"
    );
  });
});

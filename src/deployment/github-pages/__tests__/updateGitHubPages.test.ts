import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

vi.mock("../runCommand.js", () => ({
  runCommand: vi.fn(),
}));

vi.mock("../detectGitProtocol.js", () => ({
  detectGitProtocol: vi.fn(),
  buildRemoteUrl: vi.fn(),
}));

import { runCommand } from "../runCommand.js";
import { detectGitProtocol, buildRemoteUrl } from "../detectGitProtocol.js";
import { updateGitHubPages } from "../updateGitHubPages.js";

const mockRunCommand = vi.mocked(runCommand);
const mockDetectGitProtocol = vi.mocked(detectGitProtocol);
const mockBuildRemoteUrl = vi.mocked(buildRemoteUrl);

const __dirname = dirname(fileURLToPath(import.meta.url));
const tmpDir = resolve(__dirname, "__tmp_update_test__");
const projectRoot = resolve(tmpDir, "project");
const distDir = resolve(projectRoot, "dist");
const pagesDir = resolve(projectRoot, "pages");
const repoDir = resolve(pagesDir, "my-repo");

describe("updateGitHubPages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDetectGitProtocol.mockReturnValue("ssh");
    mockBuildRemoteUrl.mockReturnValue("git@github.com:user/my-repo.git");

    // Create project structure with dist/ output
    mkdirSync(distDir, { recursive: true });
    mkdirSync(pagesDir, { recursive: true });
    writeFileSync(resolve(distDir, "index.html"), "<html>built</html>");
    writeFileSync(resolve(distDir, "assets.js"), "console.log('app')");
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("clones the repo when it does not exist locally", () => {
    // Simulate git clone creating the repo directory
    mockRunCommand.mockImplementationOnce(() => {
      mkdirSync(repoDir, { recursive: true });
      mkdirSync(resolve(repoDir, ".git"), { recursive: true });
      return "";
    });

    updateGitHubPages("user/my-repo", projectRoot);

    expect(mockBuildRemoteUrl).toHaveBeenCalledWith("user/my-repo", "ssh");
    expect(mockRunCommand.mock.calls[0]).toEqual([
      "git",
      ["clone", "git@github.com:user/my-repo.git", repoDir],
      { cwd: pagesDir },
    ]);
  });

  it("pulls when the repo already exists locally", () => {
    // Pre-create the repo dir to simulate an existing clone
    mkdirSync(repoDir, { recursive: true });
    mkdirSync(resolve(repoDir, ".git"), { recursive: true });

    updateGitHubPages("user/my-repo", projectRoot);

    expect(mockRunCommand.mock.calls[0]).toEqual([
      "git",
      ["pull"],
      { cwd: repoDir },
    ]);
  });

  it("copies dist/ contents into the repo directory", () => {
    // Simulate clone by creating the dir (the mock won't actually clone)
    mkdirSync(repoDir, { recursive: true });
    mkdirSync(resolve(repoDir, ".git"), { recursive: true });

    updateGitHubPages("user/my-repo", projectRoot);

    expect(existsSync(resolve(repoDir, "index.html"))).toBe(true);
    expect(readFileSync(resolve(repoDir, "index.html"), "utf-8")).toBe(
      "<html>built</html>"
    );
    expect(existsSync(resolve(repoDir, "assets.js"))).toBe(true);
  });

  it("preserves graph.json in the repo directory", () => {
    mkdirSync(repoDir, { recursive: true });
    mkdirSync(resolve(repoDir, ".git"), { recursive: true });
    writeFileSync(resolve(repoDir, "graph.json"), '{"existing":"data"}');

    // Also put a graph.json in dist/ to make sure it is NOT copied over
    writeFileSync(resolve(distDir, "graph.json"), '{"new":"data"}');

    updateGitHubPages("user/my-repo", projectRoot);

    expect(readFileSync(resolve(repoDir, "graph.json"), "utf-8")).toBe(
      '{"existing":"data"}'
    );
  });

  it("removes stale files from the repo before copying", () => {
    mkdirSync(repoDir, { recursive: true });
    mkdirSync(resolve(repoDir, ".git"), { recursive: true });
    writeFileSync(resolve(repoDir, "old-asset.js"), "stale");

    updateGitHubPages("user/my-repo", projectRoot);

    expect(existsSync(resolve(repoDir, "old-asset.js"))).toBe(false);
  });

  it("preserves the .git directory", () => {
    mkdirSync(repoDir, { recursive: true });
    mkdirSync(resolve(repoDir, ".git"), { recursive: true });
    writeFileSync(resolve(repoDir, ".git", "HEAD"), "ref: refs/heads/main");

    updateGitHubPages("user/my-repo", projectRoot);

    expect(existsSync(resolve(repoDir, ".git", "HEAD"))).toBe(true);
  });

  it("commits and pushes after copying", () => {
    mkdirSync(repoDir, { recursive: true });
    mkdirSync(resolve(repoDir, ".git"), { recursive: true });

    updateGitHubPages("user/my-repo", projectRoot);

    const calls = mockRunCommand.mock.calls;
    const addCall = calls.find(
      (c) => c[0] === "git" && (c[1] as string[])[0] === "add"
    );
    const commitCall = calls.find(
      (c) => c[0] === "git" && (c[1] as string[])[0] === "commit"
    );
    const pushCall = calls.find(
      (c) => c[0] === "git" && (c[1] as string[])[0] === "push"
    );

    expect(addCall).toEqual(["git", ["add", "-A"], { cwd: repoDir }]);
    expect(commitCall).toEqual([
      "git",
      ["commit", "-m", "Update External Cortex GitHub Pages"],
      { cwd: repoDir },
    ]);
    expect(pushCall).toEqual(["git", ["push"], { cwd: repoDir }]);
  });
});

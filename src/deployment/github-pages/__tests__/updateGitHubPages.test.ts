import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

vi.mock("../runCommand.js", () => ({
  runCommand: vi.fn(),
}));

vi.mock("../../../encryption/encrypt.js", () => ({
  encryptGraphJson: vi.fn((plaintext: string, _password: string) => `ENCRYPTED:${plaintext}`),
}));

import { runCommand } from "../runCommand.js";
import { updateGitHubPages } from "../updateGitHubPages.js";

const mockRunCommand = vi.mocked(runCommand);

const __dirname = dirname(fileURLToPath(import.meta.url));
const tmpDir = resolve(__dirname, "__tmp_update_test__");
const projectRoot = resolve(tmpDir, "project");
const distDir = resolve(projectRoot, "dist");
const pagesDir = resolve(projectRoot, "pages");
const repoDir = resolve(pagesDir, "my-repo");

describe("updateGitHubPages", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // By default, `git status --porcelain` returns non-empty (changes exist)
    mockRunCommand.mockImplementation((cmd, args, opts) => {
      if (
        cmd === "git" &&
        (args as string[])[0] === "status" &&
        (args as string[])[1] === "--porcelain"
      ) {
        return "M index.html\n";
      }
      return "";
    });

    // Create project structure with dist/ output
    mkdirSync(distDir, { recursive: true });
    mkdirSync(pagesDir, { recursive: true });
    writeFileSync(resolve(distDir, "index.html"), "<html>built</html>");
    writeFileSync(resolve(distDir, "assets.js"), "console.log('app')");
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("clones the repo via gh when it does not exist locally", () => {
    // Simulate gh clone creating the repo directory
    mockRunCommand.mockImplementation((cmd, args) => {
      if (cmd === "gh" && (args as string[])[0] === "repo") {
        mkdirSync(repoDir, { recursive: true });
        mkdirSync(resolve(repoDir, ".git"), { recursive: true });
      }
      if (
        cmd === "git" &&
        (args as string[])[0] === "status" &&
        (args as string[])[1] === "--porcelain"
      ) {
        return "M index.html\n";
      }
      return "";
    });

    updateGitHubPages("user/my-repo", "", projectRoot);

    const ghCall = mockRunCommand.mock.calls.find(
      (c) => c[0] === "gh"
    );
    expect(ghCall).toEqual([
      "gh",
      ["repo", "clone", "user/my-repo", repoDir],
    ]);
  });

  it("force pulls when the repo already exists locally", () => {
    mkdirSync(repoDir, { recursive: true });
    mkdirSync(resolve(repoDir, ".git"), { recursive: true });

    updateGitHubPages("user/my-repo", "", projectRoot);

    const fetchCall = mockRunCommand.mock.calls.find(
      (c) => c[0] === "git" && (c[1] as string[])[0] === "fetch"
    );
    expect(fetchCall).toEqual([
      "git",
      ["fetch", "origin", "main"],
      { cwd: repoDir },
    ]);

    const resetCall = mockRunCommand.mock.calls.find(
      (c) => c[0] === "git" && (c[1] as string[])[0] === "reset"
    );
    expect(resetCall).toEqual([
      "git",
      ["reset", "--hard", "origin/main"],
      { cwd: repoDir },
    ]);
  });

  it("configures HTTPS remote and gh credential helper", () => {
    mkdirSync(repoDir, { recursive: true });
    mkdirSync(resolve(repoDir, ".git"), { recursive: true });

    updateGitHubPages("user/my-repo", "", projectRoot);

    const setUrlCall = mockRunCommand.mock.calls.find(
      (c) =>
        c[0] === "git" &&
        (c[1] as string[])[0] === "remote" &&
        (c[1] as string[])[1] === "set-url"
    );
    expect(setUrlCall).toEqual([
      "git",
      ["remote", "set-url", "origin", "https://github.com/user/my-repo.git"],
      { cwd: repoDir },
    ]);

    const credentialCall = mockRunCommand.mock.calls.find(
      (c) =>
        c[0] === "git" &&
        (c[1] as string[])[0] === "config" &&
        (c[1] as string[])[1] === "--local"
    );
    expect(credentialCall).toEqual([
      "git",
      ["config", "--local", "credential.helper", "!gh auth git-credential"],
      { cwd: repoDir },
    ]);
  });

  it("copies dist/ contents into the repo directory", () => {
    mkdirSync(repoDir, { recursive: true });
    mkdirSync(resolve(repoDir, ".git"), { recursive: true });

    updateGitHubPages("user/my-repo", "", projectRoot);

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

    writeFileSync(resolve(distDir, "graph.json"), '{"new":"data"}');

    updateGitHubPages("user/my-repo", "", projectRoot);

    expect(readFileSync(resolve(repoDir, "graph.json"), "utf-8")).toBe(
      '{"existing":"data"}'
    );
  });

  it("skips .git directory when copying from dist", () => {
    mkdirSync(repoDir, { recursive: true });
    mkdirSync(resolve(repoDir, ".git"), { recursive: true });
    writeFileSync(resolve(repoDir, ".git", "HEAD"), "ref: refs/heads/main");

    // Simulate stale .git in dist (from old uploadToGitHubPages)
    mkdirSync(resolve(distDir, ".git"), { recursive: true });
    writeFileSync(resolve(distDir, ".git", "HEAD"), "ref: refs/heads/other");

    updateGitHubPages("user/my-repo", "", projectRoot);

    // .git in repo should be preserved, not overwritten from dist
    expect(readFileSync(resolve(repoDir, ".git", "HEAD"), "utf-8")).toBe(
      "ref: refs/heads/main"
    );
  });

  it("removes stale files from the repo before copying", () => {
    mkdirSync(repoDir, { recursive: true });
    mkdirSync(resolve(repoDir, ".git"), { recursive: true });
    writeFileSync(resolve(repoDir, "old-asset.js"), "stale");

    updateGitHubPages("user/my-repo", "", projectRoot);

    expect(existsSync(resolve(repoDir, "old-asset.js"))).toBe(false);
  });

  it("preserves the .git directory", () => {
    mkdirSync(repoDir, { recursive: true });
    mkdirSync(resolve(repoDir, ".git"), { recursive: true });
    writeFileSync(resolve(repoDir, ".git", "HEAD"), "ref: refs/heads/main");

    updateGitHubPages("user/my-repo", "", projectRoot);

    expect(existsSync(resolve(repoDir, ".git", "HEAD"))).toBe(true);
  });

  it("commits and pushes after copying", () => {
    mkdirSync(repoDir, { recursive: true });
    mkdirSync(resolve(repoDir, ".git"), { recursive: true });

    updateGitHubPages("user/my-repo", "", projectRoot);

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
    expect(pushCall).toEqual([
      "git",
      ["push", "-u", "origin", "main", "--force"],
      { cwd: repoDir },
    ]);
  });

  it("skips commit and push when there are no changes", () => {
    mkdirSync(repoDir, { recursive: true });
    mkdirSync(resolve(repoDir, ".git"), { recursive: true });

    // Return empty string for status --porcelain (no changes)
    mockRunCommand.mockImplementation((cmd, args) => {
      if (
        cmd === "git" &&
        (args as string[])[0] === "status" &&
        (args as string[])[1] === "--porcelain"
      ) {
        return "";
      }
      return "";
    });

    updateGitHubPages("user/my-repo", "", projectRoot);

    const commitCall = mockRunCommand.mock.calls.find(
      (c) => c[0] === "git" && (c[1] as string[])[0] === "commit"
    );
    const pushCall = mockRunCommand.mock.calls.find(
      (c) => c[0] === "git" && (c[1] as string[])[0] === "push"
    );

    expect(commitCall).toBeUndefined();
    expect(pushCall).toBeUndefined();
  });

  it("preserves plain-text-graph.json in the repo directory", () => {
    mkdirSync(repoDir, { recursive: true });
    mkdirSync(resolve(repoDir, ".git"), { recursive: true });
    writeFileSync(resolve(repoDir, "plain-text-graph.json"), '{"plain":"data"}');

    writeFileSync(resolve(distDir, "plain-text-graph.json"), '{"new":"data"}');

    updateGitHubPages("user/my-repo", "", projectRoot);

    expect(readFileSync(resolve(repoDir, "plain-text-graph.json"), "utf-8")).toBe(
      '{"plain":"data"}'
    );
  });

  it("encrypts graph.json when password is provided", () => {
    mkdirSync(repoDir, { recursive: true });
    mkdirSync(resolve(repoDir, ".git"), { recursive: true });
    writeFileSync(resolve(repoDir, "plain-text-graph.json"), '{"datums":[]}');

    updateGitHubPages("user/my-repo", "secret", projectRoot);

    expect(readFileSync(resolve(repoDir, "graph.json"), "utf-8")).toBe(
      'ENCRYPTED:{"datums":[]}'
    );
  });

  it("copies plain-text-graph.json to graph.json when no password", () => {
    mkdirSync(repoDir, { recursive: true });
    mkdirSync(resolve(repoDir, ".git"), { recursive: true });
    writeFileSync(resolve(repoDir, "plain-text-graph.json"), '{"datums":[]}');

    updateGitHubPages("user/my-repo", "", projectRoot);

    expect(readFileSync(resolve(repoDir, "graph.json"), "utf-8")).toBe(
      '{"datums":[]}'
    );
  });

  it("seeds plain-text-graph.json from existing graph.json", () => {
    mkdirSync(repoDir, { recursive: true });
    mkdirSync(resolve(repoDir, ".git"), { recursive: true });
    writeFileSync(resolve(repoDir, "graph.json"), '{"existing":"data"}');

    updateGitHubPages("user/my-repo", "", projectRoot);

    expect(existsSync(resolve(repoDir, "plain-text-graph.json"))).toBe(true);
    expect(readFileSync(resolve(repoDir, "plain-text-graph.json"), "utf-8")).toBe(
      '{"existing":"data"}'
    );
  });

  it("creates .gitignore with plain-text-graph.json entry", () => {
    // Simulate gh clone creating the repo directory
    mockRunCommand.mockImplementation((cmd, args) => {
      if (cmd === "gh" && (args as string[])[0] === "repo") {
        mkdirSync(repoDir, { recursive: true });
        mkdirSync(resolve(repoDir, ".git"), { recursive: true });
      }
      if (
        cmd === "git" &&
        (args as string[])[0] === "status" &&
        (args as string[])[1] === "--porcelain"
      ) {
        return "M .gitignore\n";
      }
      return "";
    });

    updateGitHubPages("user/my-repo", "", projectRoot);

    const gitignore = readFileSync(resolve(repoDir, ".gitignore"), "utf-8");
    expect(gitignore).toContain("plain-text-graph.json");
  });
});

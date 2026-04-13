import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

vi.mock("../runCommand.js", () => ({
  runCommand: vi.fn(),
}));

vi.mock("../../../encryption/encrypt.js", () => ({
  encryptGraphJson: vi.fn((plaintext: string, _password: string, version: number = 0) =>
    JSON.stringify({ graph_blob: `ENCRYPTED:${plaintext}`, version })
  ),
}));

vi.mock("../../../encryption/nodeDecrypt.js", () => ({
  decryptGraphJson: vi.fn(),
}));

vi.mock("../../../encryption/parseEnvelope.js", async () => {
  const actual = await vi.importActual<typeof import("../../../encryption/parseEnvelope.js")>("../../../encryption/parseEnvelope.js");
  return { parseEnvelope: actual.parseEnvelope };
});

vi.mock("../promptPasswordAction.js", () => ({
  promptPasswordAction: vi.fn(),
}));

import { runCommand } from "../runCommand.js";
import { updateGitHubPages } from "../updateGitHubPages.js";
import { encryptGraphJson } from "../../../encryption/encrypt.js";
import { decryptGraphJson } from "../../../encryption/nodeDecrypt.js";
import { promptPasswordAction } from "../promptPasswordAction.js";

const mockRunCommand = vi.mocked(runCommand);
const mockEncrypt = vi.mocked(encryptGraphJson);
const mockDecrypt = vi.mocked(decryptGraphJson);
const mockPromptPassword = vi.mocked(promptPasswordAction);

const __dirname = dirname(fileURLToPath(import.meta.url));
const tmpDir = resolve(__dirname, "__tmp_update_test__");
const projectRoot = resolve(tmpDir, "project");
const distDir = resolve(projectRoot, "dist");
const pagesDir = resolve(projectRoot, "pages");
const repoDir = resolve(pagesDir, "my-repo");

function setupMocks(): void {
  // By default, `git status --porcelain` returns non-empty (changes exist)
  mockRunCommand.mockImplementation((cmd, args) => {
    if (
      cmd === "git" &&
      (args as string[])[0] === "status" &&
      (args as string[])[1] === "--porcelain"
    ) {
      return "M index.html\n";
    }
    return "";
  });
}

function setupRepo(): void {
  mkdirSync(repoDir, { recursive: true });
  mkdirSync(resolve(repoDir, ".git"), { recursive: true });
}

describe("updateGitHubPages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMocks();

    // Create project structure with dist/ output
    mkdirSync(distDir, { recursive: true });
    mkdirSync(pagesDir, { recursive: true });
    writeFileSync(resolve(distDir, "index.html"), "<html>built</html>");
    writeFileSync(resolve(distDir, "assets.js"), "console.log('app')");
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("clones the repo via gh when it does not exist locally", async () => {
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

    await updateGitHubPages("user/my-repo", "", projectRoot);

    const ghCall = mockRunCommand.mock.calls.find(
      (c) => c[0] === "gh"
    );
    expect(ghCall).toEqual([
      "gh",
      ["repo", "clone", "user/my-repo", repoDir],
    ]);
  });

  it("force pulls when the repo already exists locally", async () => {
    setupRepo();

    await updateGitHubPages("user/my-repo", "", projectRoot);

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

  it("configures HTTPS remote and gh credential helper", async () => {
    setupRepo();

    await updateGitHubPages("user/my-repo", "", projectRoot);

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

  it("copies dist/ contents into the repo directory", async () => {
    setupRepo();

    await updateGitHubPages("user/my-repo", "", projectRoot);

    expect(existsSync(resolve(repoDir, "index.html"))).toBe(true);
    expect(readFileSync(resolve(repoDir, "index.html"), "utf-8")).toBe(
      "<html>built</html>"
    );
    expect(existsSync(resolve(repoDir, "assets.js"))).toBe(true);
  });

  it("preserves graph.json in the repo directory", async () => {
    setupRepo();
    writeFileSync(resolve(repoDir, "graph.json"), '{"existing":"data"}');

    writeFileSync(resolve(distDir, "graph.json"), '{"new":"data"}');

    await updateGitHubPages("user/my-repo", "", projectRoot);

    expect(readFileSync(resolve(repoDir, "graph.json"), "utf-8")).toBe(
      '{"existing":"data"}'
    );
  });

  it("skips .git directory when copying from dist", async () => {
    setupRepo();
    writeFileSync(resolve(repoDir, ".git", "HEAD"), "ref: refs/heads/main");

    mkdirSync(resolve(distDir, ".git"), { recursive: true });
    writeFileSync(resolve(distDir, ".git", "HEAD"), "ref: refs/heads/other");

    await updateGitHubPages("user/my-repo", "", projectRoot);

    expect(readFileSync(resolve(repoDir, ".git", "HEAD"), "utf-8")).toBe(
      "ref: refs/heads/main"
    );
  });

  it("removes stale files from the repo before copying", async () => {
    setupRepo();
    writeFileSync(resolve(repoDir, "old-asset.js"), "stale");

    await updateGitHubPages("user/my-repo", "", projectRoot);

    expect(existsSync(resolve(repoDir, "old-asset.js"))).toBe(false);
  });

  it("preserves the .git directory", async () => {
    setupRepo();
    writeFileSync(resolve(repoDir, ".git", "HEAD"), "ref: refs/heads/main");

    await updateGitHubPages("user/my-repo", "", projectRoot);

    expect(existsSync(resolve(repoDir, ".git", "HEAD"))).toBe(true);
  });

  it("commits and pushes after copying", async () => {
    setupRepo();

    await updateGitHubPages("user/my-repo", "", projectRoot);

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

  it("skips commit and push when there are no changes", async () => {
    setupRepo();

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

    await updateGitHubPages("user/my-repo", "", projectRoot);

    const commitCall = mockRunCommand.mock.calls.find(
      (c) => c[0] === "git" && (c[1] as string[])[0] === "commit"
    );
    const pushCall = mockRunCommand.mock.calls.find(
      (c) => c[0] === "git" && (c[1] as string[])[0] === "push"
    );

    expect(commitCall).toBeUndefined();
    expect(pushCall).toBeUndefined();
  });

  it("preserves plain-text-graph.json in the repo directory", async () => {
    setupRepo();
    writeFileSync(resolve(repoDir, "plain-text-graph.json"), '{"plain":"data"}');

    writeFileSync(resolve(distDir, "plain-text-graph.json"), '{"new":"data"}');

    await updateGitHubPages("user/my-repo", "", projectRoot);

    expect(readFileSync(resolve(repoDir, "plain-text-graph.json"), "utf-8")).toBe(
      '{"plain":"data"}'
    );
  });

  it("encrypts graph.json when password is provided and no existing graph.json", async () => {
    setupRepo();
    writeFileSync(resolve(repoDir, "plain-text-graph.json"), '{"datums":[]}');

    await updateGitHubPages("user/my-repo", "secret", projectRoot);

    const graphContent = readFileSync(resolve(repoDir, "graph.json"), "utf-8");
    const envelope = JSON.parse(graphContent) as { graph_blob: string; version: number };
    expect(envelope.graph_blob).toBe('ENCRYPTED:{"datums":[]}');
    expect(envelope.version).toBe(0);
  });

  it("copies plain-text-graph.json to graph.json when no password", async () => {
    setupRepo();
    writeFileSync(resolve(repoDir, "plain-text-graph.json"), '{"datums":[]}');

    await updateGitHubPages("user/my-repo", "", projectRoot);

    expect(readFileSync(resolve(repoDir, "graph.json"), "utf-8")).toBe(
      '{"datums":[]}'
    );
  });

  it("seeds plain-text-graph.json from existing graph.json", async () => {
    setupRepo();
    writeFileSync(resolve(repoDir, "graph.json"), '{"existing":"data"}');

    await updateGitHubPages("user/my-repo", "", projectRoot);

    expect(existsSync(resolve(repoDir, "plain-text-graph.json"))).toBe(true);
    expect(readFileSync(resolve(repoDir, "plain-text-graph.json"), "utf-8")).toBe(
      '{"existing":"data"}'
    );
  });

  it("creates .gitignore with plain-text-graph.json entry", async () => {
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

    await updateGitHubPages("user/my-repo", "", projectRoot);

    const gitignore = readFileSync(resolve(repoDir, ".gitignore"), "utf-8");
    expect(gitignore).toContain("plain-text-graph.json");
  });

  // --- New encryption validation tests ---

  it("skips re-encryption when password matches and content unchanged", async () => {
    setupRepo();
    const plaintext = '{"datums":[],"version":1}';
    const envelope = JSON.stringify({ graph_blob: "BLOB", version: 1 });
    writeFileSync(resolve(repoDir, "graph.json"), envelope);
    writeFileSync(resolve(repoDir, "plain-text-graph.json"), plaintext);

    mockDecrypt.mockReturnValue(plaintext);

    await updateGitHubPages("user/my-repo", "secret", projectRoot);

    expect(mockDecrypt).toHaveBeenCalledWith("BLOB", "secret");
    expect(mockEncrypt).not.toHaveBeenCalled();
    // graph.json should not have been rewritten
    expect(readFileSync(resolve(repoDir, "graph.json"), "utf-8")).toBe(envelope);
  });

  it("re-encrypts when password matches but plaintext content changed", async () => {
    setupRepo();
    const oldPlaintext = '{"datums":[],"version":1}';
    const newPlaintext = '{"datums":[{"id":"1"}],"version":2}';
    const envelope = JSON.stringify({ graph_blob: "BLOB", version: 1 });
    writeFileSync(resolve(repoDir, "graph.json"), envelope);
    writeFileSync(resolve(repoDir, "plain-text-graph.json"), newPlaintext);

    mockDecrypt.mockReturnValue(oldPlaintext);

    await updateGitHubPages("user/my-repo", "secret", projectRoot);

    expect(mockEncrypt).toHaveBeenCalledWith(newPlaintext, "secret", 2);
  });

  it("prompts and re-encrypts with old password when password mismatch", async () => {
    setupRepo();
    const decryptedContent = '{"datums":[],"version":1}';
    const envelope = JSON.stringify({ graph_blob: "BLOB", version: 1 });
    writeFileSync(resolve(repoDir, "graph.json"), envelope);
    writeFileSync(resolve(repoDir, "plain-text-graph.json"), '{"stale":"data"}');

    // First call with configured password fails, second with old password succeeds
    mockDecrypt
      .mockImplementationOnce(() => { throw new Error("bad password"); })
      .mockReturnValueOnce(decryptedContent);

    mockPromptPassword.mockResolvedValue({ kind: "reencrypt", oldPassword: "oldpw" });

    await updateGitHubPages("user/my-repo", "newpw", projectRoot);

    expect(mockDecrypt).toHaveBeenCalledWith("BLOB", "newpw");
    expect(mockDecrypt).toHaveBeenCalledWith("BLOB", "oldpw");
    expect(mockEncrypt).toHaveBeenCalledWith(decryptedContent, "newpw", 1);
    // plain-text-graph.json should be updated with decrypted content
    expect(readFileSync(resolve(repoDir, "plain-text-graph.json"), "utf-8")).toBe(
      decryptedContent
    );
  });

  it("overwrites from plaintext when user chooses forgot password", async () => {
    setupRepo();
    const plaintext = '{"datums":[],"version":3}';
    const envelope = JSON.stringify({ graph_blob: "BLOB", version: 1 });
    writeFileSync(resolve(repoDir, "graph.json"), envelope);
    writeFileSync(resolve(repoDir, "plain-text-graph.json"), plaintext);

    mockDecrypt.mockImplementation(() => { throw new Error("bad password"); });
    mockPromptPassword.mockResolvedValue({ kind: "overwrite" });

    await updateGitHubPages("user/my-repo", "newpw", projectRoot);

    expect(mockEncrypt).toHaveBeenCalledWith(plaintext, "newpw", 3);
  });
});

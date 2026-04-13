import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { resolve, join, dirname } from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { loadAllConfigs, getConfigNames, loadUserConfig } from "./src/config/loadUserConfig.js";
import { promptConfigName } from "./src/config/promptConfigName.js";
import { DEFAULT_CONFIG_NAME } from "./src/config/userConfig.js";
import type { ExternalCortexConfig } from "./src/config/userConfig.js";
import { parseEnvelope } from "./src/encryption/parseEnvelope.js";

/**
 * Copies the sql.js WASM binary from node_modules into the public directory
 * so the browser can load it at runtime. Also serves .wasm files with the
 * correct MIME type to work around Vite 7's SPA fallback intercepting them.
 */
function sqlJsWasmPlugin(): Plugin {
  return {
    name: "copy-sql-js-wasm",
    buildStart() {
      const require = createRequire(import.meta.url);
      const sqlJsPath = dirname(require.resolve("sql.js"));
      const wasmSrc = resolve(sqlJsPath, "sql-wasm-browser.wasm");
      // Copy WASM into the active public dir (pages repo or local-storage)
      const wasmDest = resolve(publicDir, "sql-wasm-browser.wasm");

      if (existsSync(wasmSrc) && !existsSync(wasmDest)) {
        copyFileSync(wasmSrc, wasmDest);
      }
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.endsWith(".wasm")) {
          const publicDir = server.config.publicDir;
          const filePath = resolve(publicDir, req.url.slice(1));
          if (existsSync(filePath)) {
            res.setHeader("Content-Type", "application/wasm");
            res.end(readFileSync(filePath));
            return;
          }
        }
        next();
      });
    },
  };
}

async function resolveConfig() {
  const envConfigName = process.env.EC_CONFIG_NAME;
  if (envConfigName) {
    return loadUserConfig(envConfigName);
  }

  const allConfigs = loadAllConfigs();
  const namedConfigs = getConfigNames(allConfigs);

  let selectedName: string;
  if (namedConfigs.length === 0 && allConfigs[DEFAULT_CONFIG_NAME]) {
    selectedName = DEFAULT_CONFIG_NAME;
  } else {
    selectedName = await promptConfigName(namedConfigs, true);
  }

  return loadUserConfig(selectedName);
}

/**
 * If the selected config has a `githubRepoName`, clone or pull the
 * GitHub Pages repo into `pages/`.
 *
 * Returns the path to the repo directory, or null if no repo is configured.
 */
function syncPagesRepo(cfg: ExternalCortexConfig): string | null {
  if (!cfg.githubRepoName) return null;

  const fullRepoName = cfg.githubRepoName;
  const repoShortName = fullRepoName.split("/")[1]!;
  const pagesDir = resolve("pages");
  const repoDir = resolve(pagesDir, repoShortName);

  try {
    if (!existsSync(repoDir)) {
      console.log(`\nCloning ${fullRepoName} into pages/...`);
      mkdirSync(pagesDir, { recursive: true });
      execFileSync("gh", ["repo", "clone", fullRepoName, repoDir], {
        stdio: "inherit",
      });
    } else {
      console.log(`\nPulling latest from ${fullRepoName}...`);
      const httpsUrl = `https://github.com/${fullRepoName}.git`;
      execFileSync("git", ["remote", "set-url", "origin", httpsUrl], {
        cwd: repoDir,
      });
      execFileSync(
        "git",
        ["config", "--local", "credential.helper", "!gh auth git-credential"],
        { cwd: repoDir }
      );
      execFileSync("git", ["fetch", "origin", "main"], {
        cwd: repoDir,
        stdio: "inherit",
      });
      execFileSync("git", ["reset", "--hard", "origin/main"], {
        cwd: repoDir,
        stdio: "inherit",
      });
    }

    return repoDir;
  } catch (err) {
    console.warn(
      `\nWarning: Could not sync pages repo: ${err instanceof Error ? err.message : err}\n`
    );
    return null;
  }
}

/**
 * Seed plain-text-graph.json from graph.json if it doesn't exist yet.
 *
 * Only creates plain-text-graph.json when graph.json is unencrypted plaintext.
 * Never re-encrypts — encryption is handled exclusively by the deploy script
 * which validates the password before writing.
 */
function seedPlainTextGraph(repoDir: string): void {
  const plainTextPath = resolve(repoDir, "plain-text-graph.json");
  const graphPath = resolve(repoDir, "graph.json");

  if (existsSync(plainTextPath) || !existsSync(graphPath)) return;

  const existing = readFileSync(graphPath, "utf-8");
  const envelope = parseEnvelope(existing);

  if (!envelope) {
    // Plaintext graph.json — use as plain-text-graph.json
    writeFileSync(plainTextPath, existing, "utf-8");
    console.log("Created plain-text-graph.json from existing graph.json");
  } else {
    console.warn("Warning: graph.json appears encrypted but no plain-text-graph.json found.");
  }
}

const config = await resolveConfig();
const repoDir = syncPagesRepo(config);

if (repoDir) {
  seedPlainTextGraph(repoDir);
}

/**
 * Determine the publicDir for the dev server.
 *
 * If we have a pages repo, serve from there so graph.json is read
 * directly from the repo. Otherwise fall back to local-storage.
 */
const publicDir = repoDir ?? "local-storage";

/**
 * When the publicDir is a git repo (pages/), Vite's default copy tries to
 * copy `.git/` objects which have restricted permissions, causing EACCES.
 * This plugin disables the default public dir copy during build and
 * replaces it with one that skips `.git`.
 */
/**
 * Files/dirs that are produced by the Vite build itself (index.html, assets/).
 * These must NOT be overwritten by files from the public dir (pages repo).
 */
const BUILD_OUTPUT = new Set(["index.html", "assets"]);

function safePublicDirCopyPlugin(): Plugin {
  return {
    name: "safe-public-dir-copy",
    apply: "build",
    config() {
      return { build: { copyPublicDir: false } };
    },
    writeBundle() {
      const src = resolve(publicDir);
      const dest = resolve("dist");
      for (const entry of readdirSync(src)) {
        if (entry === ".git" || BUILD_OUTPUT.has(entry)) continue;
        cpSync(join(src, entry), join(dest, entry), { recursive: true });
      }
    },
  };
}

// For GitHub Pages, the site is served under /<repo-short-name>/
const base = config.hostingType === "GITHUB_PAGES" && config.githubRepoName
  ? `/${config.githubRepoName.split("/")[1]!}/`
  : "/";

export default defineConfig({
  base,
  plugins: [react(), sqlJsWasmPlugin(), safePublicDirCopyPlugin()],
  publicDir,
  define: {
    __EC_STORAGE_TYPE__: JSON.stringify(config.storageType),
    __EC_LOCAL_STORAGE_DIRECTORY__: JSON.stringify(config.localStorageDirectory),
    __EC_HOSTING_TYPE__: JSON.stringify(config.hostingType),
    __EC_UI_STYLE__: JSON.stringify(config.uiStyle),
    __EC_TEXT_PRIMARY__: JSON.stringify(config.colors.textPrimary),
    __EC_TEXT_SECONDARY__: JSON.stringify(config.colors.textSecondary),
    __EC_BACKGROUND__: JSON.stringify(config.colors.background),
    __EC_BORDER__: JSON.stringify(config.colors.border),
    __EC_ACCENT__: JSON.stringify(config.colors.accent),
    __EC_GITHUB_REPO_NAME__: JSON.stringify(config.githubRepoName),
  },
});

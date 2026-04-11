import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { copyFileSync, existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createRequire } from "node:module";
import { loadUserConfig } from "./src/config/loadUserConfig.js";

const config = loadUserConfig();

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
      const wasmDest = resolve("local-storage", "sql-wasm-browser.wasm");

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

export default defineConfig({
  plugins: [react(), sqlJsWasmPlugin()],
  publicDir: "local-storage",
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
  },
});

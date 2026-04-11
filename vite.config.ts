import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { loadUserConfig } from "./src/config/loadUserConfig.js";

const config = loadUserConfig();

export default defineConfig({
  plugins: [react()],
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

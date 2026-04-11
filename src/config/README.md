# Config

This folder contains all runtime configuration for External Cortex. Each file groups related settings by feature area (e.g. `external-storage.ts` holds storage-related config).

## User Configuration

Configuration values are loaded from the user's local machine at build time:

```
~/.external-cortex/config.json
```

If this file does not exist or is missing fields, the built-in defaults are used. The file is read once when Vite builds or serves the project, and the values are baked into the JavaScript bundle.

### Example `config.json`

```json
{
  "storageType": "LOCAL",
  "localStorageDirectory": "local-storage",
  "hostingType": "GITHUB_PAGES",
  "uiStyle": "BASIC_JSON",
  "colors": {
    "textPrimary": "#e0e0e0",
    "textSecondary": "#a0a0a0",
    "background": "#1a1a1a",
    "border": "#444444",
    "accent": "#6cb4ee"
  }
}
```

Every field is optional. Only include the values you want to override.

### How It Works

1. `userConfig.ts` defines the `ExternalCortexConfig` type and `CONFIG_DEFAULTS`.
2. `loadUserConfig.ts` reads `~/.external-cortex/config.json`, merges it with the defaults, and returns a complete config object. If the file is missing or invalid, the full defaults are returned.
3. `vite.config.ts` calls `loadUserConfig()` and uses Vite's `define` option to inject each value as a compile-time constant (e.g. `__EC_STORAGE_TYPE__`).
4. Each config file (`external-storage.ts`, `hosting.ts`, `ui-style.ts`, `colors.ts`) reads its value from the injected constant.
5. `globals.d.ts` provides TypeScript type declarations for the injected constants.

### Available Config Fields

| Field | Config File | Default | Description |
|---|---|---|---|
| `storageType` | `external-storage.ts` | `"LOCAL"` | Storage backend (`LOCAL`, `GITHUB`) |
| `localStorageDirectory` | `external-storage.ts` | `"local-storage"` | Path for local storage data files |
| `hostingType` | `hosting.ts` | `"GITHUB_PAGES"` | Hosting backend (`S3`, `GITHUB_PAGES`) |
| `uiStyle` | `ui-style.ts` | `"BASIC_JSON"` | UI rendering style (`BASIC_JSON`) |
| `colors.textPrimary` | `colors.ts` | `"#e0e0e0"` | Primary text color |
| `colors.textSecondary` | `colors.ts` | `"#a0a0a0"` | Secondary text color |
| `colors.background` | `colors.ts` | `"#1a1a1a"` | Page background color |
| `colors.border` | `colors.ts` | `"#444444"` | Border color |
| `colors.accent` | `colors.ts` | `"#6cb4ee"` | Accent color |

## Guidelines

- **Every config variable must have a detailed JSDoc comment** explaining its purpose, valid values, and any side-effects of changing it.
- Keep config files focused: one file per feature area.
- Use enums for values that have a fixed set of options so consumers get type-safe switches.
- When adding a new config value, add it to `ExternalCortexConfig` in `userConfig.ts`, the `CONFIG_DEFAULTS`, the `loadUserConfig` merge logic, the `define` block in `vite.config.ts`, a `declare` in `globals.d.ts`, and the table above.

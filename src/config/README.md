# Config

This folder contains all runtime configuration for External Cortex. Each file groups related settings by feature area (e.g. `external-storage.ts` holds storage-related config).

## Guidelines

- **Every config variable must have a detailed JSDoc comment** explaining its purpose, valid values, and any side-effects of changing it.
- Keep config files focused: one file per feature area.
- Use enums for values that have a fixed set of options so consumers get type-safe switches.

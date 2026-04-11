/**
 * Supported external storage backends.
 *
 * - `LOCAL`  - Read/write graph JSON from a directory on the local filesystem.
 * - `GITHUB` - Read/write graph JSON from a GitHub repository.
 */
export enum StorageType {
  LOCAL = "LOCAL",
  GITHUB = "GITHUB",
}

/**
 * The active storage backend used to persist the external graph.
 *
 * Value is loaded from `~/.external-cortex/config.json` at build time.
 * Defaults to `LOCAL` if no user config is found.
 */
export const STORAGE_TYPE: StorageType = __EC_STORAGE_TYPE__ as StorageType;

/**
 * The directory path (relative to the project root) where local storage
 * keeps its data files. Only used when `STORAGE_TYPE` is `LOCAL`.
 *
 * Value is loaded from `~/.external-cortex/config.json` at build time.
 * Defaults to `"local-storage"` if no user config is found.
 */
export const LOCAL_STORAGE_DIRECTORY: string = __EC_LOCAL_STORAGE_DIRECTORY__;

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
 * Change this value to switch between local and GitHub storage.
 */
export const STORAGE_TYPE: StorageType = StorageType.LOCAL;

/**
 * The directory path (relative to the project root) where local storage
 * keeps its data files. Only used when `STORAGE_TYPE` is `LOCAL`.
 */
export const LOCAL_STORAGE_DIRECTORY: string = "local-storage";

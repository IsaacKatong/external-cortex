/**
 * Persist and retrieve the GitHub personal access token from localStorage.
 *
 * The token is stored under a fixed key so it survives page reloads.
 */

const STORAGE_KEY = "ec_github_token";

/**
 * Save a GitHub token to localStorage.
 */
export function saveToken(token: string): void {
  localStorage.setItem(STORAGE_KEY, token);
}

/**
 * Load a previously saved GitHub token from localStorage.
 *
 * @returns The token string, or `null` if none is stored.
 */
export function loadToken(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

/**
 * Remove the stored GitHub token from localStorage.
 */
export function clearToken(): void {
  localStorage.removeItem(STORAGE_KEY);
}

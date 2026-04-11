/**
 * GitHub authentication state managed by the auth context.
 */
export type GitHubAuthState = {
  /** The GitHub personal access token, or `null` if not signed in. */
  token: string | null;
  /** The authenticated GitHub username, or `null` if not signed in. */
  username: string | null;
  /** Current authentication status. */
  status: "signed_out" | "validating" | "signed_in" | "error";
  /** Human-readable error message when `status` is `"error"`. */
  errorMessage: string | null;
};

/**
 * Values exposed by the GitHub auth context to consumers.
 */
export type GitHubAuthContextValue = {
  /** Current authentication state. */
  auth: GitHubAuthState;
  /** Sign in with a personal access token. Validates it against the GitHub API. */
  signIn: (token: string) => Promise<void>;
  /** Sign out and clear the stored token. */
  signOut: () => void;
};

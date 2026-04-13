import { HostingType, HOSTING_TYPE } from "../config/hosting.js";
import { useGitHubAuth } from "./github-auth/GitHubAuthContext.js";

/**
 * Determines whether the current user is authenticated to make changes
 * to the graph JSON, based on the hosting configuration.
 *
 * - `GITHUB_PAGES`: Requires a valid GitHub token (user must be signed in).
 * - `S3`: Currently always returns true (no auth gate).
 *
 * This is a React hook because it reads from the GitHubAuth context.
 *
 * @returns `true` if the user can add/edit graph data, `false` otherwise.
 */
export function useCanEditGraph(): boolean {
  const { auth } = useGitHubAuth();

  switch (HOSTING_TYPE) {
    case HostingType.GITHUB_PAGES:
      return auth.status === "signed_in";
    case HostingType.S3:
      // S3 hosting does not currently require auth to edit locally
      return true;
    default:
      return false;
  }
}

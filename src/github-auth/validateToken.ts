/**
 * Validate a GitHub personal access token by calling the GitHub API.
 *
 * @param token - The PAT to validate.
 * @returns The authenticated GitHub username if the token is valid.
 * @throws If the token is invalid or the request fails.
 */
export async function validateToken(token: string): Promise<string> {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Invalid or expired token");
    }
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const data = (await response.json()) as { login: string };
  return data.login;
}

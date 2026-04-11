/**
 * Commit a file to a GitHub repository via the Contents API.
 *
 * Uses the two-step flow:
 * 1. GET the current file to retrieve its SHA (needed for updates).
 * 2. PUT the new content with the SHA and a commit message.
 *
 * @see https://docs.github.com/en/rest/repos/contents#create-or-update-file-contents
 */

/**
 * Result of fetching the current file from the GitHub Contents API.
 */
type FileInfo = {
  /** The blob SHA of the current file, needed to update it. */
  sha: string;
};

/**
 * Fetch the current SHA of a file in a GitHub repository.
 *
 * @param token - GitHub personal access token.
 * @param repoFullName - Full repository name in `owner/repo` format.
 * @param path - File path within the repository.
 * @returns The file's SHA, or `null` if the file does not exist (404).
 */
export async function getFileSha(
  token: string,
  repoFullName: string,
  path: string
): Promise<string | null> {
  const response = await fetch(
    `https://api.github.com/repos/${repoFullName}/contents/${path}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`GitHub API error fetching ${path}: ${response.status}`);
  }

  const data = (await response.json()) as FileInfo;
  return data.sha;
}

/**
 * Commit an updated `graph.json` to a GitHub repository.
 *
 * If the file already exists, it is updated in-place (requires the current SHA).
 * If the file does not exist, it is created.
 *
 * @param token - GitHub personal access token with `repo` or Contents write scope.
 * @param repoFullName - Full repository name in `owner/repo` format.
 * @param content - The JSON string to commit as the file content.
 * @param message - Commit message. Defaults to a generic message.
 * @throws If the GitHub API returns an error (e.g. 409 conflict, 401 unauthorized).
 */
export async function commitGraphJson(
  token: string,
  repoFullName: string,
  content: string,
  message: string = "Update graph.json via External Cortex"
): Promise<void> {
  const path = "graph.json";
  const sha = await getFileSha(token, repoFullName, path);

  const body: Record<string, string> = {
    message,
    content: encodeBase64(content),
  };

  if (sha !== null) {
    body["sha"] = sha;
  }

  const response = await fetch(
    `https://api.github.com/repos/${repoFullName}/contents/${path}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `GitHub API error committing ${path}: ${response.status} ${errorText}`
    );
  }
}

/**
 * Encode a string to base64, handling Unicode characters correctly.
 */
function encodeBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

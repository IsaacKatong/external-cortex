/**
 * Commit a file to a GitHub repository via the Contents API, using a
 * pull-request workflow with version checking.
 *
 * Flow:
 * 1. GET the current file SHA and default branch SHA.
 * 2. Create a feature branch.
 * 3. PUT the new content onto the feature branch.
 * 4. Open a pull request.
 * 5. Read the current version from main and validate the new version.
 * 6. If the version check passes, merge and delete the branch.
 *
 * @see https://docs.github.com/en/rest/repos/contents#create-or-update-file-contents
 * @see https://docs.github.com/en/rest/pulls/pulls#create-a-pull-request
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
 * @param ref - Optional git ref (branch) to read the file from.
 * @returns The file's SHA, or `null` if the file does not exist (404).
 */
export async function getFileSha(
  token: string,
  repoFullName: string,
  path: string,
  ref?: string
): Promise<string | null> {
  const url = new URL(
    `https://api.github.com/repos/${repoFullName}/contents/${path}`
  );
  if (ref) {
    url.searchParams.set("ref", ref);
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
    cache: "no-store",
  });

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
 * Read the current version from the graph.json on the default branch.
 *
 * Works for both encrypted envelopes (`{ graph_blob, version }`) and
 * plain-text graphs (`{ version, datums, ... }`).
 *
 * @returns The current version number, or 0 if the file doesn't exist or has no version.
 */
export async function getRemoteVersion(
  token: string,
  repoFullName: string
): Promise<number> {
  const raw = await downloadGraphJson(token, repoFullName);
  if (!raw) return 0;

  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed.version === "number") {
      return parsed.version;
    }
  } catch {
    // Legacy raw base64 format — no version
  }
  return 0;
}

/**
 * Get the SHA of the latest commit on the default branch.
 */
async function getBranchSha(
  token: string,
  repoFullName: string,
  branch: string = "main"
): Promise<string> {
  const response = await fetch(
    `https://api.github.com/repos/${repoFullName}/git/ref/heads/${branch}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `GitHub API error fetching branch ${branch}: ${response.status}`
    );
  }

  const data = (await response.json()) as { object: { sha: string } };
  return data.object.sha;
}

/**
 * Create a new branch from the given commit SHA.
 */
async function createBranch(
  token: string,
  repoFullName: string,
  branchName: string,
  fromSha: string
): Promise<void> {
  const response = await fetch(
    `https://api.github.com/repos/${repoFullName}/git/refs`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: fromSha,
      }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `GitHub API error creating branch ${branchName}: ${response.status} ${errorText}`
    );
  }
}

/**
 * Delete a branch reference.
 */
async function deleteBranch(
  token: string,
  repoFullName: string,
  branchName: string
): Promise<void> {
  await fetch(
    `https://api.github.com/repos/${repoFullName}/git/refs/heads/${branchName}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
      cache: "no-store",
    }
  );
}

/**
 * Create a pull request.
 *
 * @returns The pull request number.
 */
async function createPullRequest(
  token: string,
  repoFullName: string,
  head: string,
  base: string,
  title: string,
  body: string
): Promise<number> {
  const response = await fetch(
    `https://api.github.com/repos/${repoFullName}/pulls`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, body, head, base }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `GitHub API error creating PR: ${response.status} ${errorText}`
    );
  }

  const data = (await response.json()) as { number: number };
  return data.number;
}

/**
 * Merge a pull request using the merge method.
 */
async function mergePullRequest(
  token: string,
  repoFullName: string,
  prNumber: number,
  commitMessage: string
): Promise<void> {
  const response = await fetch(
    `https://api.github.com/repos/${repoFullName}/pulls/${prNumber}/merge`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        commit_title: commitMessage,
        merge_method: "squash",
      }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `GitHub API error merging PR #${prNumber}: ${response.status} ${errorText}`
    );
  }
}

/**
 * Commit an updated `graph.json` to a GitHub repository via a pull request.
 *
 * Creates a feature branch, commits the file, opens a PR, validates the
 * version is exactly `remoteVersion + 1`, merges, and cleans up.
 *
 * @param token - GitHub personal access token with `repo` or Contents write scope.
 * @param repoFullName - Full repository name in `owner/repo` format.
 * @param content - The JSON string to commit as the file content.
 * @param message - Commit message. Defaults to a generic message.
 * @throws If the version check fails or any GitHub API call errors.
 */
export async function commitGraphJson(
  token: string,
  repoFullName: string,
  content: string,
  message: string = "Update graph.json via External Cortex"
): Promise<void> {
  const path = "graph.json";

  // 1. Read the current remote version from main
  const remoteVersion = await getRemoteVersion(token, repoFullName);

  // 2. Parse the new version from the content being pushed
  let newVersion = 0;
  try {
    const parsed = JSON.parse(content);
    if (typeof parsed.version === "number") {
      newVersion = parsed.version;
    }
  } catch {
    // Non-JSON content (shouldn't happen with the new format)
  }

  // 3. Validate: new version must be exactly remote + 1
  if (newVersion !== remoteVersion + 1) {
    throw new Error(
      `Version conflict: remote is v${remoteVersion}, trying to push v${newVersion}. ` +
        `Expected v${remoteVersion + 1}. Reload to get the latest version.`
    );
  }

  // 4. Get latest main branch SHA and create a feature branch
  const mainSha = await getBranchSha(token, repoFullName, "main");
  const branchName = `ec/update-graph-v${newVersion}`;

  // Clean up any stale branch with the same name
  await deleteBranch(token, repoFullName, branchName);
  await createBranch(token, repoFullName, branchName, mainSha);

  try {
    // 5. Get the file SHA on the new branch (same as main) and commit
    const sha = await getFileSha(token, repoFullName, path, branchName);

    const body: Record<string, string> = {
      message,
      content: encodeBase64(content),
      branch: branchName,
    };

    if (sha !== null) {
      body["sha"] = sha;
    }

    const putResponse = await fetch(
      `https://api.github.com/repos/${repoFullName}/contents/${path}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      }
    );

    if (!putResponse.ok) {
      const errorText = await putResponse.text();
      throw new Error(
        `GitHub API error committing ${path}: ${putResponse.status} ${errorText}`
      );
    }

    // 6. Create a pull request
    const prNumber = await createPullRequest(
      token,
      repoFullName,
      branchName,
      "main",
      `Update graph.json to v${newVersion}`,
      `Automated update from External Cortex.\n\n` +
        `- Previous version: v${remoteVersion}\n` +
        `- New version: v${newVersion}\n`
    );

    // 7. Version check already passed above — merge the PR
    await mergePullRequest(
      token,
      repoFullName,
      prNumber,
      `Update graph.json to v${newVersion}`
    );

    // 8. Clean up the feature branch
    await deleteBranch(token, repoFullName, branchName);
  } catch (err) {
    // Clean up the branch on failure
    await deleteBranch(token, repoFullName, branchName).catch(() => {});
    throw err;
  }
}

/**
 * Download the raw content of `graph.json` from a GitHub repository.
 *
 * Uses the Contents API with the raw media type to get the file content
 * directly, bypassing GitHub Pages caching.
 *
 * @param token - GitHub personal access token.
 * @param repoFullName - Full repository name in `owner/repo` format.
 * @returns The raw file content as a string, or `null` if unavailable.
 */
export async function downloadGraphJson(
  token: string,
  repoFullName: string
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${repoFullName}/contents/graph.json`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.raw+json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
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

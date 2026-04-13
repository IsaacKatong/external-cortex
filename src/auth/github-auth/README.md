# GitHub Authentication

External Cortex uses a GitHub **fine-grained Personal Access Token (PAT)** to persist graph changes back to your GitHub Pages repository. When you edit the graph in the browser, the app commits the updated `graph.json` directly via the GitHub API.

## Creating a Fine-Grained Personal Access Token

1. Go to [GitHub > Settings > Developer settings > Personal access tokens > Fine-grained tokens](https://github.com/settings/personal-access-tokens/new).

2. Fill in the token details:

   | Field | Value |
   |-------|-------|
   | **Token name** | `External Cortex` (or any name you prefer) |
   | **Expiration** | Choose an expiration that suits you (e.g. 90 days) |
   | **Resource owner** | Your GitHub account |

3. Under **Repository access**, select **Only select repositories**, then pick your External Cortex GitHub Pages repository (e.g. `external-cortext-github-hosting-test`).

4. Under **Permissions > Repository permissions**, set the following:

   | Permission | Access level |
   |------------|-------------|
   | **Contents** | **Read and write** |

   Leave all other permissions at their defaults (no access). This is the only permission needed — it allows the app to read the current `graph.json` and commit updates.

5. Click **Generate token** and copy the token.

## Using the Token

1. Open your External Cortex site in the browser.
2. Click **Sign in to GitHub** in the header bar.
3. Paste your token into the input field and click **Connect**.
4. The app validates the token against the GitHub API. On success, your GitHub username appears in the header.

The token is stored in your browser's `localStorage` and persists across page reloads. You only need to enter it once per browser.

## How Sync Works

Once signed in:

- Every time you add a datum, edge, tag, dimension, or association, the graph is marked as **unsaved**.
- After 1 second of inactivity, the app automatically exports the full graph from the in-memory database, serializes it to JSON, and commits it to `graph.json` in your repository via the GitHub Contents API.
- You can also click **Save now** to push immediately.
- The sync status indicator in the header shows the current state: **Saved**, **Unsaved changes**, **Saving...**, or **Save failed**.

## Security Notes

- **Minimal scope**: The token only needs `Contents: Read and write` on a single repository. It cannot access your other repositories, profile, or settings.
- **Browser storage**: The token is stored in `localStorage`. Any XSS vulnerability on the page could expose it. Since External Cortex is a personal single-user tool, this risk is generally acceptable.
- **Revoking access**: You can revoke the token at any time from [GitHub > Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens?type=beta). The app will show a signed-out state on next page load.
- **No client secret**: No OAuth app or client secret is involved. The token is created and managed entirely by you.

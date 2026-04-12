# GitHub Actions Workflows

## check-graph-version.yml

Validates that `graph.json` updates follow the versioning protocol:

- Runs on pull requests that modify `graph.json`.
- Reads the `version` field from both the PR and base branch.
- Ensures the new version is exactly `base_version + 1`.
- Works with both plaintext and encrypted envelope formats (both have a top-level `version` field).

This workflow is designed to be used as a **required status check** on the GitHub Pages hosting repository to prevent concurrent update conflicts.

## deploy-github-pages.yml

Deploys the External Cortex site to GitHub Pages.

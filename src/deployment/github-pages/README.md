# GitHub Pages Deployment

Deploys External Cortex to a GitHub repository with GitHub Pages enabled. The deployment flow:

1. **Prompt** - Suggests a repository name and lets the user approve or change it.
2. **Create** - Creates a new public GitHub repository via the `gh` CLI.
3. **Build** - Runs `vite build` with the correct base path (`/<repo-name>/`).
4. **Upload** - Initializes a git repo in the build output, pushes to the remote, and enables GitHub Pages.

## Usage

```bash
npm run deploy:github-pages
```

## Prerequisites

- The [GitHub CLI (`gh`)](https://cli.github.com/) must be installed and authenticated.
- Node.js 18+ (as specified in `.nvmrc`).

### Installing and Authenticating `gh`

1. Install via Homebrew:

   ```bash
   brew install gh
   ```

2. Authenticate:

   ```bash
   gh auth login
   ```

   Select **GitHub.com**, your preferred protocol (HTTPS is easiest), and follow the browser-based authentication flow.

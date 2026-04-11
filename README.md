# external-cortex
External Cortex functions as an extension of your brain. It ingests your stimulus and presents it in a way meant for you to understand.

## Versions

| Tool | Version |
|------|---------|
| Node.js | v24.14.1 |
| npm | v11.11.0 |
| Vite | v7.3.2 |
| Vitest | v4.1.4 |

Node.js is pinned in `.nvmrc`. If you use [nvm](https://github.com/nvm-sh/nvm), run:

```bash
nvm use
```

This reads the `.nvmrc` and switches to the correct version. If you don't have it installed yet:

```bash
nvm install
```

After upgrading Node, always re-run `npm install` to rebuild native dependencies.

**Note:** Vite 7's SPA fallback intercepts `.wasm` file requests. The project includes a custom Vite plugin (`sqlJsWasmPlugin` in `vite.config.ts`) that serves `.wasm` files with the correct MIME type and auto-copies the sql.js WASM binary from `node_modules` into `local-storage/`.

## Setup

```bash
npm install
```

## Starting the Dev Server

1. Place your graph JSON file at `local-storage/graph.json`. See `src/external-storage/SCHEMA.md` for the expected format.

2. Start the Vite dev server:

```bash
npm run dev
```

3. Open `http://localhost:5173` in your browser.

The dev server serves files from `local-storage/` as static assets, so `local-storage/graph.json` becomes available at `/graph.json`. The app fetches this file on load, parses it, and renders the UI.

## Production Build

Build the app into static files ready for S3 or any static hosting:

```bash
npm run build
```

This outputs a `dist/` folder containing:

- `index.html` — the entry page
- `assets/` — the bundled JavaScript
- `graph.json` — copied from `local-storage/graph.json`

To preview the production build locally before deploying:

```bash
npm run preview
```

### Deploying to GitHub Pages

Host External Cortex as a free website using GitHub Pages. No manual GitHub configuration required.

#### Prerequisites

1. Install the [GitHub CLI](https://cli.github.com/):

   ```bash
   brew install gh
   ```

2. Authenticate with your GitHub account:

   ```bash
   gh auth login
   ```

   Select **GitHub.com**, choose your preferred protocol (SSH or HTTPS), and follow the prompts.

#### First-Time Setup

Run the deploy command:

```bash
npm run deploy:github-pages
```

This will:

1. Suggest a repository name — press Enter to accept or type a new name.
2. Create a new public GitHub repository under your account.
3. Build the site with the correct base path for GitHub Pages.
4. Push the built files and enable GitHub Pages automatically.

Once complete, the command prints your live site URL (e.g. `https://<user>.github.io/<repo>/`). GitHub Pages may take a few minutes to become available after the first deploy.

#### Updating the Site

After changing your graph data or code, redeploy by running the same command:

```bash
npm run deploy:github-pages
```

If the repository already exists, you can also rebuild and push manually:

```bash
npm run build -- --base /<repo-name>/
```

Then push the contents of `dist/` to the repository's `main` branch. The site updates automatically when GitHub Pages detects the new commit.

#### Manual Deployment from GitHub UI

You can also trigger a deployment directly from the GitHub Actions UI without using the CLI:

1. Go to the **Actions** tab in the GitHub repository.
2. Select the **Deploy to GitHub Pages** workflow.
3. Click **Run workflow**.
4. Optionally enter a target repository name. Leave empty to deploy to the current repo's own GitHub Pages.
5. Click **Run workflow** to start the build and deploy.

The workflow handles building with the correct base path and deploying automatically.

#### Configuration

The hosting type is set in `src/config/hosting.ts`:

```ts
export const HOSTING_TYPE: HostingType = HostingType.GITHUB_PAGES;
```

The deploy script automatically detects whether your `gh` CLI is configured for SSH or HTTPS and uses the correct git remote URL.

### Deploying to S3

1. Run `npm run build`.
2. Upload the contents of `dist/` to your S3 bucket.
3. To use a different graph, replace `graph.json` in the bucket with your own (see `src/external-storage/SCHEMA.md` for the format).
4. Point your domain at the bucket and ensure `index.html` is set as the index document.

## Running Tests

```bash
npm test
```

## UI

The UI renders the external graph using React. The rendering style is controlled by the `UI_STYLE` config in `src/config/ui-style.ts`.

### Available UI Styles

| Style | Description |
|-------|-------------|
| `BASIC_JSON` | Displays all datums and edges as formatted JSON with tag-based filtering. |

### Changing the UI Style

Open `src/config/ui-style.ts` and set `UI_STYLE` to the desired value:

```ts
export const UI_STYLE: UIStyle = UIStyle.BASIC_JSON;
```

### How It Works

1. The dev server loads `local-storage/graph.json` and parses it into the external graph data model.
2. The `ExternalGraphView` component reads `UI_STYLE` and renders the matching view.
3. In `BASIC_JSON` mode, all datums and edges are shown as JSON. Use the tag checkboxes to filter datums by datum tags and edges by edge tags.

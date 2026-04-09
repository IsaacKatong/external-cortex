# external-cortex
External Cortex functions as an extension of your brain. It ingests your stimulus and presents it in a way meant for you to understand.

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

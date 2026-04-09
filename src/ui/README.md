# UI

This folder contains the React components that render the external graph. The top-level `ExternalGraphView` component reads the `UI_STYLE` config to decide which view to display.

## Structure

- `ExternalGraphView.tsx` - Entry-point component that routes to the active UI style.
- `basic-json/` - The **Basic JSON** view: displays datums and edges as formatted JSON with tag-based filtering.

## Adding a new UI style

1. Add a new value to the `UIStyle` enum in `src/config/ui-style.ts`.
2. Create a new subfolder here with its own `README.md`.
3. Wire the new style into `ExternalGraphView.tsx`.

/**
 * Supported UI rendering styles for displaying the external graph.
 *
 * - `BASIC_JSON` - Renders datums and edges as raw JSON with tag-based filtering.
 *                  This is the simplest view, useful for debugging and initial development.
 *
 * Additional styles (e.g. graph visualizations) can be added here as the UI evolves.
 */
export enum UIStyle {
  BASIC_JSON = "BASIC_JSON",
}

/**
 * The active UI style used to render the external graph.
 *
 * Value is loaded from `~/.external-cortex/config.json` at build time.
 * Defaults to `BASIC_JSON` if no user config is found.
 */
export const UI_STYLE: UIStyle = __EC_UI_STYLE__ as UIStyle;

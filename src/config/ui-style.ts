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
 * Change this value to switch between different rendering modes.
 * Components should read this config to decide which view to mount.
 */
export const UI_STYLE: UIStyle = UIStyle.BASIC_JSON;

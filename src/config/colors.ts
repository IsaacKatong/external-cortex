/**
 * Application color palette.
 *
 * All UI colors are defined here so they can be changed in one place.
 * Components should import from this file rather than hard-coding color values.
 *
 * Values are loaded from `~/.external-cortex/config.json` at build time.
 * If no user config is found, the defaults below are used.
 */

/** Primary text color used for body copy, headings, and JSON output. */
export const TEXT_PRIMARY: string = __EC_TEXT_PRIMARY__;

/** Secondary text color used for less prominent labels and counts. */
export const TEXT_SECONDARY: string = __EC_TEXT_SECONDARY__;

/** Page background color. */
export const BACKGROUND: string = __EC_BACKGROUND__;

/** Border color for fieldsets, cards, and other containers. */
export const BORDER: string = __EC_BORDER__;

/** Accent color for interactive elements like checkboxes and links. */
export const ACCENT: string = __EC_ACCENT__;

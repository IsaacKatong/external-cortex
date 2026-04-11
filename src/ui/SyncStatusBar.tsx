import type { ReactNode } from "react";
import type { SyncStatus } from "../external-storage/useSyncStatus.js";
import { TEXT_SECONDARY, ACCENT, BORDER } from "../config/colors.js";

export type SyncStatusBarProps = {
  status: SyncStatus;
  errorMessage: string | null;
  onSave: () => void;
};

const STATUS_DISPLAY: Record<
  SyncStatus,
  { label: string; color: string }
> = {
  synced: { label: "Saved", color: "#98c379" },
  unsaved: { label: "Unsaved changes", color: "#e5c07b" },
  syncing: { label: "Saving...", color: ACCENT },
  error: { label: "Save failed", color: "#e06c75" },
};

/**
 * Displays the current sync status and a manual save button.
 */
export function SyncStatusBar({
  status,
  errorMessage,
  onSave,
}: SyncStatusBarProps): ReactNode {
  const { label, color } = STATUS_DISPLAY[status];

  return (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 13,
      }}
    >
      <span
        style={{
          display: "inline-block",
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: color,
        }}
      />
      <span style={{ color: TEXT_SECONDARY }}>{label}</span>
      {status === "error" && errorMessage && (
        <span style={{ color: "#e06c75", fontSize: 12 }}>
          ({errorMessage})
        </span>
      )}
      {(status === "unsaved" || status === "error") && (
        <button
          onClick={onSave}
          style={{
            background: "none",
            border: `1px solid ${BORDER}`,
            color: ACCENT,
            cursor: "pointer",
            padding: "2px 10px",
            borderRadius: 4,
            fontSize: 12,
          }}
        >
          Save now
        </button>
      )}
    </span>
  );
}

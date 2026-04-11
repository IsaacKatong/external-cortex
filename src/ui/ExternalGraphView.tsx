import type { ReactNode } from "react";
import type { Database } from "sql.js";
import type { ExternalGraph } from "../external-storage/types.js";
import type { GraphRepository } from "../repository/GraphRepository.js";
import { UI_STYLE, UIStyle } from "../config/ui-style.js";
import { GITHUB_REPO_NAME } from "../config/github.js";
import { useGitHubAuth } from "../github-auth/GitHubAuthContext.js";
import { useSyncStatus } from "../external-storage/useSyncStatus.js";
import { GitHubAuthButton } from "./GitHubAuthButton.js";
import { SyncStatusBar } from "./SyncStatusBar.js";
import { BasicJsonView } from "./basic-json/BasicJsonView.js";
import { TEXT_SECONDARY, BORDER, BACKGROUND } from "../config/colors.js";

export type ExternalGraphViewProps = {
  graph: ExternalGraph;
  repository?: GraphRepository;
  db?: Database;
};

export function ExternalGraphView({
  graph,
  repository,
  db,
}: ExternalGraphViewProps): ReactNode {
  const { auth } = useGitHubAuth();
  const { status, errorMessage, markDirty, forceSave } = useSyncStatus(
    db ?? null,
    auth.token,
    GITHUB_REPO_NAME
  );

  const showGitHub = GITHUB_REPO_NAME.length > 0;

  const view = (() => {
    switch (UI_STYLE) {
      case UIStyle.BASIC_JSON:
        return (
          <BasicJsonView
            graph={graph}
            {...(repository ? { repository } : {})}
            onMutation={showGitHub && auth.status === "signed_in" ? markDirty : undefined}
          />
        );
    }
  })();

  if (!showGitHub) {
    return view;
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 16px",
          borderBottom: `1px solid ${BORDER}`,
          backgroundColor: BACKGROUND,
          fontSize: 13,
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <GitHubAuthButton />
        {auth.status === "signed_in" && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: TEXT_SECONDARY, fontSize: 12 }}>
              {GITHUB_REPO_NAME}
            </span>
            <SyncStatusBar
              status={status}
              errorMessage={errorMessage}
              onSave={() => { forceSave(); }}
            />
          </div>
        )}
      </div>
      {view}
    </>
  );
}

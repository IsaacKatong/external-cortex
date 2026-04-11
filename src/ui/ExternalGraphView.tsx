import type { ReactNode } from "react";
import type { ExternalGraph } from "../external-storage/types.js";
import type { GraphRepository } from "../repository/GraphRepository.js";
import { UI_STYLE, UIStyle } from "../config/ui-style.js";
import { BasicJsonView } from "./basic-json/BasicJsonView.js";

export type ExternalGraphViewProps = {
  graph: ExternalGraph;
  repository?: GraphRepository;
};

export function ExternalGraphView({
  graph,
  repository,
}: ExternalGraphViewProps): ReactNode {
  switch (UI_STYLE) {
    case UIStyle.BASIC_JSON:
      return <BasicJsonView graph={graph} {...(repository ? { repository } : {})} />;
  }
}

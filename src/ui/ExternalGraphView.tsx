import type { ReactNode } from "react";
import type { ExternalGraph } from "../external-storage/types.js";
import { UI_STYLE, UIStyle } from "../config/ui-style.js";
import { BasicJsonView } from "./basic-json/BasicJsonView.js";

export type ExternalGraphViewProps = {
  graph: ExternalGraph;
};

export function ExternalGraphView({
  graph,
}: ExternalGraphViewProps): ReactNode {
  switch (UI_STYLE) {
    case UIStyle.BASIC_JSON:
      return <BasicJsonView graph={graph} />;
  }
}

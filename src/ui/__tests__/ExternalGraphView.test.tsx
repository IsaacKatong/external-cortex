import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ExternalGraphView } from "../ExternalGraphView.js";
import { createTestGraph } from "../__fixtures__/graphData.js";

afterEach(cleanup);

describe("ExternalGraphView", () => {
  it("renders the basic JSON view heading", () => {
    const graph = createTestGraph();
    render(<ExternalGraphView graph={graph} />);
    expect(
      screen.getByText("External Graph — Basic JSON View")
    ).toBeDefined();
  });

  it("renders datums from the graph", () => {
    const graph = createTestGraph();
    render(<ExternalGraphView graph={graph} />);
    expect(screen.getByText(/Note A/)).toBeDefined();
    expect(screen.getByText(/Note B/)).toBeDefined();
    expect(screen.getByText(/Note C/)).toBeDefined();
  });
});

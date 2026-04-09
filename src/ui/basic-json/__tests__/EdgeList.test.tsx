import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { EdgeList } from "../EdgeList.js";
import { createTestGraph } from "../../__fixtures__/graphData.js";

afterEach(cleanup);

describe("EdgeList", () => {
  it("shows a message when there are no edges", () => {
    render(<EdgeList edges={[]} edgeTags={[]} />);
    expect(screen.getByText("No edges to display.")).toBeDefined();
  });

  it("renders all provided edges", () => {
    const graph = createTestGraph();
    render(<EdgeList edges={graph.edges} edgeTags={graph.edgeTags} />);
    expect(screen.getByText(/Edges \(2\)/)).toBeDefined();
    expect(screen.getByTestId("edge-d1->d2")).toBeDefined();
    expect(screen.getByTestId("edge-d2->d3")).toBeDefined();
  });

  it("includes tags in the JSON output", () => {
    const graph = createTestGraph();
    render(<EdgeList edges={graph.edges} edgeTags={graph.edgeTags} />);
    const edge = screen.getByTestId("edge-d1->d2");
    expect(edge.textContent).toContain('"causal"');
    expect(edge.textContent).toContain('"temporal"');
  });
});

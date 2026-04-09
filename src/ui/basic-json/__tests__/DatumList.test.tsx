import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { DatumList } from "../DatumList.js";
import { createTestGraph } from "../../__fixtures__/graphData.js";

afterEach(cleanup);

describe("DatumList", () => {
  it("shows a message when there are no datums", () => {
    render(<DatumList datums={[]} datumTags={[]} datumDimensions={[]} />);
    expect(screen.getByText("No datums to display.")).toBeDefined();
  });

  it("renders all provided datums", () => {
    const graph = createTestGraph();
    render(
      <DatumList
        datums={graph.datums}
        datumTags={graph.datumTags}
        datumDimensions={graph.datumDimensions}
      />
    );
    expect(screen.getByText(/Datums \(3\)/)).toBeDefined();
    expect(screen.getByTestId("datum-d1")).toBeDefined();
    expect(screen.getByTestId("datum-d2")).toBeDefined();
    expect(screen.getByTestId("datum-d3")).toBeDefined();
  });

  it("includes tags and dimensions in the JSON output", () => {
    const graph = createTestGraph();
    render(
      <DatumList
        datums={graph.datums}
        datumTags={graph.datumTags}
        datumDimensions={graph.datumDimensions}
      />
    );
    const d1 = screen.getByTestId("datum-d1");
    expect(d1.textContent).toContain('"science"');
    expect(d1.textContent).toContain('"history"');
    expect(d1.textContent).toContain('"importance"');
  });
});

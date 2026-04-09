import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { BasicJsonView } from "../BasicJsonView.js";
import { createTestGraph } from "../../__fixtures__/graphData.js";

afterEach(cleanup);

describe("BasicJsonView", () => {
  it("renders the heading", () => {
    render(<BasicJsonView graph={createTestGraph()} />);
    expect(
      screen.getByText("External Graph — Basic JSON View")
    ).toBeDefined();
  });

  it("shows all datums and edges by default", () => {
    render(<BasicJsonView graph={createTestGraph()} />);
    expect(screen.getByText(/Datums \(3\)/)).toBeDefined();
    expect(screen.getByText(/Edges \(2\)/)).toBeDefined();
  });

  it("filters datums by selected tag", () => {
    render(<BasicJsonView graph={createTestGraph()} />);

    // Select "science" tag — d1 and d2 have this tag
    fireEvent.click(screen.getByLabelText("science"));

    expect(screen.getByText(/Datums \(2\)/)).toBeDefined();
    expect(screen.getByTestId("datum-d1")).toBeDefined();
    expect(screen.getByTestId("datum-d2")).toBeDefined();
    expect(screen.queryByTestId("datum-d3")).toBeNull();
  });

  it("filters edges by selected tag", () => {
    render(<BasicJsonView graph={createTestGraph()} />);

    // Select "temporal" edge tag — only d1->d2 has it
    fireEvent.click(screen.getByLabelText("temporal"));

    expect(screen.getByText(/Edges \(1\)/)).toBeDefined();
    expect(screen.getByTestId("edge-d1->d2")).toBeDefined();
    expect(screen.queryByTestId("edge-d2->d3")).toBeNull();
  });

  it("removes filter when tag is deselected", () => {
    render(<BasicJsonView graph={createTestGraph()} />);

    fireEvent.click(screen.getByLabelText("science"));
    expect(screen.getByText(/Datums \(2\)/)).toBeDefined();

    fireEvent.click(screen.getByLabelText("science"));
    expect(screen.getByText(/Datums \(3\)/)).toBeDefined();
  });
});

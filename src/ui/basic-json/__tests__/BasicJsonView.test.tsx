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
    expect(screen.getByText(/Datums\s*\(\s*3\s*\)/)).toBeDefined();
    expect(screen.getByText(/Edges\s*\(\s*2\s*\)/)).toBeDefined();
  });

  it("filters datums by selected tag", () => {
    render(<BasicJsonView graph={createTestGraph()} />);

    // Select "science" tag — d1 and d2 have this tag
    fireEvent.click(screen.getByLabelText("science"));

    expect(screen.getByText(/Datums\s*\(\s*2\s*\)/)).toBeDefined();
    expect(screen.getByTestId("datums-d1")).toBeDefined();
    expect(screen.getByTestId("datums-d2")).toBeDefined();
    expect(screen.queryByTestId("datums-d3")).toBeNull();
  });

  it("filters edges by selected tag", () => {
    render(<BasicJsonView graph={createTestGraph()} />);

    // Select "temporal" edge tag — only d1->d2 has it
    fireEvent.click(screen.getByLabelText("temporal"));

    expect(screen.getByText(/Edges\s*\(\s*1\s*\)/)).toBeDefined();
    expect(screen.getByTestId("edges-d1->d2")).toBeDefined();
    expect(screen.queryByTestId("edges-d2->d3")).toBeNull();
  });

  it("removes filter when tag is deselected", () => {
    render(<BasicJsonView graph={createTestGraph()} />);

    fireEvent.click(screen.getByLabelText("science"));
    expect(screen.getByText(/Datums\s*\(\s*2\s*\)/)).toBeDefined();

    fireEvent.click(screen.getByLabelText("science"));
    expect(screen.getByText(/Datums\s*\(\s*3\s*\)/)).toBeDefined();
  });

  it("renders all six array sections", () => {
    render(<BasicJsonView graph={createTestGraph()} />);
    expect(screen.getByText(/^Datums/)).toBeDefined();
    expect(screen.getByText(/^Edges/)).toBeDefined();
    expect(screen.getByText(/^DatumTags/)).toBeDefined();
    expect(screen.getByText(/^DatumDimensions/)).toBeDefined();
    expect(screen.getByText(/^DatumTagAssociations/)).toBeDefined();
    expect(screen.getByText(/^EdgeTags/)).toBeDefined();
  });

  it("renders add buttons for all six sections", () => {
    render(<BasicJsonView graph={createTestGraph()} />);
    expect(screen.getByTestId("add-datums-button")).toBeDefined();
    expect(screen.getByTestId("add-edges-button")).toBeDefined();
    expect(screen.getByTestId("add-datumtags-button")).toBeDefined();
    expect(screen.getByTestId("add-datumdimensions-button")).toBeDefined();
    expect(screen.getByTestId("add-datumtagassociations-button")).toBeDefined();
    expect(screen.getByTestId("add-edgetags-button")).toBeDefined();
  });

  it("shows add form when + button is clicked and adds item on save", () => {
    render(<BasicJsonView graph={createTestGraph()} />);

    fireEvent.click(screen.getByTestId("add-datumtags-button"));
    expect(screen.getByTestId("add-element-form")).toBeDefined();

    fireEvent.change(screen.getByTestId("input-name"), {
      target: { value: "newTag" },
    });
    fireEvent.change(screen.getByTestId("input-datumID"), {
      target: { value: "d1" },
    });
    fireEvent.click(screen.getByTestId("save-button"));

    // The new tag should now appear in the DatumTags count
    expect(screen.getByText(/DatumTags\s*\(\s*5\s*\)/)).toBeDefined();
  });

  it("disables save and highlights id label red when datum id already exists", () => {
    render(<BasicJsonView graph={createTestGraph()} />);

    fireEvent.click(screen.getByTestId("add-datums-button"));

    // Fill all fields, using an existing id "d1"
    fireEvent.change(screen.getByTestId("input-id"), {
      target: { value: "d1" },
    });
    fireEvent.change(screen.getByTestId("input-name"), {
      target: { value: "Duplicate" },
    });
    fireEvent.change(screen.getByTestId("input-type"), {
      target: { value: "MARKDOWN" },
    });
    fireEvent.change(screen.getByTestId("input-content"), {
      target: { value: "some content" },
    });

    // Save should be disabled due to duplicate id
    const saveButton = screen.getByTestId("save-button") as HTMLButtonElement;
    expect(saveButton.disabled).toBe(true);

    // The id label should be red
    const idLabel = screen.getByTestId("label-id");
    expect(idLabel.style.color).toBe("rgb(255, 68, 68)");
  });

  it("enables save when datum id is unique", () => {
    render(<BasicJsonView graph={createTestGraph()} />);

    fireEvent.click(screen.getByTestId("add-datums-button"));

    fireEvent.change(screen.getByTestId("input-id"), {
      target: { value: "d999" },
    });
    fireEvent.change(screen.getByTestId("input-name"), {
      target: { value: "New" },
    });
    fireEvent.change(screen.getByTestId("input-type"), {
      target: { value: "MARKDOWN" },
    });
    fireEvent.change(screen.getByTestId("input-content"), {
      target: { value: "content" },
    });

    const saveButton = screen.getByTestId("save-button") as HTMLButtonElement;
    expect(saveButton.disabled).toBe(false);
  });
});

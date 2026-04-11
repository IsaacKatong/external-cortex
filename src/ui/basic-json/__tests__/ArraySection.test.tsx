import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ArraySection } from "../ArraySection.js";
import type { FieldDef } from "../fieldDefs.js";

afterEach(cleanup);

type TestItem = { id: string; name: string };

const fields: FieldDef[] = [
  { key: "id", label: "id", type: "text" },
  { key: "name", label: "name", type: "text" },
];

const items: TestItem[] = [
  { id: "1", name: "First" },
  { id: "2", name: "Second" },
];

describe("ArraySection", () => {
  it("renders items and count", () => {
    render(
      <ArraySection
        title="Things"
        items={items}
        fields={fields}
        itemKey={(i) => i.id}
        onSave={vi.fn()}
      />
    );
    expect(screen.getByText("Things (2)")).toBeDefined();
    expect(screen.getByTestId("things-1")).toBeDefined();
    expect(screen.getByTestId("things-2")).toBeDefined();
  });

  it("shows empty message when no items and not adding", () => {
    render(
      <ArraySection
        title="Things"
        items={[]}
        fields={fields}
        itemKey={(i: TestItem) => i.id}
        onSave={vi.fn()}
      />
    );
    expect(screen.getByText("No things to display.")).toBeDefined();
  });

  it("renders a + button", () => {
    render(
      <ArraySection
        title="Things"
        items={items}
        fields={fields}
        itemKey={(i) => i.id}
        onSave={vi.fn()}
      />
    );
    expect(screen.getByTestId("add-things-button")).toBeDefined();
  });

  it("shows form when + is clicked and hides + button", () => {
    render(
      <ArraySection
        title="Things"
        items={items}
        fields={fields}
        itemKey={(i) => i.id}
        onSave={vi.fn()}
      />
    );
    fireEvent.click(screen.getByTestId("add-things-button"));
    expect(screen.getByTestId("add-element-form")).toBeDefined();
    expect(screen.queryByTestId("add-things-button")).toBeNull();
  });

  it("hides form and shows + button when cancel is clicked", () => {
    render(
      <ArraySection
        title="Things"
        items={items}
        fields={fields}
        itemKey={(i) => i.id}
        onSave={vi.fn()}
      />
    );
    fireEvent.click(screen.getByTestId("add-things-button"));
    fireEvent.click(screen.getByTestId("cancel-button"));
    expect(screen.queryByTestId("add-element-form")).toBeNull();
    expect(screen.getByTestId("add-things-button")).toBeDefined();
  });

  it("calls onSave and closes form when save is clicked", () => {
    const onSave = vi.fn();
    render(
      <ArraySection
        title="Things"
        items={items}
        fields={fields}
        itemKey={(i) => i.id}
        onSave={onSave}
      />
    );
    fireEvent.click(screen.getByTestId("add-things-button"));
    fireEvent.change(screen.getByTestId("input-id"), {
      target: { value: "3" },
    });
    fireEvent.change(screen.getByTestId("input-name"), {
      target: { value: "Third" },
    });
    fireEvent.click(screen.getByTestId("save-button"));
    expect(onSave).toHaveBeenCalledWith({ id: "3", name: "Third" });
    expect(screen.queryByTestId("add-element-form")).toBeNull();
    expect(screen.getByTestId("add-things-button")).toBeDefined();
  });
});

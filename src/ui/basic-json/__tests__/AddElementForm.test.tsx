import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { AddElementForm } from "../AddElementForm.js";
import type { FieldDef } from "../fieldDefs.js";

afterEach(cleanup);

const textFields: FieldDef[] = [
  { key: "name", label: "name", type: "text" },
  { key: "value", label: "value", type: "text" },
];

const mixedFields: FieldDef[] = [
  { key: "name", label: "name", type: "text" },
  { key: "amount", label: "amount", type: "number" },
];

describe("AddElementForm", () => {
  it("renders input fields for each field definition", () => {
    render(
      <AddElementForm fields={textFields} onSave={vi.fn()} onCancel={vi.fn()} />
    );
    expect(screen.getByTestId("input-name")).toBeDefined();
    expect(screen.getByTestId("input-value")).toBeDefined();
  });

  it("save button is disabled when fields are empty", () => {
    render(
      <AddElementForm fields={textFields} onSave={vi.fn()} onCancel={vi.fn()} />
    );
    const saveButton = screen.getByTestId("save-button") as HTMLButtonElement;
    expect(saveButton.disabled).toBe(true);
  });

  it("save button is enabled when all fields are filled", () => {
    render(
      <AddElementForm fields={textFields} onSave={vi.fn()} onCancel={vi.fn()} />
    );
    fireEvent.change(screen.getByTestId("input-name"), {
      target: { value: "test" },
    });
    fireEvent.change(screen.getByTestId("input-value"), {
      target: { value: "hello" },
    });
    const saveButton = screen.getByTestId("save-button") as HTMLButtonElement;
    expect(saveButton.disabled).toBe(false);
  });

  it("save button remains disabled when only some fields are filled", () => {
    render(
      <AddElementForm fields={textFields} onSave={vi.fn()} onCancel={vi.fn()} />
    );
    fireEvent.change(screen.getByTestId("input-name"), {
      target: { value: "test" },
    });
    const saveButton = screen.getByTestId("save-button") as HTMLButtonElement;
    expect(saveButton.disabled).toBe(true);
  });

  it("calls onSave with correct values when save is clicked", () => {
    const onSave = vi.fn();
    render(
      <AddElementForm fields={textFields} onSave={onSave} onCancel={vi.fn()} />
    );
    fireEvent.change(screen.getByTestId("input-name"), {
      target: { value: "myName" },
    });
    fireEvent.change(screen.getByTestId("input-value"), {
      target: { value: "myValue" },
    });
    fireEvent.click(screen.getByTestId("save-button"));
    expect(onSave).toHaveBeenCalledWith({ name: "myName", value: "myValue" });
  });

  it("converts number fields to numbers in onSave", () => {
    const onSave = vi.fn();
    render(
      <AddElementForm fields={mixedFields} onSave={onSave} onCancel={vi.fn()} />
    );
    fireEvent.change(screen.getByTestId("input-name"), {
      target: { value: "price" },
    });
    fireEvent.change(screen.getByTestId("input-amount"), {
      target: { value: "9.5" },
    });
    fireEvent.click(screen.getByTestId("save-button"));
    expect(onSave).toHaveBeenCalledWith({ name: "price", amount: 9.5 });
  });

  it("calls onCancel when cancel button is clicked", () => {
    const onCancel = vi.fn();
    render(
      <AddElementForm fields={textFields} onSave={vi.fn()} onCancel={onCancel} />
    );
    fireEvent.click(screen.getByTestId("cancel-button"));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("highlights label red after typing then clearing a field", () => {
    render(
      <AddElementForm fields={textFields} onSave={vi.fn()} onCancel={vi.fn()} />
    );
    const input = screen.getByTestId("input-name");
    fireEvent.change(input, { target: { value: "x" } });
    fireEvent.change(input, { target: { value: "" } });

    const label = screen.getByTestId("label-name");
    expect(label.style.color).toBe("rgb(255, 68, 68)");
  });

  it("does not highlight labels red before the field is touched", () => {
    render(
      <AddElementForm fields={textFields} onSave={vi.fn()} onCancel={vi.fn()} />
    );
    const label = screen.getByTestId("label-name");
    expect(label.style.color).not.toBe("rgb(255, 68, 68)");
  });

  it("highlights label red when custom validator fails", () => {
    const validators = {
      name: (value: string) =>
        value === "taken" ? "Already exists" : undefined,
    };
    render(
      <AddElementForm
        fields={textFields}
        validators={validators}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    fireEvent.change(screen.getByTestId("input-name"), {
      target: { value: "taken" },
    });

    const label = screen.getByTestId("label-name");
    expect(label.style.color).toBe("rgb(255, 68, 68)");
  });

  it("disables save when custom validator fails even if all fields filled", () => {
    const validators = {
      name: (value: string) =>
        value === "taken" ? "Already exists" : undefined,
    };
    render(
      <AddElementForm
        fields={textFields}
        validators={validators}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    fireEvent.change(screen.getByTestId("input-name"), {
      target: { value: "taken" },
    });
    fireEvent.change(screen.getByTestId("input-value"), {
      target: { value: "something" },
    });

    const saveButton = screen.getByTestId("save-button") as HTMLButtonElement;
    expect(saveButton.disabled).toBe(true);
  });

  it("enables save when custom validator passes", () => {
    const validators = {
      name: (value: string) =>
        value === "taken" ? "Already exists" : undefined,
    };
    render(
      <AddElementForm
        fields={textFields}
        validators={validators}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    fireEvent.change(screen.getByTestId("input-name"), {
      target: { value: "unique" },
    });
    fireEvent.change(screen.getByTestId("input-value"), {
      target: { value: "something" },
    });

    const saveButton = screen.getByTestId("save-button") as HTMLButtonElement;
    expect(saveButton.disabled).toBe(false);
  });
});

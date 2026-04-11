import { useState, type ReactNode } from "react";
import { BORDER, ACCENT, TEXT_PRIMARY, TEXT_SECONDARY } from "../../config/colors.js";
import type { FieldDef } from "./fieldDefs.js";

const ERROR_COLOR = "#ff4444";

export type FieldValidator = (value: string) => string | undefined;

export type AddElementFormProps = {
  fields: FieldDef[];
  validators?: Record<string, FieldValidator>;
  onSave: (values: Record<string, string | number>) => void;
  onCancel: () => void;
};

function isFieldInvalid(
  field: FieldDef,
  value: string,
  validators?: Record<string, FieldValidator>
): string | undefined {
  if (value.trim() === "") {
    return "Required";
  }
  const validator = validators?.[field.key];
  if (validator) {
    return validator(value);
  }
  return undefined;
}

export function AddElementForm({
  fields,
  validators,
  onSave,
  onCancel,
}: AddElementFormProps): ReactNode {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const f of fields) {
      initial[f.key] = "";
    }
    return initial;
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  function handleChange(key: string, value: string): void {
    setValues((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  }

  function handleSave(): void {
    const result: Record<string, string | number> = {};
    for (const f of fields) {
      const raw = values[f.key] ?? "";
      result[f.key] = f.type === "number" ? Number(raw) : raw;
    }
    onSave(result);
  }

  const fieldErrors: Record<string, string | undefined> = {};
  for (const f of fields) {
    fieldErrors[f.key] = isFieldInvalid(f, values[f.key] ?? "", validators);
  }

  const canSave = fields.every((f) => fieldErrors[f.key] === undefined);

  return (
    <div
      data-testid="add-element-form"
      style={{
        border: `1px solid ${BORDER}`,
        padding: 8,
        marginTop: 8,
      }}
    >
      {fields.map((field) => {
        const error = fieldErrors[field.key];
        const showError = touched[field.key] && error !== undefined;

        return (
          <div key={field.key} style={{ marginBottom: 4 }}>
            <label
              data-testid={`label-${field.key}`}
              style={{
                color: showError ? ERROR_COLOR : TEXT_SECONDARY,
                marginRight: 8,
              }}
            >
              {field.label}:
              <input
                type={field.type}
                value={values[field.key]}
                onChange={(e) => handleChange(field.key, e.target.value)}
                data-testid={`input-${field.key}`}
                style={{
                  marginLeft: 4,
                  backgroundColor: "#2a2a2a",
                  color: TEXT_PRIMARY,
                  border: `1px solid ${showError ? ERROR_COLOR : BORDER}`,
                  padding: "2px 4px",
                }}
              />
            </label>
          </div>
        );
      })}
      <div style={{ marginTop: 8 }}>
        <button
          onClick={handleSave}
          disabled={!canSave}
          data-testid="save-button"
          style={{
            marginRight: 8,
            backgroundColor: canSave ? ACCENT : BORDER,
            color: canSave ? "#000" : TEXT_SECONDARY,
            border: "none",
            padding: "4px 12px",
            cursor: canSave ? "pointer" : "not-allowed",
          }}
        >
          Save
        </button>
        <button
          onClick={onCancel}
          data-testid="cancel-button"
          style={{
            backgroundColor: "transparent",
            color: TEXT_SECONDARY,
            border: `1px solid ${BORDER}`,
            padding: "4px 12px",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

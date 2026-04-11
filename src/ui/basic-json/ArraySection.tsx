import { useState, type ReactNode } from "react";
import { BORDER, ACCENT } from "../../config/colors.js";
import type { FieldDef } from "./fieldDefs.js";
import { AddElementForm, type FieldValidator } from "./AddElementForm.js";

export type ArraySectionProps<T> = {
  title: string;
  items: T[];
  fields: FieldDef[];
  validators?: Record<string, FieldValidator>;
  itemKey: (item: T) => string;
  onSave: (values: Record<string, string | number>) => void;
};

export function ArraySection<T>({
  title,
  items,
  fields,
  validators,
  itemKey,
  onSave,
}: ArraySectionProps<T>): ReactNode {
  const [adding, setAdding] = useState(false);

  function handleSave(values: Record<string, string | number>): void {
    onSave(values);
    setAdding(false);
  }

  return (
    <section>
      <h2>
        {title} ({items.length})
      </h2>
      {items.length === 0 && !adding && <p>No {title.toLowerCase()} to display.</p>}
      {items.map((item) => (
        <article
          key={itemKey(item)}
          data-testid={`${title.toLowerCase()}-${itemKey(item)}`}
          style={{
            borderBottom: `1px solid ${BORDER}`,
            paddingBottom: 8,
            marginBottom: 8,
          }}
        >
          <pre style={{ margin: 0 }}>{JSON.stringify(item, null, 2)}</pre>
        </article>
      ))}
      {adding ? (
        <AddElementForm
          fields={fields}
          validators={validators}
          onSave={handleSave}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          data-testid={`add-${title.toLowerCase()}-button`}
          style={{
            backgroundColor: "transparent",
            color: ACCENT,
            border: `1px solid ${ACCENT}`,
            padding: "4px 12px",
            cursor: "pointer",
            marginTop: 4,
          }}
        >
          +
        </button>
      )}
    </section>
  );
}

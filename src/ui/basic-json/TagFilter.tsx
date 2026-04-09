import type { ReactNode } from "react";
import { TEXT_SECONDARY, BORDER } from "../../config/colors.js";

export type TagFilterProps = {
  label: string;
  tags: string[];
  selectedTags: Set<string>;
  onToggleTag: (tag: string) => void;
};

export function TagFilter({
  label,
  tags,
  selectedTags,
  onToggleTag,
}: TagFilterProps): ReactNode {
  if (tags.length === 0) {
    return null;
  }

  return (
    <fieldset style={{ borderColor: BORDER, borderWidth: 1, borderStyle: "solid", padding: 8, marginBottom: 8 }}>
      <legend style={{ color: TEXT_SECONDARY }}>{label}</legend>
      {tags.map((tag) => (
        <label key={tag} style={{ marginRight: 8 }}>
          <input
            type="checkbox"
            checked={selectedTags.has(tag)}
            onChange={() => onToggleTag(tag)}
          />
          {tag}
        </label>
      ))}
    </fieldset>
  );
}

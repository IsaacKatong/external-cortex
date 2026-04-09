import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { TagFilter } from "../TagFilter.js";

afterEach(cleanup);

describe("TagFilter", () => {
  it("renders nothing when there are no tags", () => {
    const { container } = render(
      <TagFilter
        label="Tags"
        tags={[]}
        selectedTags={new Set()}
        onToggleTag={() => {}}
      />
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders checkboxes for each tag", () => {
    render(
      <TagFilter
        label="Filter by Tag"
        tags={["alpha", "beta"]}
        selectedTags={new Set()}
        onToggleTag={() => {}}
      />
    );
    expect(screen.getByText("Filter by Tag")).toBeDefined();
    expect(screen.getByLabelText("alpha")).toBeDefined();
    expect(screen.getByLabelText("beta")).toBeDefined();
  });

  it("shows selected tags as checked", () => {
    render(
      <TagFilter
        label="Tags"
        tags={["alpha", "beta"]}
        selectedTags={new Set(["alpha"])}
        onToggleTag={() => {}}
      />
    );
    const alpha = screen.getByLabelText("alpha") as HTMLInputElement;
    const beta = screen.getByLabelText("beta") as HTMLInputElement;
    expect(alpha.checked).toBe(true);
    expect(beta.checked).toBe(false);
  });

  it("calls onToggleTag when a checkbox is clicked", () => {
    const onToggle = vi.fn();
    render(
      <TagFilter
        label="Tags"
        tags={["alpha", "beta"]}
        selectedTags={new Set()}
        onToggleTag={onToggle}
      />
    );
    fireEvent.click(screen.getByLabelText("beta"));
    expect(onToggle).toHaveBeenCalledWith("beta");
  });
});

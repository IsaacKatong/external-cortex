import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { PasswordPrompt } from "../PasswordPrompt.js";

afterEach(cleanup);

describe("PasswordPrompt", () => {
  it("renders the Enter Password heading", () => {
    render(<PasswordPrompt onSubmit={vi.fn()} error={null} />);

    expect(screen.getByText("Enter Password")).toBeDefined();
  });

  it("renders the Unlock button", () => {
    render(<PasswordPrompt onSubmit={vi.fn()} error={null} />);

    expect(screen.getByText("Unlock")).toBeDefined();
  });

  it("calls onSubmit with the entered password", () => {
    const onSubmit = vi.fn();
    render(<PasswordPrompt onSubmit={onSubmit} error={null} />);

    const input = screen.getByPlaceholderText("Password");
    fireEvent.change(input, { target: { value: "my-secret" } });
    fireEvent.click(screen.getByText("Unlock"));

    expect(onSubmit).toHaveBeenCalledWith("my-secret");
  });

  it("displays an error message when provided", () => {
    render(<PasswordPrompt onSubmit={vi.fn()} error="Invalid password. Please try again." />);

    expect(screen.getByText("Invalid password. Please try again.")).toBeDefined();
  });

  it("does not display an error when null", () => {
    render(<PasswordPrompt onSubmit={vi.fn()} error={null} />);

    expect(screen.queryByText("Invalid password")).toBeNull();
  });
});

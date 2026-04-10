import { describe, it, expect } from "vitest";
import { runCommand } from "../runCommand.js";

describe("runCommand", () => {
  it("runs a command and returns its stdout", () => {
    const result = runCommand("echo", ["hello"], { stdio: "pipe" });
    expect(result.trim()).toBe("hello");
  });

  it("throws when the command does not exist", () => {
    expect(() =>
      runCommand("nonexistent-command-xyz", [], { stdio: "pipe" })
    ).toThrow();
  });
});

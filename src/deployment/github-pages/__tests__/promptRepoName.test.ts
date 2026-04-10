import { describe, it, expect, vi, beforeEach } from "vitest";
import { promptRepoName } from "../promptRepoName.js";
import type { QuestionFn } from "../promptRepoName.js";

describe("promptRepoName", () => {
  let mockQuestion: ReturnType<typeof vi.fn>;
  let mockClose: ReturnType<typeof vi.fn>;
  let mockFactory: () => { question: QuestionFn; close: () => void };

  beforeEach(() => {
    mockQuestion = vi.fn();
    mockClose = vi.fn();
    mockFactory = () => ({ question: mockQuestion, close: mockClose });
  });

  it("returns the suggested name when user presses Enter", async () => {
    mockQuestion.mockImplementation((_prompt: string, cb: (answer: string) => void) => {
      cb("");
    });

    const result = await promptRepoName("my-default", mockFactory);
    expect(result).toBe("my-default");
  });

  it("returns the user-provided name when they type something", async () => {
    mockQuestion.mockImplementation((_prompt: string, cb: (answer: string) => void) => {
      cb("custom-name");
    });

    const result = await promptRepoName("my-default", mockFactory);
    expect(result).toBe("custom-name");
  });

  it("trims whitespace from user input", async () => {
    mockQuestion.mockImplementation((_prompt: string, cb: (answer: string) => void) => {
      cb("  trimmed-name  ");
    });

    const result = await promptRepoName("my-default", mockFactory);
    expect(result).toBe("trimmed-name");
  });

  it("uses suggested name when user enters only whitespace", async () => {
    mockQuestion.mockImplementation((_prompt: string, cb: (answer: string) => void) => {
      cb("   ");
    });

    const result = await promptRepoName("my-default", mockFactory);
    expect(result).toBe("my-default");
  });

  it("closes the readline interface after answering", async () => {
    mockQuestion.mockImplementation((_prompt: string, cb: (answer: string) => void) => {
      cb("test");
    });

    await promptRepoName("my-default", mockFactory);
    expect(mockClose).toHaveBeenCalledOnce();
  });
});

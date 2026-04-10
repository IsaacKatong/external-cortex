import { createInterface } from "node:readline";

/**
 * Callback type for the question function used by {@link promptRepoName}.
 */
export type QuestionFn = (
  prompt: string,
  callback: (answer: string) => void
) => void;

/**
 * Factory that returns a `question` function and a `close` function.
 *
 * Extracted so tests can inject a mock without fighting `node:readline` mocking.
 *
 * @returns An object with `question` and `close` methods.
 */
export function createReadlineInterface(): {
  question: QuestionFn;
  close: () => void;
} {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return {
    question: (prompt, cb) => rl.question(prompt, cb),
    close: () => rl.close(),
  };
}

/**
 * Prompt the user to approve or change the suggested repository name.
 *
 * Displays the suggested name and waits for user input. If the user
 * presses Enter without typing, the suggested name is used. Otherwise,
 * the user's input is used as the repository name.
 *
 * @param suggestedName - The default repository name to suggest.
 * @param rlFactory - Optional factory for the readline interface (for testing).
 * @returns The approved or user-provided repository name.
 */
export async function promptRepoName(
  suggestedName: string,
  rlFactory: () => ReturnType<typeof createReadlineInterface> = createReadlineInterface
): Promise<string> {
  const rl = rlFactory();

  return new Promise<string>((resolve) => {
    rl.question(
      `\nRepository name: "${suggestedName}"\nPress Enter to confirm, or type a new name: `,
      (answer) => {
        rl.close();
        const trimmed = answer.trim();
        resolve(trimmed.length > 0 ? trimmed : suggestedName);
      }
    );
  });
}

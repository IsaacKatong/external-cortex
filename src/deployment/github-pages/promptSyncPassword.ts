import { createInterface } from "node:readline";

/**
 * Factory that returns `question` and `close` methods for readline prompts.
 * Extracted so tests can inject a mock.
 */
export type RlFactory = () => {
  question: (prompt: string, callback: (answer: string) => void) => void;
  close: () => void;
};

function createDefaultRl(): ReturnType<RlFactory> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return {
    question: (prompt, cb) => rl.question(prompt, cb),
    close: () => rl.close(),
  };
}

/**
 * Prompt the user for the decryption password when the configured password
 * fails to decrypt graph.json during sync.
 *
 * @returns The password entered by the user, or null if aborted.
 */
export async function promptSyncPassword(
  rlFactory: RlFactory = createDefaultRl
): Promise<string | null> {
  if (!process.stdin.isTTY) {
    console.error(
      "Password mismatch: graph.json is encrypted with a different password.\n" +
        "This must be resolved interactively. Run the sync command in a terminal."
    );
    return null;
  }

  const rl = rlFactory();

  const menuPrompt =
    "\n\u26a0\ufe0f  Failed to decrypt graph.json with the configured password.\n\n" +
    "  1. Enter the correct password to decrypt\n" +
    "  2. Abort sync\n\n" +
    "Select an option (1-2): ";

  const choice = await new Promise<string>((resolve) => {
    rl.question(menuPrompt, (answer) => {
      resolve(answer.trim());
    });
  });

  if (choice === "1") {
    const password = await new Promise<string>((resolve) => {
      rl.question("Enter the decryption password: ", (answer) => {
        rl.close();
        resolve(answer);
      });
    });
    return password;
  }

  rl.close();
  return null;
}

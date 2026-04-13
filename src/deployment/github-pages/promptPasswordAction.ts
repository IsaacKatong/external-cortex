import { createInterface } from "node:readline";

/**
 * The result of prompting the user when graph.json is encrypted
 * with a different password than the one configured.
 */
export type PasswordAction =
  | { kind: "reencrypt"; oldPassword: string }
  | { kind: "overwrite" };

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
 * Prompt the user to choose how to handle a password mismatch on graph.json.
 *
 * Options:
 * 1. Enter the old password to decrypt, then re-encrypt with the new password.
 * 2. Overwrite graph.json from plain-text-graph.json (loses old encrypted data).
 * 3. Abort deployment.
 *
 * In non-interactive environments, aborts with an error.
 *
 * @param rlFactory - Optional factory for the readline interface (for testing).
 * @returns The user's chosen action.
 */
export async function promptPasswordAction(
  rlFactory: RlFactory = createDefaultRl
): Promise<PasswordAction> {
  if (!process.stdin.isTTY) {
    console.error(
      "Password mismatch: graph.json is encrypted with a different password.\n" +
        "This must be resolved interactively. Run the deploy command in a terminal."
    );
    process.exit(1);
  }

  const rl = rlFactory();

  const menuPrompt =
    "\n\u26a0\ufe0f  graph.json is encrypted with a different password than configured.\n\n" +
    "  1. Enter the old password to re-encrypt with the new one\n" +
    "  2. I forgot my password \u2014 overwrite from plain-text-graph.json\n" +
    "  3. Abort deployment\n\n" +
    "Select an option (1-3): ";

  const choice = await new Promise<string>((resolve) => {
    rl.question(menuPrompt, (answer) => {
      resolve(answer.trim());
    });
  });

  switch (choice) {
    case "1": {
      const oldPassword = await new Promise<string>((resolve) => {
        rl.question("Enter the old password: ", (answer) => {
          rl.close();
          resolve(answer);
        });
      });
      return { kind: "reencrypt", oldPassword };
    }
    case "2": {
      rl.close();
      console.log(
        "\n\u26a0\ufe0f  Warning: graph.json will be overwritten by plain-text-graph.json.\n" +
          "Any data in the encrypted graph that is not in plain-text-graph.json will be lost."
      );
      return { kind: "overwrite" };
    }
    default: {
      rl.close();
      console.log("\nDeploy aborted.");
      process.exit(0);
    }
  }
}

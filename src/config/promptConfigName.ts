import { createInterface } from "node:readline";

/**
 * Callback type for the question function used by {@link promptConfigName}.
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
 * Prompt the user to select a named configuration from the available options.
 *
 * Displays a numbered list of config names and waits for user input.
 * If `includeDefault` is true, a "default" option is shown first and
 * pressing Enter without typing selects it. If `includeDefault` is false,
 * the user must make an explicit selection.
 *
 * @param configNames - The available configuration names (excluding "default").
 * @param includeDefault - Whether to include a "default" option. Defaults to true.
 * @param rlFactory - Optional factory for the readline interface (for testing).
 * @returns The selected configuration name.
 */
export async function promptConfigName(
  configNames: string[],
  includeDefault: boolean = true,
  rlFactory: () => ReturnType<typeof createReadlineInterface> = createReadlineInterface
): Promise<string> {
  const options = includeDefault ? ["default", ...configNames] : [...configNames];

  if (options.length === 0) {
    throw new Error("No configurations available. Add a config to ~/.external-cortex/config.json first.");
  }

  if (options.length === 1) {
    console.log(`Using config: "${options[0]}"`);
    return options[0]!;
  }

  const rl = rlFactory();

  let prompt = "\nAvailable configurations:\n";
  options.forEach((name, index) => {
    const label = includeDefault && index === 0 ? `${name} (press Enter)` : name;
    prompt += `  ${index + 1}. ${label}\n`;
  });
  prompt += "\nSelect a configuration (number or name): ";

  return new Promise<string>((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      const trimmed = answer.trim();

      if (trimmed === "" && includeDefault) {
        resolve("default");
        return;
      }

      const asNumber = parseInt(trimmed, 10);
      if (!isNaN(asNumber) && asNumber >= 1 && asNumber <= options.length) {
        resolve(options[asNumber - 1]!);
        return;
      }

      if (options.includes(trimmed)) {
        resolve(trimmed);
        return;
      }

      console.log(`Unknown config "${trimmed}", using "${options[0]}".`);
      resolve(options[0]!);
    });
  });
}

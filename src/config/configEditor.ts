import { loadAllConfigs } from "./loadUserConfig.js";
import { saveAllConfigs } from "./saveUserConfig.js";
import { CONFIG_DEFAULTS } from "./userConfig.js";
import type { ExternalCortexConfig, ExternalCortexConfigMap } from "./userConfig.js";
import { createReadlineInterface } from "./promptConfigName.js";
import type { QuestionFn } from "./promptConfigName.js";

/**
 * Factory type matching `createReadlineInterface` signature.
 */
type RlFactory = () => { question: QuestionFn; close: () => void };

/**
 * A flattened field descriptor with a dot-separated path, a getter, and a setter.
 */
interface FieldDescriptor {
  label: string;
  get: (cfg: ExternalCortexConfig) => string;
  set: (cfg: ExternalCortexConfig, value: string) => void;
}

/**
 * Derive field descriptors by walking `CONFIG_DEFAULTS`.
 *
 * Any new field added to {@link ExternalCortexConfig} and
 * {@link CONFIG_DEFAULTS} automatically appears in the editor.
 * Nested objects (like `colors`) are flattened with dot notation.
 */
function buildFieldDescriptors(): FieldDescriptor[] {
  const fields: FieldDescriptor[] = [];

  function walk(obj: Record<string, unknown>, prefix: string): void {
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      const path = prefix ? `${prefix}.${key}` : key;

      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        walk(value as Record<string, unknown>, path);
      } else {
        fields.push({
          label: path,
          get: (cfg) => getNestedValue(cfg, path),
          set: (cfg, v) => setNestedValue(cfg, path, v),
        });
      }
    }
  }

  walk(CONFIG_DEFAULTS as unknown as Record<string, unknown>, "");
  return fields;
}

/**
 * Read a dot-separated path from a config object.
 */
function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (typeof current !== "object" || current === null) return "";
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : String(current ?? "");
}

/**
 * Write a value at a dot-separated path on a config object.
 */
function setNestedValue(obj: Record<string, unknown>, path: string, value: string): void {
  const parts = path.split(".");
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]!;
    if (typeof current[part] !== "object" || current[part] === null) {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]!] = value;
}

/**
 * The complete list of editable fields, derived from {@link CONFIG_DEFAULTS}.
 * Exported for testing — ensures new config fields automatically appear.
 */
export const FIELDS: FieldDescriptor[] = buildFieldDescriptors();

/**
 * Ask a single question and return the trimmed answer.
 */
function ask(rl: { question: QuestionFn; close: () => void }, prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => resolve(answer.trim()));
  });
}

/**
 * Screen 1: Select a config to edit or create a new one.
 *
 * @returns The config name selected, or `null` to quit.
 */
async function screenSelectConfig(
  configs: ExternalCortexConfigMap,
  rlFactory: RlFactory
): Promise<string | null> {
  const names = Object.keys(configs);

  let prompt = "\n--- Config Editor ---\n";
  prompt += "\nConfigurations:\n";
  names.forEach((name, i) => {
    prompt += `  ${i + 1}. ${name}\n`;
  });
  prompt += `  ${names.length + 1}. [Create new config]\n`;
  prompt += `\nSelect a configuration (number) or 'q' to quit: `;

  const rl = rlFactory();
  const answer = await ask(rl, prompt);
  rl.close();

  if (answer.toLowerCase() === "q") return null;

  const num = parseInt(answer, 10);
  if (num >= 1 && num <= names.length) {
    return names[num - 1]!;
  }

  if (num === names.length + 1) {
    return await screenCreateConfig(rlFactory);
  }

  console.log(`Invalid selection "${answer}".`);
  return screenSelectConfig(configs, rlFactory);
}

/**
 * Prompt for a new config name.
 *
 * @returns The new config name, or `null` if the user wants to go back.
 */
async function screenCreateConfig(rlFactory: RlFactory): Promise<string | null> {
  const rl = rlFactory();
  const name = await ask(rl, "\nEnter name for the new config (or 'b' to go back): ");
  rl.close();

  if (name.toLowerCase() === "b" || name === "") return null;
  return name;
}

/**
 * Screen 2: Select a field to edit within the chosen config.
 *
 * @returns The field index to edit, or `null` to go back.
 */
async function screenSelectField(
  configName: string,
  config: ExternalCortexConfig,
  rlFactory: RlFactory
): Promise<number | null> {
  let prompt = `\n--- Editing: ${configName} ---\n\n`;
  FIELDS.forEach((field, i) => {
    const value = field.get(config) || "(empty)";
    prompt += `  ${i + 1}. ${field.label}: ${value}\n`;
  });
  prompt += `\n  b. Back\n`;
  prompt += `\nSelect a field to edit (number) or 'b' to go back: `;

  const rl = rlFactory();
  const answer = await ask(rl, prompt);
  rl.close();

  if (answer.toLowerCase() === "b") return null;

  const num = parseInt(answer, 10);
  if (num >= 1 && num <= FIELDS.length) {
    return num - 1;
  }

  console.log(`Invalid selection "${answer}".`);
  return screenSelectField(configName, config, rlFactory);
}

/**
 * Screen 3: Edit a single field value.
 *
 * @returns `true` if a value was set, `false` if the user went back.
 */
async function screenEditField(
  configName: string,
  config: ExternalCortexConfig,
  fieldIndex: number,
  rlFactory: RlFactory
): Promise<boolean> {
  const field = FIELDS[fieldIndex]!;
  const current = field.get(config) || "(empty)";

  let prompt = `\n--- ${configName} > ${field.label} ---\n`;
  prompt += `\n  Current value: ${current}\n`;
  prompt += `\nEnter new value (or 'b' to go back): `;

  const rl = rlFactory();
  const answer = await ask(rl, prompt);
  rl.close();

  if (answer.toLowerCase() === "b") return false;

  field.set(config, answer);
  return true;
}

/**
 * Run the interactive config editor.
 *
 * Loads all configs, lets the user navigate through three screens
 * (config selection → field selection → field editing), and saves
 * after each edit.
 *
 * @param configPath - Path to the config file (for testing).
 * @param rlFactory - Factory for readline interfaces (for testing).
 */
export async function runConfigEditor(
  configPath?: string,
  rlFactory: RlFactory = createReadlineInterface
): Promise<void> {
  if (!process.stdin.isTTY) {
    console.log("Config editor requires an interactive terminal.");
    return;
  }

  const configs = loadAllConfigs(configPath);

  // Main loop: Screen 1 → Screen 2 → Screen 3 → save → back to Screen 2
  while (true) {
    const selectedName = await screenSelectConfig(configs, rlFactory);
    if (selectedName === null) break;

    // Ensure the config exists (for newly created configs)
    if (!configs[selectedName]) {
      configs[selectedName] = {
        ...CONFIG_DEFAULTS,
        colors: { ...CONFIG_DEFAULTS.colors },
      };
      saveAllConfigs(configs, configPath);
      console.log(`\nCreated new config "${selectedName}" with default values.`);
    }

    const config = configs[selectedName]!;

    // Field selection loop
    while (true) {
      const fieldIndex = await screenSelectField(selectedName, config, rlFactory);
      if (fieldIndex === null) break;

      const edited = await screenEditField(selectedName, config, fieldIndex, rlFactory);
      if (edited) {
        saveAllConfigs(configs, configPath);
        console.log(`\nSaved.`);
      }
    }
  }

  console.log("\nDone.");
}

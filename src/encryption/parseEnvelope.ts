import type { EncryptedGraphEnvelope } from "../external-storage/types.js";

/**
 * Parse raw file content to detect an encrypted graph envelope.
 *
 * Returns the parsed envelope if the content has a `graph_blob` field,
 * or wraps legacy raw-base64 content in an envelope with version 0.
 * Returns `null` if the content is plaintext JSON (no `graph_blob` field).
 *
 * @param content - The raw string content of graph.json.
 * @returns The envelope if encrypted, or `null` if plaintext.
 */
export function parseEnvelope(content: string): EncryptedGraphEnvelope | null {
  try {
    const parsed = JSON.parse(content);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "graph_blob" in parsed
    ) {
      return parsed as EncryptedGraphEnvelope;
    }
    return null;
  } catch {
    // Not valid JSON — treat as legacy raw base64 ciphertext
    return { graph_blob: content, version: 0 };
  }
}

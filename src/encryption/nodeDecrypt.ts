import { createDecipheriv, pbkdf2Sync } from "node:crypto";
import {
  KEY_LENGTH,
  PBKDF2_ITERATIONS,
  SALT_LENGTH,
  IV_LENGTH,
} from "./constants.js";

/**
 * Decrypt a base64-encoded ciphertext using AES-256-GCM with a password.
 *
 * Node.js counterpart of the browser-side {@link decrypt.ts}.
 * Expects `base64(salt || iv || ciphertext + authTag)`.
 *
 * @param base64Ciphertext - The base64-encoded encrypted payload.
 * @param password - The password to derive the decryption key from.
 * @returns The decrypted plaintext string.
 * @throws If the password is incorrect or the data is corrupted.
 */
export function decryptGraphJson(
  base64Ciphertext: string,
  password: string
): string {
  const data = Buffer.from(base64Ciphertext, "base64");

  const salt = data.subarray(0, SALT_LENGTH);
  const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTagStart = data.length - 16;
  const ciphertext = data.subarray(SALT_LENGTH + IV_LENGTH, authTagStart);
  const authTag = data.subarray(authTagStart);

  const key = pbkdf2Sync(
    password,
    salt,
    PBKDF2_ITERATIONS,
    KEY_LENGTH / 8,
    "sha256"
  );

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf-8");
}

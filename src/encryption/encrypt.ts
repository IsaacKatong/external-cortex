import { randomBytes, createCipheriv, pbkdf2Sync } from "node:crypto";
import {
  KEY_LENGTH,
  PBKDF2_ITERATIONS,
  SALT_LENGTH,
  IV_LENGTH,
} from "./constants.js";

/**
 * Encrypt a plaintext string using AES-256-GCM with a password.
 *
 * Returns `base64(salt || iv || ciphertext + authTag)` which can be
 * decrypted by the browser-side {@link decryptGraphJson}.
 *
 * @param plaintext - The JSON string to encrypt.
 * @param password - The password to derive the encryption key from.
 * @returns The base64-encoded encrypted payload.
 */
export function encryptBlob(plaintext: string, password: string): string {
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);

  const key = pbkdf2Sync(
    password,
    salt,
    PBKDF2_ITERATIONS,
    KEY_LENGTH / 8,
    "sha256"
  );

  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf-8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  const payload = Buffer.concat([salt, iv, encrypted, authTag]);
  return payload.toString("base64");
}

/**
 * Encrypt a graph JSON string and wrap it in the envelope format.
 *
 * Returns `JSON.stringify({ graph_blob, version })` so the version is
 * readable without decryption (e.g. for CI version checks).
 *
 * @param plaintext - The graph JSON string to encrypt.
 * @param password - The password to derive the encryption key from.
 * @param version - The graph version number to include in the envelope.
 * @returns The JSON-encoded encrypted envelope string.
 */
export function encryptGraphJson(
  plaintext: string,
  password: string,
  version: number = 0
): string {
  const blob = encryptBlob(plaintext, password);
  return JSON.stringify({ graph_blob: blob, version });
}

import {
  KEY_LENGTH,
  PBKDF2_ITERATIONS,
  SALT_LENGTH,
  IV_LENGTH,
} from "./constants.js";

/**
 * Encrypt a plaintext string using AES-256-GCM with a password (browser-side).
 *
 * Returns `base64(salt || iv || ciphertext + authTag)` — the raw blob.
 *
 * @param plaintext - The JSON string to encrypt.
 * @param password - The password to derive the encryption key from.
 * @returns The base64-encoded encrypted payload.
 */
export async function encryptBlob(
  plaintext: string,
  password: string
): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const key = await deriveKey(password, salt);

  const encoded = new TextEncoder().encode(plaintext);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );

  // encrypted includes the auth tag appended by Web Crypto
  const payload = new Uint8Array(
    SALT_LENGTH + IV_LENGTH + encrypted.byteLength
  );
  payload.set(salt, 0);
  payload.set(iv, SALT_LENGTH);
  payload.set(new Uint8Array(encrypted), SALT_LENGTH + IV_LENGTH);

  let binary = "";
  for (const byte of payload) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
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
export async function encryptGraphJson(
  plaintext: string,
  password: string,
  version: number = 0
): Promise<string> {
  const blob = await encryptBlob(plaintext, password);
  return JSON.stringify({ graph_blob: blob, version });
}

async function deriveKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: KEY_LENGTH },
    false,
    ["encrypt"]
  );
}

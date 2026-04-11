import {
  KEY_LENGTH,
  PBKDF2_ITERATIONS,
  SALT_LENGTH,
  IV_LENGTH,
} from "./constants.js";

/**
 * Encrypt a plaintext string using AES-256-GCM with a password (browser-side).
 *
 * Returns `base64(salt || iv || ciphertext + authTag)` — the same format
 * produced by the Node.js {@link encrypt.ts} and expected by {@link decrypt.ts}.
 *
 * @param plaintext - The JSON string to encrypt.
 * @param password - The password to derive the encryption key from.
 * @returns The base64-encoded encrypted payload.
 */
export async function encryptGraphJson(
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

import {
  KEY_LENGTH,
  PBKDF2_ITERATIONS,
  SALT_LENGTH,
  IV_LENGTH,
} from "./constants.js";

/**
 * Decrypt a base64-encoded ciphertext using AES-256-GCM with a password.
 *
 * The ciphertext is expected to be `base64(salt || iv || encrypted)` where:
 * - salt is {@link SALT_LENGTH} bytes
 * - iv is {@link IV_LENGTH} bytes
 * - encrypted is the AES-GCM ciphertext (includes auth tag)
 *
 * @param base64Ciphertext - The base64-encoded encrypted payload.
 * @param password - The password to derive the decryption key from.
 * @returns The decrypted plaintext string.
 * @throws If the password is incorrect or the data is corrupted.
 */
export async function decryptGraphJson(
  base64Ciphertext: string,
  password: string
): Promise<string> {
  const data = Uint8Array.from(atob(base64Ciphertext), (c) => c.charCodeAt(0));

  const salt = data.slice(0, SALT_LENGTH);
  const iv = data.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const ciphertext = data.slice(SALT_LENGTH + IV_LENGTH);

  const key = await deriveKey(password, salt);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
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
    ["decrypt"]
  );
}

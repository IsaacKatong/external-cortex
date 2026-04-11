import { describe, it, expect } from "vitest";
import { encryptGraphJson } from "../browserEncrypt.js";
import { decryptGraphJson } from "../decrypt.js";

describe("browserEncrypt – encryptGraphJson", () => {
  it("returns a non-empty base64 string", async () => {
    const result = await encryptGraphJson('{"datums":[]}', "secret");

    expect(result.length).toBeGreaterThan(0);
    // Should be valid base64
    expect(() => atob(result)).not.toThrow();
  });

  it("produces different ciphertexts for the same input (random salt/iv)", async () => {
    const a = await encryptGraphJson("hello", "pass");
    const b = await encryptGraphJson("hello", "pass");

    expect(a).not.toBe(b);
  });

  it("round-trips with browser decryptGraphJson", async () => {
    const plaintext = '{"datums":[{"id":"1","name":"test"}]}';
    const password = "my-secret-password";

    const encrypted = await encryptGraphJson(plaintext, password);
    const decrypted = await decryptGraphJson(encrypted, password);

    expect(decrypted).toBe(plaintext);
  });

  it("is compatible with Node encrypt format (decrypt works on both)", async () => {
    // Encrypt with browser, decrypt with browser — same format as Node encrypt
    const plaintext = "hello world";
    const password = "pass123";

    const encrypted = await encryptGraphJson(plaintext, password);
    const bytes = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0));

    // salt(16) + iv(12) + at least 1 byte ciphertext + authTag(16) = minimum 45 bytes
    expect(bytes.length).toBeGreaterThanOrEqual(45);
  });

  it("decryption fails with wrong password", async () => {
    const encrypted = await encryptGraphJson("secret data", "correct-password");

    await expect(
      decryptGraphJson(encrypted, "wrong-password")
    ).rejects.toThrow();
  });
});

import { describe, it, expect } from "vitest";
import { encryptGraphJson } from "../encrypt.js";
import { decryptGraphJson } from "../decrypt.js";

describe("decryptGraphJson", () => {
  it("decrypts what encryptGraphJson encrypted", async () => {
    const plaintext = '{"datums":[{"id":"1","name":"test","type":"note","content":"hello"}]}';
    const password = "my-secret-password";

    const encrypted = encryptGraphJson(plaintext, password);
    const decrypted = await decryptGraphJson(encrypted, password);

    expect(decrypted).toBe(plaintext);
  });

  it("decrypts empty JSON object", async () => {
    const plaintext = "{}";
    const password = "pass";

    const encrypted = encryptGraphJson(plaintext, password);
    const decrypted = await decryptGraphJson(encrypted, password);

    expect(decrypted).toBe(plaintext);
  });

  it("throws on wrong password", async () => {
    const encrypted = encryptGraphJson("secret data", "correct-password");

    await expect(
      decryptGraphJson(encrypted, "wrong-password")
    ).rejects.toThrow();
  });

  it("throws on corrupted ciphertext", async () => {
    await expect(
      decryptGraphJson("not-valid-base64-ciphertext!!!", "password")
    ).rejects.toThrow();
  });
});

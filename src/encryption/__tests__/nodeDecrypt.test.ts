import { describe, it, expect } from "vitest";
import { encryptGraphJson } from "../encrypt.js";
import { decryptGraphJson } from "../nodeDecrypt.js";

describe("nodeDecrypt – decryptGraphJson", () => {
  it("decrypts what encryptGraphJson encrypted", () => {
    const plaintext = '{"datums":[{"id":"1","name":"test","type":"note","content":"hello"}]}';
    const password = "my-secret-password";

    const encrypted = encryptGraphJson(plaintext, password);
    const decrypted = decryptGraphJson(encrypted, password);

    expect(decrypted).toBe(plaintext);
  });

  it("decrypts empty JSON object", () => {
    const plaintext = "{}";
    const password = "pass";

    const encrypted = encryptGraphJson(plaintext, password);
    const decrypted = decryptGraphJson(encrypted, password);

    expect(decrypted).toBe(plaintext);
  });

  it("throws on wrong password", () => {
    const encrypted = encryptGraphJson("secret data", "correct-password");

    expect(() => decryptGraphJson(encrypted, "wrong-password")).toThrow();
  });

  it("throws on corrupted ciphertext", () => {
    expect(() =>
      decryptGraphJson("not-valid-base64-ciphertext", "password")
    ).toThrow();
  });

  it("handles unicode content", () => {
    const plaintext = '{"name":"café ☕ résumé"}';
    const password = "test123";

    const encrypted = encryptGraphJson(plaintext, password);
    const decrypted = decryptGraphJson(encrypted, password);

    expect(decrypted).toBe(plaintext);
  });
});

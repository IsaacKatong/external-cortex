import { describe, it, expect } from "vitest";
import { encryptBlob } from "../encrypt.js";
import { decryptGraphJson } from "../nodeDecrypt.js";

describe("nodeDecrypt – decryptGraphJson", () => {
  it("decrypts what encryptBlob encrypted", () => {
    const plaintext = '{"datums":[{"id":"1","name":"test","type":"note","content":"hello"}]}';
    const password = "my-secret-password";

    const encrypted = encryptBlob(plaintext, password);
    const decrypted = decryptGraphJson(encrypted, password);

    expect(decrypted).toBe(plaintext);
  });

  it("decrypts empty JSON object", () => {
    const plaintext = "{}";
    const password = "pass";

    const encrypted = encryptBlob(plaintext, password);
    const decrypted = decryptGraphJson(encrypted, password);

    expect(decrypted).toBe(plaintext);
  });

  it("throws on wrong password", () => {
    const encrypted = encryptBlob("secret data", "correct-password");

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

    const encrypted = encryptBlob(plaintext, password);
    const decrypted = decryptGraphJson(encrypted, password);

    expect(decrypted).toBe(plaintext);
  });
});

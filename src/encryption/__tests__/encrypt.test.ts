import { describe, it, expect } from "vitest";
import { encryptGraphJson } from "../encrypt.js";

describe("encryptGraphJson", () => {
  it("returns a non-empty base64 string", () => {
    const result = encryptGraphJson('{"datums":[]}', "secret");

    expect(result.length).toBeGreaterThan(0);
    expect(() => Buffer.from(result, "base64")).not.toThrow();
  });

  it("produces different ciphertexts for the same input (random salt/iv)", () => {
    const a = encryptGraphJson("hello", "pass");
    const b = encryptGraphJson("hello", "pass");

    expect(a).not.toBe(b);
  });

  it("produces output containing salt + iv + ciphertext + auth tag", () => {
    const result = encryptGraphJson("test", "pass");
    const bytes = Buffer.from(result, "base64");

    // salt(16) + iv(12) + at least 1 byte ciphertext + authTag(16) = minimum 45 bytes
    expect(bytes.length).toBeGreaterThanOrEqual(45);
  });
});

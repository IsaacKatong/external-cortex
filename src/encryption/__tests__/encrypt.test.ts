import { describe, it, expect } from "vitest";
import { encryptBlob, encryptGraphJson } from "../encrypt.js";
import type { EncryptedGraphEnvelope } from "../../external-storage/types.js";

describe("encryptBlob", () => {
  it("returns a non-empty base64 string", () => {
    const result = encryptBlob('{"datums":[]}', "secret");

    expect(result.length).toBeGreaterThan(0);
    expect(() => Buffer.from(result, "base64")).not.toThrow();
  });

  it("produces different ciphertexts for the same input (random salt/iv)", () => {
    const a = encryptBlob("hello", "pass");
    const b = encryptBlob("hello", "pass");

    expect(a).not.toBe(b);
  });

  it("produces output containing salt + iv + ciphertext + auth tag", () => {
    const result = encryptBlob("test", "pass");
    const bytes = Buffer.from(result, "base64");

    // salt(16) + iv(12) + at least 1 byte ciphertext + authTag(16) = minimum 45 bytes
    expect(bytes.length).toBeGreaterThanOrEqual(45);
  });
});

describe("encryptGraphJson", () => {
  it("returns a JSON envelope with graph_blob and version", () => {
    const result = encryptGraphJson('{"datums":[]}', "secret", 5);
    const parsed = JSON.parse(result) as EncryptedGraphEnvelope;

    expect(parsed).toHaveProperty("graph_blob");
    expect(parsed).toHaveProperty("version", 5);
    expect(typeof parsed.graph_blob).toBe("string");
    expect(parsed.graph_blob.length).toBeGreaterThan(0);
  });

  it("defaults version to 0 when not provided", () => {
    const result = encryptGraphJson('{"datums":[]}', "secret");
    const parsed = JSON.parse(result) as EncryptedGraphEnvelope;

    expect(parsed.version).toBe(0);
  });

  it("produces different envelopes for the same input (random salt/iv)", () => {
    const a = encryptGraphJson("hello", "pass", 1);
    const b = encryptGraphJson("hello", "pass", 1);

    expect(a).not.toBe(b);
  });
});

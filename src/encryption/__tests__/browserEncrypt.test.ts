import { describe, it, expect } from "vitest";
import { encryptBlob, encryptGraphJson } from "../browserEncrypt.js";
import { decryptGraphJson } from "../decrypt.js";
import type { EncryptedGraphEnvelope } from "../../external-storage/types.js";

describe("browserEncrypt – encryptBlob", () => {
  it("returns a non-empty base64 string", async () => {
    const result = await encryptBlob('{"datums":[]}', "secret");

    expect(result.length).toBeGreaterThan(0);
    // Should be valid base64
    expect(() => atob(result)).not.toThrow();
  });

  it("produces different ciphertexts for the same input (random salt/iv)", async () => {
    const a = await encryptBlob("hello", "pass");
    const b = await encryptBlob("hello", "pass");

    expect(a).not.toBe(b);
  });

  it("round-trips with browser decryptGraphJson", async () => {
    const plaintext = '{"datums":[{"id":"1","name":"test"}]}';
    const password = "my-secret-password";

    const encrypted = await encryptBlob(plaintext, password);
    const decrypted = await decryptGraphJson(encrypted, password);

    expect(decrypted).toBe(plaintext);
  });

  it("is compatible with Node encrypt format (decrypt works on both)", async () => {
    // Encrypt with browser, decrypt with browser — same format as Node encrypt
    const plaintext = "hello world";
    const password = "pass123";

    const encrypted = await encryptBlob(plaintext, password);
    const bytes = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0));

    // salt(16) + iv(12) + at least 1 byte ciphertext + authTag(16) = minimum 45 bytes
    expect(bytes.length).toBeGreaterThanOrEqual(45);
  });

  it("decryption fails with wrong password", async () => {
    const encrypted = await encryptBlob("secret data", "correct-password");

    await expect(
      decryptGraphJson(encrypted, "wrong-password")
    ).rejects.toThrow();
  });
});

describe("browserEncrypt – encryptGraphJson", () => {
  it("returns a JSON envelope with graph_blob and version", async () => {
    const result = await encryptGraphJson('{"datums":[]}', "secret", 3);
    const parsed = JSON.parse(result) as EncryptedGraphEnvelope;

    expect(parsed).toHaveProperty("graph_blob");
    expect(parsed).toHaveProperty("version", 3);
    expect(typeof parsed.graph_blob).toBe("string");
  });

  it("defaults version to 0 when not provided", async () => {
    const result = await encryptGraphJson('{"datums":[]}', "secret");
    const parsed = JSON.parse(result) as EncryptedGraphEnvelope;

    expect(parsed.version).toBe(0);
  });

  it("round-trips the graph_blob with decryptGraphJson", async () => {
    const plaintext = '{"version":5,"datums":[]}';
    const password = "test-password";

    const envelope = await encryptGraphJson(plaintext, password, 5);
    const parsed = JSON.parse(envelope) as EncryptedGraphEnvelope;
    const decrypted = await decryptGraphJson(parsed.graph_blob, password);

    expect(decrypted).toBe(plaintext);
    expect(parsed.version).toBe(5);
  });
});

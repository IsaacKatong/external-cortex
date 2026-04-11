import { describe, it, expect } from "vitest";
import { KEY_LENGTH, PBKDF2_ITERATIONS, SALT_LENGTH, IV_LENGTH } from "../constants.js";

describe("encryption constants", () => {
  it("uses AES-256 key length", () => {
    expect(KEY_LENGTH).toBe(256);
  });

  it("uses a secure PBKDF2 iteration count", () => {
    expect(PBKDF2_ITERATIONS).toBeGreaterThanOrEqual(100_000);
  });

  it("uses 16-byte salt", () => {
    expect(SALT_LENGTH).toBe(16);
  });

  it("uses 12-byte IV for AES-GCM", () => {
    expect(IV_LENGTH).toBe(12);
  });
});

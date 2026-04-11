import { describe, it, expect, beforeEach } from "vitest";
import { saveToken, loadToken, clearToken } from "../tokenStorage.js";

describe("tokenStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when no token is stored", () => {
    expect(loadToken()).toBeNull();
  });

  it("saves and loads a token", () => {
    saveToken("ghp_abc123");

    expect(loadToken()).toBe("ghp_abc123");
  });

  it("overwrites a previously saved token", () => {
    saveToken("ghp_first");
    saveToken("ghp_second");

    expect(loadToken()).toBe("ghp_second");
  });

  it("clears the stored token", () => {
    saveToken("ghp_abc123");
    clearToken();

    expect(loadToken()).toBeNull();
  });

  it("clearToken is safe to call when no token exists", () => {
    clearToken();

    expect(loadToken()).toBeNull();
  });
});

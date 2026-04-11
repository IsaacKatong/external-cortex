import { describe, it, expect, vi, beforeEach } from "vitest";
import { downloadGraphJson } from "../commitFile.js";

describe("downloadGraphJson", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns file content on success", async () => {
    const mockContent = '{"datums":[]}';
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(mockContent, { status: 200 })
    );

    const result = await downloadGraphJson("token123", "owner/repo");

    expect(result).toBe(mockContent);
    expect(fetch).toHaveBeenCalledWith(
      "https://api.github.com/repos/owner/repo/contents/graph.json",
      {
        headers: {
          Authorization: "Bearer token123",
          Accept: "application/vnd.github.raw+json",
        },
        cache: "no-store",
      }
    );
  });

  it("returns null on 404", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("Not Found", { status: 404 })
    );

    const result = await downloadGraphJson("token123", "owner/repo");
    expect(result).toBeNull();
  });

  it("returns null on network error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network error"));

    const result = await downloadGraphJson("token123", "owner/repo");
    expect(result).toBeNull();
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { getFileSha, commitGraphJson, getRemoteVersion } from "../commitFile.js";

const mockFetch = vi.fn();

describe("commitFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", mockFetch);
  });

  describe("getFileSha", () => {
    it("returns the SHA when the file exists", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ sha: "abc123" }),
      });

      const sha = await getFileSha("token", "user/repo", "graph.json");

      expect(sha).toBe("abc123");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.github.com/repos/user/repo/contents/graph.json",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer token",
          }),
        })
      );
    });

    it("returns null when the file does not exist (404)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const sha = await getFileSha("token", "user/repo", "graph.json");

      expect(sha).toBeNull();
    });

    it("throws on other API errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(
        getFileSha("token", "user/repo", "graph.json")
      ).rejects.toThrow("GitHub API error fetching graph.json: 500");
    });

    it("passes ref as query parameter when provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ sha: "abc123" }),
      });

      await getFileSha("token", "user/repo", "graph.json", "my-branch");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.github.com/repos/user/repo/contents/graph.json?ref=my-branch",
        expect.anything()
      );
    });
  });

  describe("getRemoteVersion", () => {
    it("returns version from plain JSON graph", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ version: 5, datums: [] }),
      });

      const version = await getRemoteVersion("token", "user/repo");
      expect(version).toBe(5);
    });

    it("returns version from encrypted envelope", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ graph_blob: "abc123", version: 3 }),
      });

      const version = await getRemoteVersion("token", "user/repo");
      expect(version).toBe(3);
    });

    it("returns 0 when file does not exist", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const version = await getRemoteVersion("token", "user/repo");
      expect(version).toBe(0);
    });

    it("returns 0 for legacy raw base64 content", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => "not-json-base64-blob",
      });

      const version = await getRemoteVersion("token", "user/repo");
      expect(version).toBe(0);
    });
  });

  describe("commitGraphJson", () => {
    /**
     * Helper to set up mock responses for the full PR-based commit flow.
     *
     * Order: getRemoteVersion (download) → getBranchSha → deleteBranch →
     * createBranch → getFileSha → PUT file → createPR → mergePR → deleteBranch
     */
    function setupMocks(remoteVersion: number, fileSha: string | null) {
      // 1. getRemoteVersion → downloadGraphJson → fetch raw
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ version: remoteVersion }),
      });
      // 2. getBranchSha
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ object: { sha: "main-sha-123" } }),
      });
      // 3. deleteBranch (cleanup stale) — returns 204 or 404
      mockFetch.mockResolvedValueOnce({ ok: true, status: 204 });
      // 4. createBranch
      mockFetch.mockResolvedValueOnce({ ok: true, status: 201 });
      // 5. getFileSha on branch
      if (fileSha) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ sha: fileSha }),
        });
      } else {
        mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });
      }
      // 6. PUT file
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });
      // 7. createPR
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ number: 42 }),
      });
      // 8. mergePR
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });
      // 9. deleteBranch (cleanup)
      mockFetch.mockResolvedValueOnce({ ok: true, status: 204 });
    }

    it("creates a PR and merges when version is valid", async () => {
      setupMocks(2, "existing-sha");

      const content = JSON.stringify({ version: 3, datums: [] });
      await commitGraphJson("token", "user/repo", content);

      // Verify createPR was called
      const prCall = mockFetch.mock.calls.find(
        (c) =>
          typeof c[1] === "object" &&
          c[1]?.method === "POST" &&
          typeof c[0] === "string" &&
          c[0].includes("/pulls")
      );
      expect(prCall).toBeDefined();

      // Verify merge was called
      const mergeCall = mockFetch.mock.calls.find(
        (c) =>
          typeof c[1] === "object" &&
          c[1]?.method === "PUT" &&
          typeof c[0] === "string" &&
          c[0].includes("/merge")
      );
      expect(mergeCall).toBeDefined();
    });

    it("throws version conflict when version is not remote + 1", async () => {
      // Remote is v5, trying to push v3 (should be v6)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ version: 5 }),
      });

      const content = JSON.stringify({ version: 3, datums: [] });
      await expect(
        commitGraphJson("token", "user/repo", content)
      ).rejects.toThrow("Version conflict");
    });

    it("includes SHA when updating an existing file", async () => {
      setupMocks(0, "existing-sha");

      const content = JSON.stringify({ version: 1, datums: [] });
      await commitGraphJson("token", "user/repo", content);

      // Find the PUT call (for file content)
      const putCall = mockFetch.mock.calls.find(
        (c) =>
          typeof c[1] === "object" &&
          c[1]?.method === "PUT" &&
          typeof c[0] === "string" &&
          c[0].includes("/contents/")
      );
      expect(putCall).toBeDefined();
      const body = JSON.parse(putCall![1].body as string) as Record<string, string>;
      expect(body["sha"]).toBe("existing-sha");
    });

    it("uses a custom commit message", async () => {
      setupMocks(0, null);

      const content = JSON.stringify({ version: 1 });
      await commitGraphJson(
        "token",
        "user/repo",
        content,
        "Custom message"
      );

      const putCall = mockFetch.mock.calls.find(
        (c) =>
          typeof c[1] === "object" &&
          c[1]?.method === "PUT" &&
          typeof c[0] === "string" &&
          c[0].includes("/contents/")
      );
      const body = JSON.parse(putCall![1].body as string) as Record<string, string>;
      expect(body["message"]).toBe("Custom message");
    });

    it("correctly base64-encodes content with Unicode characters", async () => {
      setupMocks(0, null);

      const content = JSON.stringify({ version: 1, name: "caf\u00e9" });
      await commitGraphJson("token", "user/repo", content);

      const putCall = mockFetch.mock.calls.find(
        (c) =>
          typeof c[1] === "object" &&
          c[1]?.method === "PUT" &&
          typeof c[0] === "string" &&
          c[0].includes("/contents/")
      );
      const body = JSON.parse(putCall![1].body as string) as Record<string, string>;

      // Decode and verify
      const decoded = new TextDecoder().decode(
        Uint8Array.from(atob(body["content"]!), (c) => c.charCodeAt(0))
      );
      expect(decoded).toBe(content);
    });

    it("cleans up branch on failure", async () => {
      // getRemoteVersion
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ version: 0 }),
      });
      // getBranchSha
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ object: { sha: "main-sha-123" } }),
      });
      // deleteBranch (stale cleanup)
      mockFetch.mockResolvedValueOnce({ ok: true, status: 204 });
      // createBranch
      mockFetch.mockResolvedValueOnce({ ok: true, status: 201 });
      // getFileSha — returns 404
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });
      // PUT file — fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "Server Error",
      });
      // deleteBranch (cleanup on failure)
      mockFetch.mockResolvedValueOnce({ ok: true, status: 204 });

      const content = JSON.stringify({ version: 1 });
      await expect(
        commitGraphJson("token", "user/repo", content)
      ).rejects.toThrow("GitHub API error committing graph.json");

      // Verify branch cleanup was called
      const deleteCalls = mockFetch.mock.calls.filter(
        (c) =>
          typeof c[1] === "object" &&
          c[1]?.method === "DELETE" &&
          typeof c[0] === "string" &&
          c[0].includes("/git/refs/heads/")
      );
      expect(deleteCalls.length).toBeGreaterThanOrEqual(1);
    });
  });
});

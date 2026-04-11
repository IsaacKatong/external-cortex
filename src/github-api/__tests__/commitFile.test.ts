import { describe, it, expect, vi, beforeEach } from "vitest";
import { getFileSha, commitGraphJson } from "../commitFile.js";

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
  });

  describe("commitGraphJson", () => {
    it("commits a new file when SHA is null (file does not exist)", async () => {
      // getFileSha returns 404
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });
      // PUT succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
      });

      await commitGraphJson("token", "user/repo", '{"datums":[]}');

      const putCall = mockFetch.mock.calls[1]!;
      const body = JSON.parse(putCall[1].body as string) as Record<
        string,
        string
      >;

      expect(putCall[0]).toBe(
        "https://api.github.com/repos/user/repo/contents/graph.json"
      );
      expect(putCall[1].method).toBe("PUT");
      expect(body["sha"]).toBeUndefined();
      expect(body["message"]).toBe("Update graph.json via External Cortex");
      expect(body["content"]).toBeDefined();
    });

    it("includes SHA when updating an existing file", async () => {
      // getFileSha returns existing SHA
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ sha: "existing-sha" }),
      });
      // PUT succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      await commitGraphJson("token", "user/repo", '{"datums":[]}');

      const putCall = mockFetch.mock.calls[1]!;
      const body = JSON.parse(putCall[1].body as string) as Record<
        string,
        string
      >;

      expect(body["sha"]).toBe("existing-sha");
    });

    it("uses a custom commit message", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });
      mockFetch.mockResolvedValueOnce({ ok: true, status: 201 });

      await commitGraphJson(
        "token",
        "user/repo",
        "{}",
        "Custom message"
      );

      const putCall = mockFetch.mock.calls[1]!;
      const body = JSON.parse(putCall[1].body as string) as Record<
        string,
        string
      >;

      expect(body["message"]).toBe("Custom message");
    });

    it("throws when the PUT fails", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        text: async () => "Conflict",
      });

      await expect(
        commitGraphJson("token", "user/repo", "{}")
      ).rejects.toThrow("GitHub API error committing graph.json: 409");
    });

    it("correctly base64-encodes content with Unicode characters", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });
      mockFetch.mockResolvedValueOnce({ ok: true, status: 201 });

      const content = '{"name":"caf\u00e9"}';
      await commitGraphJson("token", "user/repo", content);

      const putCall = mockFetch.mock.calls[1]!;
      const body = JSON.parse(putCall[1].body as string) as Record<
        string,
        string
      >;

      // Decode and verify
      const decoded = new TextDecoder().decode(
        Uint8Array.from(atob(body["content"]!), (c) => c.charCodeAt(0))
      );
      expect(decoded).toBe(content);
    });
  });
});

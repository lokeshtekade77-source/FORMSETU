import { describe, it, expect, vi, beforeEach } from "vitest";
import { api, ApiError } from "./api";

global.fetch = vi.fn();

describe("FormSetu API Client", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("creates a session successfully", async () => {
    const mockRes = { id: "session-123", status: "active", application: { id: "app-123", status: "draft" } };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRes,
    });

    const res = await api.createSession();
    expect(res.id).toBe("session-123");
    expect(res.application?.id).toBe("app-123");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/sessions"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("retrieves document requirements", async () => {
    const mockReqs = [{ id: "req-1", document_type: "photo", label: "Photograph", required: true }];
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockReqs,
    });

    const res = await api.getRequirements("app-123");
    expect(res).toHaveLength(1);
    expect(res[0].document_type).toBe("photo");
  });

  it("retrieves previous applications", async () => {
    const mockPrevious = [{ id: "prev-1", title: "Recruitment 2025", year: 2025 }];
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPrevious,
    });

    const res = await api.getPreviousApplications("session-123");
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe("prev-1");
  });

  it("starts an import comparison", async () => {
    const mockImport = { id: "imp-1", status: "reviewing", field_count: 20 };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockImport,
    });

    const res = await api.createImport("app-123", "prev-1");
    expect(res.id).toBe("imp-1");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/applications/app-123/imports"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ previous_application_id: "prev-1" }),
      })
    );
  });

  it("submits a field decision", async () => {
    const mockDecision = { id: "fi-1", decision: "use", value: "Aarav" };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDecision,
    });

    const res = await api.setImportFieldDecision("imp-1", "fi-1", "use");
    expect(res.decision).toBe("use");
  });

  it("resolves a conflict", async () => {
    const mockResolution = { id: "conf-1", status: "resolved", resolved_value: "Bhandara" };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResolution,
    });

    const res = await api.resolveConflict("conf-1", "current");
    expect(res.resolved_value).toBe("Bhandara");
  });

  it("saves a declaration", async () => {
    const mockDecl = { accepted: true };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDecl,
    });

    const res = await api.saveDeclaration("app-123", true);
    expect(res.accepted).toBe(true);
  });

  it("completes the demo application", async () => {
    const mockCompletion = { status: "ready", message: "Application Ready", external_submission: false };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCompletion,
    });

    const res = await api.completeDemo("app-123");
    expect(res.status).toBe("ready");
    expect(res.message).toBe("Application Ready");
  });

  it("handles network errors cleanly", async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error("Network disconnect"));

    await expect(api.createSession()).rejects.toThrow(ApiError);
    await expect(api.createSession()).rejects.toThrow("FormSetu service is unavailable");
  });
});

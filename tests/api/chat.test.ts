import { describe, it, expect, vi } from "vitest";

// Mock the AI client module — chatStream returns a ReadableStream of strings
vi.mock("@/lib/ai/client", () => ({
  chatStream: vi.fn().mockReturnValue(
    new ReadableStream({
      start(controller) {
        controller.enqueue(
          "Based on recent data, Montgomery has seen improvements in public safety.",
        );
        controller.close();
      },
    }),
  ),
}));

// Mock the arcgis module
vi.mock("@/lib/arcgis", () => ({
  queryFeatureServer: vi.fn().mockResolvedValue({ features: [] }),
}));

// We test the route handler logic directly since supertest needs a running server
import { POST } from "@/app/api/chat/[portal]/route";

describe("POST /api/chat/[portal]", () => {
  it("returns 400 for invalid portal", async () => {
    const request = new Request("http://localhost:3000/api/chat/invalid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Hello" }),
    });
    const response = await POST(request as any, {
      params: Promise.resolve({ portal: "invalid" }),
    });
    expect(response.status).toBe(400);
  });

  it("returns 400 when message is missing", async () => {
    const request = new Request("http://localhost:3000/api/chat/resident", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const response = await POST(request as any, {
      params: Promise.resolve({ portal: "resident" }),
    });
    expect(response.status).toBe(400);
  });

  it("returns 200 with streamed text for valid request", async () => {
    const request = new Request("http://localhost:3000/api/chat/resident", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "What are the crime stats?" }),
    });
    const response = await POST(request as any, {
      params: Promise.resolve({ portal: "resident" }),
    });
    expect(response.status).toBe(200);

    const text = await response.text();
    expect(text).toContain("Montgomery");
    expect(response.headers.get("Content-Type")).toBe(
      "text/plain; charset=utf-8",
    );
  });
});

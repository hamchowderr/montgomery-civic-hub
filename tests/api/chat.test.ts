import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the AI client module
vi.mock("@/lib/ai/client", () => ({
  chat: vi.fn().mockResolvedValue({
    content:
      "Based on recent data, Montgomery has seen improvements in public safety.",
    toolCalls: [
      {
        name: "arcgis_query",
        input: { dataset: "Crime Statistics" },
        result: {},
      },
    ],
  }),
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
      params: { portal: "invalid" },
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
      params: { portal: "resident" },
    });
    expect(response.status).toBe(400);
  });

  it("returns 200 with message for valid request", async () => {
    const request = new Request("http://localhost:3000/api/chat/resident", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "What are the crime stats?" }),
    });
    const response = await POST(request as any, {
      params: { portal: "resident" },
    });
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("message");
    expect(typeof data.message).toBe("string");
  });
});

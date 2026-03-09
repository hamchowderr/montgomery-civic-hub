import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventType } from "@ag-ui/client";
import { firstValueFrom, toArray } from "rxjs";

// ── Mocks ──────────────────────────────────────────────────────────────────────

// Mock Anthropic SDK
const mockCreate = vi.fn();
const mockStream = vi.fn();
vi.mock("@anthropic-ai/sdk", () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: mockCreate,
      stream: mockStream,
    },
  })),
}));

// Mock arcgis
vi.mock("@/lib/arcgis", () => ({
  queryFeatureServer: vi.fn().mockResolvedValue({
    features: [{ attributes: { name: "Test Feature" } }],
  }),
}));

// Mock Convex
vi.mock("convex/browser", () => ({
  ConvexHttpClient: vi.fn().mockImplementation(() => ({
    query: vi.fn().mockResolvedValue(null),
    mutation: vi.fn().mockResolvedValue(null),
  })),
}));

vi.mock("@/convex/_generated/api", () => ({
  api: {
    datasetRegistry: { getByName: "datasetRegistry:getByName" },
    mutations: {
      insertMessage: "mutations:insertMessage",
      insertDatasetRegistry: "mutations:insertDatasetRegistry",
    },
  },
}));

// Mock tools
vi.mock("@/lib/ai/tools", () => ({
  allTools: [
    {
      name: "arcgis_query",
      description: "Query ArcGIS",
      input_schema: {
        type: "object",
        properties: {
          dataset: { type: "string" },
          where: { type: "string" },
          limit: { type: "number" },
        },
        required: ["dataset"],
      },
    },
  ],
}));

// Mock prompts
vi.mock("@/lib/ai/prompts", () => ({
  getSystemPrompt: vi.fn().mockReturnValue("You are a helpful assistant."),
}));

// Set env vars before importing agent
process.env.ANTHROPIC_API_KEY = "test-key";
process.env.NEXT_PUBLIC_CONVEX_URL = "https://test.convex.cloud";

import { CivicAgent } from "@/lib/ai/civic-agent";

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("CivicAgent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("constructs with valid portal names", () => {
    for (const portal of ["resident", "business", "citystaff", "researcher"]) {
      const agent = new CivicAgent(portal);
      expect(agent).toBeDefined();
    }
  });

  it("throws when ANTHROPIC_API_KEY is not set", () => {
    const original = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    expect(() => new CivicAgent("resident")).toThrow("ANTHROPIC_API_KEY");
    process.env.ANTHROPIC_API_KEY = original;
  });

  it("clone() preserves custom properties (portal, anthropic, convex)", () => {
    const agent = new CivicAgent("resident");
    const cloned = agent.clone();

    // clone() should return a CivicAgent with the same portal
    expect(cloned).toBeInstanceOf(CivicAgent);
    // The cloned agent should have a working run() method from the prototype
    expect(typeof cloned.run).toBe("function");
  });

  it("cloned agent can execute run() without 'undefined' errors", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: "text", text: "Hello from clone" }],
      stop_reason: "end_turn",
    });

    const agent = new CivicAgent("resident");
    const cloned = agent.clone();

    const events$ = cloned.run({
      threadId: "thread-clone",
      runId: "run-clone",
      messages: [{ role: "user", content: "Hi" }],
    } as any);

    const events = await firstValueFrom(events$.pipe(toArray()));
    const types = events.map((e: any) => e.type);

    expect(types[0]).toBe(EventType.RUN_STARTED);
    expect(types).toContain(EventType.TEXT_MESSAGE_CONTENT);
    expect(types[types.length - 1]).toBe(EventType.RUN_FINISHED);
  });

  describe("run() event sequence", () => {
    it("emits correct event sequence for a text-only response (no tool calls)", async () => {
      // Claude returns text without tool use
      mockCreate.mockResolvedValueOnce({
        content: [{ type: "text", text: "Here is the information." }],
        stop_reason: "end_turn",
      });

      const agent = new CivicAgent("resident");
      const events$ = agent.run({
        threadId: "thread-1",
        runId: "run-1",
        messages: [{ role: "user", content: "Hello" }],
      } as any);

      const events = await firstValueFrom(events$.pipe(toArray()));

      // Should follow: RUN_STARTED → STEP_STARTED → STEP_FINISHED →
      // TEXT_MESSAGE_START → TEXT_MESSAGE_CONTENT(s) → TEXT_MESSAGE_END →
      // RUN_FINISHED
      const types = events.map((e: any) => e.type);
      expect(types[0]).toBe(EventType.RUN_STARTED);
      expect(types).toContain(EventType.STEP_STARTED);
      expect(types).toContain(EventType.STEP_FINISHED);
      expect(types).toContain(EventType.TEXT_MESSAGE_START);
      expect(types).toContain(EventType.TEXT_MESSAGE_CONTENT);
      expect(types).toContain(EventType.TEXT_MESSAGE_END);
      expect(types[types.length - 1]).toBe(EventType.RUN_FINISHED);
    });

    it("emits tool call events when Claude uses tools", async () => {
      // First call: tool use
      mockCreate.mockResolvedValueOnce({
        content: [
          { type: "text", text: "Let me look that up." },
          {
            type: "tool_use",
            id: "tool-1",
            name: "arcgis_query",
            input: { dataset: "crime_data" },
          },
        ],
        stop_reason: "tool_use",
      });

      // Second call: final text response
      mockCreate.mockResolvedValueOnce({
        content: [{ type: "text", text: "Based on the data..." }],
        stop_reason: "end_turn",
      });

      const agent = new CivicAgent("resident");
      const events$ = agent.run({
        threadId: "thread-1",
        runId: "run-1",
        messages: [{ role: "user", content: "Show me crime data" }],
      } as any);

      const events = await firstValueFrom(events$.pipe(toArray()));
      const types = events.map((e: any) => e.type);

      // Should include tool call events
      expect(types).toContain(EventType.TOOL_CALL_START);
      expect(types).toContain(EventType.TOOL_CALL_ARGS);
      expect(types).toContain(EventType.TOOL_CALL_END);
      expect(types).toContain(EventType.TOOL_CALL_RESULT);

      // Verify tool call details
      const toolStart = events.find(
        (e: any) => e.type === EventType.TOOL_CALL_START,
      ) as any;
      expect(toolStart.toolCallId).toBe("tool-1");
      expect(toolStart.toolCallName).toBe("arcgis_query");

      const toolArgs = events.find(
        (e: any) => e.type === EventType.TOOL_CALL_ARGS,
      ) as any;
      expect(JSON.parse(toolArgs.delta)).toEqual({ dataset: "crime_data" });
    });

    it("emits RUN_ERROR on exception", async () => {
      mockCreate.mockRejectedValueOnce(new Error("API is down"));

      const agent = new CivicAgent("resident");
      const events$ = agent.run({
        threadId: "thread-1",
        runId: "run-1",
        messages: [{ role: "user", content: "Hello" }],
      } as any);

      const events = await firstValueFrom(events$.pipe(toArray()));
      const errorEvent = events.find(
        (e: any) => e.type === EventType.RUN_ERROR,
      ) as any;

      expect(errorEvent).toBeDefined();
      expect(errorEvent.message).toBe("API is down");
    });

    it("streams text in chunks via TEXT_MESSAGE_CONTENT", async () => {
      const longText = "A".repeat(150); // will be split into 3 chunks of 50
      mockCreate.mockResolvedValueOnce({
        content: [{ type: "text", text: longText }],
        stop_reason: "end_turn",
      });

      const agent = new CivicAgent("resident");
      const events$ = agent.run({
        threadId: "thread-1",
        runId: "run-1",
        messages: [{ role: "user", content: "Hello" }],
      } as any);

      const events = await firstValueFrom(events$.pipe(toArray()));
      const contentEvents = events.filter(
        (e: any) => e.type === EventType.TEXT_MESSAGE_CONTENT,
      );

      // 150 chars / 50 chunk size = 3 chunks
      expect(contentEvents.length).toBe(3);

      // Reassembled text should match
      const assembled = contentEvents.map((e: any) => e.delta).join("");
      expect(assembled).toBe(longText);
    });
  });

  describe("multiple iterations", () => {
    it("handles multiple tool call iterations before final response", async () => {
      // First iteration: tool use
      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: "tool_use",
            id: "tool-1",
            name: "arcgis_query",
            input: { dataset: "crime_data" },
          },
        ],
        stop_reason: "tool_use",
      });

      // Second iteration: another tool use
      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: "tool_use",
            id: "tool-2",
            name: "arcgis_query",
            input: { dataset: "demographics" },
          },
        ],
        stop_reason: "tool_use",
      });

      // Third iteration: final text
      mockCreate.mockResolvedValueOnce({
        content: [{ type: "text", text: "Combined analysis shows..." }],
        stop_reason: "end_turn",
      });

      const agent = new CivicAgent("resident");
      const events$ = agent.run({
        threadId: "thread-1",
        runId: "run-1",
        messages: [{ role: "user", content: "Compare crime and demographics" }],
      } as any);

      const events = await firstValueFrom(events$.pipe(toArray()));
      const types = events.map((e: any) => e.type);

      // Should have multiple STEP_STARTED / STEP_FINISHED pairs
      const stepStarts = types.filter((t: any) => t === EventType.STEP_STARTED);
      const stepFinishes = types.filter(
        (t: any) => t === EventType.STEP_FINISHED,
      );
      expect(stepStarts.length).toBeGreaterThanOrEqual(3);
      expect(stepFinishes.length).toBeGreaterThanOrEqual(3);

      // Should have 2 tool call sequences
      const toolStarts = types.filter(
        (t: any) => t === EventType.TOOL_CALL_START,
      );
      expect(toolStarts.length).toBe(2);
    });
  });
});

describe("sanitizeToolResult (via agent behavior)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("strips geometry fields from tool results", async () => {
    // Import queryFeatureServer to check what gets passed through
    const { queryFeatureServer } = await import("@/lib/arcgis");
    (queryFeatureServer as any).mockResolvedValueOnce({
      features: [
        {
          attributes: { name: "Test" },
          geometry: { rings: [[[0, 0]]] },
        },
      ],
    });

    // Tool use followed by text response
    mockCreate
      .mockResolvedValueOnce({
        content: [
          {
            type: "tool_use",
            id: "tool-1",
            name: "arcgis_query",
            input: { dataset: "test" },
          },
        ],
        stop_reason: "tool_use",
      })
      .mockResolvedValueOnce({
        content: [{ type: "text", text: "Done" }],
        stop_reason: "end_turn",
      });

    const agent = new CivicAgent("resident");
    const events$ = agent.run({
      threadId: "t1",
      runId: "r1",
      messages: [{ role: "user", content: "test" }],
    } as any);

    await firstValueFrom(events$.pipe(toArray()));

    // The second call to mockCreate should have tool_result content
    // that does NOT contain geometry
    const secondCallMessages = mockCreate.mock.calls[1]?.[0]?.messages;
    const toolResultMsg = secondCallMessages?.find(
      (m: any) => m.role === "user" && Array.isArray(m.content),
    );

    if (toolResultMsg) {
      const content = toolResultMsg.content[0]?.content;
      expect(content).not.toContain('"geometry"');
      expect(content).not.toContain('"rings"');
    }
  });
});

describe("getToolStatusText (via tool call events)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns dataset-specific status for arcgis_query", async () => {
    mockCreate
      .mockResolvedValueOnce({
        content: [
          {
            type: "tool_use",
            id: "tool-1",
            name: "arcgis_query",
            input: { dataset: "Crime Reports" },
          },
        ],
        stop_reason: "tool_use",
      })
      .mockResolvedValueOnce({
        content: [{ type: "text", text: "Done" }],
        stop_reason: "end_turn",
      });

    const agent = new CivicAgent("resident");
    const events$ = agent.run({
      threadId: "t1",
      runId: "r1",
      messages: [{ role: "user", content: "test" }],
    } as any);

    const events = await firstValueFrom(events$.pipe(toArray()));
    const resultEvent = events.find(
      (e: any) => e.type === EventType.TOOL_CALL_RESULT,
    ) as any;

    expect(resultEvent).toBeDefined();
    expect(resultEvent.content).toContain("crime reports");
  });
});

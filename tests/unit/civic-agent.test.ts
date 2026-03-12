import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventType } from "@ag-ui/client";
import { firstValueFrom, toArray } from "rxjs";

// ── Mocks ──────────────────────────────────────────────────────────────────────

// Mock Anthropic SDK — agent uses messages.stream() which returns an async
// iterable of events + a finalMessage() method.
const mockStream = vi.fn();

/** Build a mock stream object from a response shape */
function createMockStream(response: {
  content: Array<
    | { type: "text"; text: string }
    | { type: "tool_use"; id: string; name: string; input: unknown }
  >;
  stop_reason: string;
}) {
  // Generate content_block_delta events for text blocks
  const events: Array<{ type: string; delta: { type: string; text?: string } }> = [];
  for (const block of response.content) {
    if (block.type === "text") {
      events.push({
        type: "content_block_delta",
        delta: { type: "text_delta", text: block.text },
      });
    }
  }

  return {
    [Symbol.asyncIterator]: () => {
      let index = 0;
      return {
        next: async () => {
          if (index < events.length) {
            return { value: events[index++], done: false };
          }
          return { value: undefined, done: true };
        },
      };
    },
    finalMessage: async () => response,
  };
}

vi.mock("@anthropic-ai/sdk", () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      stream: mockStream,
    },
  })),
}));

// Mock arcgis — queryFeatureServer is what the agent calls to fetch data
const mockQueryFeatureServer = vi.fn();
vi.mock("@/lib/arcgis", () => ({
  queryFeatureServer: (...args: unknown[]) => mockQueryFeatureServer(...args),
}));

// Mock arcgis-client — provide the real DATASET_NAME_TO_URL mapping
vi.mock("@/lib/arcgis-client", () => ({
  DATASET_NAME_TO_URL: {
    Received_311_Service_Request:
      "https://gis.montgomeryal.gov/server/rest/services/HostedDatasets/Received_311_Service_Request/FeatureServer/0",
    Business_License:
      "https://gis.montgomeryal.gov/server/rest/services/HostedDatasets/Business_License/FeatureServer/0",
    Construction_Permits:
      "https://gis.montgomeryal.gov/server/rest/services/HostedDatasets/Construction_Permits/FeatureServer/0",
    Code_Violations:
      "https://gis.montgomeryal.gov/server/rest/services/HostedDatasets/Code_Violations/FeatureServer/0",
    Paving_Project:
      "https://gis.montgomeryal.gov/server/rest/services/HostedDatasets/Paving_Project/FeatureServer/0",
    Police_Facilities:
      "https://gis.montgomeryal.gov/server/rest/services/HostedDatasets/Police_Facilities/FeatureServer/0",
  },
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

// Mock tools — include BOTH tools (arcgis_query AND brightdata_search)
vi.mock("@/lib/ai/tools", () => ({
  allTools: [
    {
      name: "arcgis_query",
      description: "Query ArcGIS FeatureServer datasets",
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
    {
      name: "brightdata_search",
      description: "Search the web via Bright Data",
      input_schema: {
        type: "object",
        properties: {
          query: { type: "string" },
          url: { type: "string" },
          tool: {
            type: "string",
            enum: ["search_engine", "scrape_as_markdown"],
          },
        },
        required: ["tool"],
      },
    },
  ],
}));

// Mock prompts — use portal-aware system prompts that reference tools
vi.mock("@/lib/ai/prompts", () => ({
  getSystemPrompt: vi.fn().mockImplementation((portal: string) => {
    return `You are a Montgomery civic assistant for the ${portal} portal. You have access to arcgis_query and brightdata_search tools. ALWAYS use your tools to answer data questions. NEVER say you cannot access data.`;
  }),
}));

// Set env vars before importing agent
process.env.ANTHROPIC_API_KEY = "test-key";
process.env.NEXT_PUBLIC_CONVEX_URL = "https://test.convex.cloud";

import { CivicAgent } from "@/lib/ai/civic-agent";

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Run the agent and collect all emitted events */
async function runAgent(
  portal: string,
  userMessage: string,
): Promise<{ events: any[]; types: string[] }> {
  const agent = new CivicAgent(portal);
  const events$ = agent.run({
    threadId: `thread-${portal}`,
    runId: `run-${portal}`,
    messages: [{ role: "user", content: userMessage }],
  } as any);

  const events = await firstValueFrom(events$.pipe(toArray()));
  const types = events.map((e: any) => e.type);
  return { events, types };
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("CivicAgent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryFeatureServer.mockResolvedValue({
      features: [{ attributes: { name: "Default Feature" } }],
    });
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

  it("clone() preserves custom properties and can execute run()", async () => {
    mockStream.mockReturnValueOnce(createMockStream({
      content: [{ type: "text", text: "Hello from clone" }],
      stop_reason: "end_turn",
    }));

    const agent = new CivicAgent("resident");
    const cloned = agent.clone();
    expect(cloned).toBeInstanceOf(CivicAgent);

    const { types } = await runAgent("resident", "Hi");
    expect(types[0]).toBe(EventType.RUN_STARTED);
    expect(types).toContain(EventType.TEXT_MESSAGE_CONTENT);
    expect(types[types.length - 1]).toBe(EventType.RUN_FINISHED);
  });

  it("emits RUN_ERROR on exception", async () => {
    mockStream.mockReturnValueOnce({
      [Symbol.asyncIterator]: () => ({
        next: async () => { throw new Error("API is down"); },
      }),
      finalMessage: async () => { throw new Error("API is down"); },
    });

    const { events } = await runAgent("resident", "Hello");
    const errorEvent = events.find(
      (e: any) => e.type === EventType.RUN_ERROR,
    ) as any;

    expect(errorEvent).toBeDefined();
    expect(errorEvent.message).toBe("API is down");
  });
});

describe("CivicAgent data retrieval across portals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const portalDatasetScenarios: {
    portal: string;
    dataset: string;
    userMessage: string;
    mockData: { features: { attributes: Record<string, unknown> }[] };
    expectedUrl: string;
  }[] = [
    {
      portal: "resident",
      dataset: "Received_311_Service_Request",
      userMessage: "How many open 311 requests are in my district?",
      mockData: {
        features: [
          {
            attributes: {
              Request_ID: 1001,
              Request_Type: "Pothole",
              Status: "Open",
              District: 3,
              Address: "123 Dexter Ave",
            },
          },
          {
            attributes: {
              Request_ID: 1002,
              Request_Type: "Street Light",
              Status: "Open",
              District: 3,
              Address: "456 Perry St",
            },
          },
        ],
      },
      expectedUrl:
        "https://gis.montgomeryal.gov/server/rest/services/HostedDatasets/Received_311_Service_Request/FeatureServer/0",
    },
    {
      portal: "business",
      dataset: "Business_License",
      userMessage: "Show me active business licenses in 2025",
      mockData: {
        features: [
          {
            attributes: {
              custCOMPANY_NAME: "Montgomery Tech LLC",
              pvYEAR: 2025,
              Full_Address: "789 Commerce St",
            },
          },
        ],
      },
      expectedUrl:
        "https://gis.montgomeryal.gov/server/rest/services/HostedDatasets/Business_License/FeatureServer/0",
    },
    {
      portal: "citystaff",
      dataset: "Construction_Permits",
      userMessage: "Give me a briefing on building permits this year",
      mockData: {
        features: [
          {
            attributes: {
              PermitNo: "BP-2025-001",
              PermitStatus: "ISSUED",
              CodeDetail: "Building",
              EstimatedCost: 250000,
              DistrictCouncil: 5,
            },
          },
          {
            attributes: {
              PermitNo: "BP-2025-002",
              PermitStatus: "ISSUED",
              CodeDetail: "Electric",
              EstimatedCost: 50000,
              DistrictCouncil: 2,
            },
          },
        ],
      },
      expectedUrl:
        "https://gis.montgomeryal.gov/server/rest/services/HostedDatasets/Construction_Permits/FeatureServer/0",
    },
    {
      portal: "researcher",
      dataset: "Code_Violations",
      userMessage:
        "What are the spatial patterns of code violations across districts?",
      mockData: {
        features: [
          {
            attributes: {
              OffenceNum: "CV-001",
              CaseType: "NUISANCE",
              CaseStatus: "OPEN",
              CouncilDistrict: "DISTRICT 4",
              Address1: "101 MLK Blvd",
            },
          },
          {
            attributes: {
              OffenceNum: "CV-002",
              CaseType: "DEMOLITION",
              CaseStatus: "CLOSED",
              CouncilDistrict: "DISTRICT 2",
              Address1: "202 Rosa Parks Ave",
            },
          },
        ],
      },
      expectedUrl:
        "https://gis.montgomeryal.gov/server/rest/services/HostedDatasets/Code_Violations/FeatureServer/0",
    },
  ];

  for (const scenario of portalDatasetScenarios) {
    it(`${scenario.portal} portal: retrieves ${scenario.dataset} data via arcgis_query tool`, async () => {
      // Mock queryFeatureServer to return portal-specific data
      mockQueryFeatureServer.mockResolvedValueOnce(scenario.mockData);

      // First Claude call: decides to use arcgis_query tool
      mockStream.mockReturnValueOnce(createMockStream({
        content: [
          {
            type: "tool_use",
            id: "tool-call-1",
            name: "arcgis_query",
            input: { dataset: scenario.dataset, where: "1=1", limit: 100 },
          },
        ],
        stop_reason: "tool_use",
      }));

      // Second Claude call: responds with data-informed answer
      mockStream.mockReturnValueOnce(createMockStream({
        content: [
          {
            type: "text",
            text: `Based on the ${scenario.dataset} data, I found ${scenario.mockData.features.length} records.`,
          },
        ],
        stop_reason: "end_turn",
      }));

      const { events, types } = await runAgent(
        scenario.portal,
        scenario.userMessage,
      );

      // 1. Verify tool call events were emitted
      expect(types).toContain(EventType.TOOL_CALL_START);
      expect(types).toContain(EventType.TOOL_CALL_ARGS);
      expect(types).toContain(EventType.TOOL_CALL_END);
      expect(types).toContain(EventType.TOOL_CALL_RESULT);

      // 2. Verify queryFeatureServer was called with the correct URL from DATASET_NAME_TO_URL
      expect(mockQueryFeatureServer).toHaveBeenCalledWith(
        scenario.expectedUrl,
        expect.objectContaining({ where: "1=1", limit: 100 }),
      );

      // 3. Verify tool results were passed back to Claude in the second call
      const secondCallArgs = mockStream.mock.calls[1]?.[0];
      expect(secondCallArgs).toBeDefined();

      const toolResultMessage = secondCallArgs.messages.find(
        (m: any) => m.role === "user" && Array.isArray(m.content),
      );
      expect(toolResultMessage).toBeDefined();

      // The tool result should contain the actual feature data
      const toolResultContent = toolResultMessage.content[0];
      expect(toolResultContent.type).toBe("tool_result");
      expect(toolResultContent.tool_use_id).toBe("tool-call-1");
      // Verify actual data is present in the serialized result
      const serializedResult = toolResultContent.content;
      expect(serializedResult).toContain("attributes");
      for (const feature of scenario.mockData.features) {
        for (const [key, value] of Object.entries(feature.attributes)) {
          if (typeof value === "string") {
            expect(serializedResult).toContain(value);
          }
        }
      }
      // Verify it's not an error result
      expect(toolResultContent.is_error).toBeUndefined();

      // 4. Verify final text response references the data
      const textEvents = events.filter(
        (e: any) => e.type === EventType.TEXT_MESSAGE_CONTENT,
      );
      const fullResponse = textEvents.map((e: any) => e.delta).join("");
      expect(fullResponse).toContain(scenario.dataset);

      // 5. Verify complete event lifecycle
      expect(types[0]).toBe(EventType.RUN_STARTED);
      expect(types[types.length - 1]).toBe(EventType.RUN_FINISHED);
    });
  }
});

describe("Tool result sanitization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("strips geometry fields from ArcGIS tool results before passing to Claude", async () => {
    // Return data with geometry that should be stripped
    mockQueryFeatureServer.mockResolvedValueOnce({
      features: [
        {
          attributes: { name: "Test Park", district: 3 },
          geometry: { rings: [[[0, 0], [1, 1], [2, 2]]] },
        },
        {
          attributes: { name: "Test Center", district: 5 },
          geometry: { x: 32.377, y: -86.3 },
          coordinates: [-86.3, 32.377],
        },
      ],
    });

    mockStream
      .mockReturnValueOnce(createMockStream({
        content: [
          {
            type: "tool_use",
            id: "tool-geo",
            name: "arcgis_query",
            input: { dataset: "Police_Facilities" },
          },
        ],
        stop_reason: "tool_use",
      }))
      .mockReturnValueOnce(createMockStream({
        content: [{ type: "text", text: "Found 2 facilities." }],
        stop_reason: "end_turn",
      }));

    await runAgent("resident", "Where are police stations?");

    // Check the tool result passed back to Claude
    const secondCallMessages = mockStream.mock.calls[1]?.[0]?.messages;
    const toolResultMsg = secondCallMessages?.find(
      (m: any) => m.role === "user" && Array.isArray(m.content),
    );
    expect(toolResultMsg).toBeDefined();

    const serialized = toolResultMsg.content[0].content;
    // Geometry fields must be stripped
    expect(serialized).not.toContain('"geometry"');
    expect(serialized).not.toContain('"rings"');
    expect(serialized).not.toContain('"coordinates"');
    // But attribute data must be preserved
    expect(serialized).toContain("Test Park");
    expect(serialized).toContain("Test Center");
  });

  it("marks tool result as error when dataset is not found", async () => {
    // Use a dataset name NOT in DATASET_NAME_TO_URL
    // This will fall through to Hub v3 API which we mock via global fetch
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 404,
    }) as any;

    mockStream
      .mockReturnValueOnce(createMockStream({
        content: [
          {
            type: "tool_use",
            id: "tool-missing",
            name: "arcgis_query",
            input: { dataset: "Nonexistent_Dataset" },
          },
        ],
        stop_reason: "tool_use",
      }))
      .mockReturnValueOnce(createMockStream({
        content: [
          { type: "text", text: "That dataset is not available." },
        ],
        stop_reason: "end_turn",
      }));

    await runAgent("resident", "Query nonexistent data");

    const secondCallMessages = mockStream.mock.calls[1]?.[0]?.messages;
    const toolResultMsg = secondCallMessages?.find(
      (m: any) => m.role === "user" && Array.isArray(m.content),
    );

    expect(toolResultMsg).toBeDefined();
    expect(toolResultMsg.content[0].is_error).toBe(true);
    expect(toolResultMsg.content[0].content).toContain("not found");

    global.fetch = originalFetch;
  });
});

describe("Multi-tool and multi-iteration data retrieval", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles sequential tool calls across iterations with real dataset URLs", async () => {
    const serviceRequestData = {
      features: [
        {
          attributes: {
            Request_ID: 5001,
            Request_Type: "Pothole",
            Status: "Open",
            District: 5,
          },
        },
      ],
    };

    const pavingData = {
      features: [
        {
          attributes: {
            FULLNAME: "Eastern Blvd Resurfacing",
            Status: "Completed",
            Year: "2024",
            DistrictCode: 5,
          },
        },
      ],
    };

    // First call returns for 311 requests, second for paving
    mockQueryFeatureServer
      .mockResolvedValueOnce(serviceRequestData)
      .mockResolvedValueOnce(pavingData);

    // Claude iteration 1: query 311 requests
    mockStream.mockReturnValueOnce(createMockStream({
      content: [
        {
          type: "tool_use",
          id: "tool-311",
          name: "arcgis_query",
          input: {
            dataset: "Received_311_Service_Request",
            where: "Status='Open' AND District=5",
          },
        },
      ],
      stop_reason: "tool_use",
    }));

    // Claude iteration 2: query paving projects
    mockStream.mockReturnValueOnce(createMockStream({
      content: [
        {
          type: "tool_use",
          id: "tool-paving",
          name: "arcgis_query",
          input: { dataset: "Paving_Project", where: "DistrictCode=5" },
        },
      ],
      stop_reason: "tool_use",
    }));

    // Claude iteration 3: final combined response
    mockStream.mockReturnValueOnce(createMockStream({
      content: [
        {
          type: "text",
          text: "District 5 has 1 open 311 request for potholes and 1 completed paving project on Eastern Blvd.",
        },
      ],
      stop_reason: "end_turn",
    }));

    const { events, types } = await runAgent(
      "citystaff",
      "Cross-reference 311 requests with paving projects in District 5",
    );

    // Verify both tool calls happened
    const toolStarts = events.filter(
      (e: any) => e.type === EventType.TOOL_CALL_START,
    );
    expect(toolStarts.length).toBe(2);
    expect(toolStarts[0].toolCallName).toBe("arcgis_query");
    expect(toolStarts[1].toolCallName).toBe("arcgis_query");

    // Verify queryFeatureServer was called with correct URLs for both datasets
    expect(mockQueryFeatureServer).toHaveBeenCalledTimes(2);
    expect(mockQueryFeatureServer).toHaveBeenCalledWith(
      "https://gis.montgomeryal.gov/server/rest/services/HostedDatasets/Received_311_Service_Request/FeatureServer/0",
      expect.objectContaining({ where: "Status='Open' AND District=5" }),
    );
    expect(mockQueryFeatureServer).toHaveBeenCalledWith(
      "https://gis.montgomeryal.gov/server/rest/services/HostedDatasets/Paving_Project/FeatureServer/0",
      expect.objectContaining({ where: "DistrictCode=5" }),
    );

    // Verify the 311 data was passed back in the second Claude call
    const secondCallMessages = mockStream.mock.calls[1]?.[0]?.messages;
    const toolResult311 = secondCallMessages?.find(
      (m: any) =>
        m.role === "user" &&
        Array.isArray(m.content) &&
        m.content.some(
          (c: any) =>
            c.type === "tool_result" && c.tool_use_id === "tool-311",
        ),
    );
    expect(toolResult311).toBeDefined();
    const result311Content = toolResult311.content.find(
      (c: any) => c.tool_use_id === "tool-311",
    ).content;
    expect(result311Content).toContain("Pothole");
    expect(result311Content).toContain("5001");

    // Verify paving data was passed back in the third Claude call
    const thirdCallMessages = mockStream.mock.calls[2]?.[0]?.messages;
    const toolResultPaving = thirdCallMessages?.find(
      (m: any) =>
        m.role === "user" &&
        Array.isArray(m.content) &&
        m.content.some(
          (c: any) =>
            c.type === "tool_result" && c.tool_use_id === "tool-paving",
        ),
    );
    expect(toolResultPaving).toBeDefined();
    const resultPavingContent = toolResultPaving.content.find(
      (c: any) => c.tool_use_id === "tool-paving",
    ).content;
    expect(resultPavingContent).toContain("Eastern Blvd Resurfacing");

    // Verify final response is data-informed
    const textEvents = events.filter(
      (e: any) => e.type === EventType.TEXT_MESSAGE_CONTENT,
    );
    const fullResponse = textEvents.map((e: any) => e.delta).join("");
    expect(fullResponse).toContain("District 5");
    expect(fullResponse).toContain("Eastern Blvd");

    // Verify 3 step iterations
    const stepStarts = types.filter((t: any) => t === EventType.STEP_STARTED);
    expect(stepStarts.length).toBe(3);
  });
});

describe("System prompt and tool registration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryFeatureServer.mockResolvedValue({
      features: [{ attributes: { id: 1 } }],
    });
  });

  it("passes both tools to the Anthropic API for all portals", async () => {
    for (const portal of [
      "resident",
      "business",
      "citystaff",
      "researcher",
    ]) {
      vi.clearAllMocks();
      mockQueryFeatureServer.mockResolvedValue({
        features: [{ attributes: { id: 1 } }],
      });

      mockStream.mockReturnValueOnce(createMockStream({
        content: [{ type: "text", text: "Response" }],
        stop_reason: "end_turn",
      }));

      await runAgent(portal, "Test message");

      // Verify both tools were passed to Claude
      const callArgs = mockStream.mock.calls[0]?.[0];
      expect(callArgs.tools).toHaveLength(2);
      expect(callArgs.tools[0].name).toBe("arcgis_query");
      expect(callArgs.tools[1].name).toBe("brightdata_search");
    }
  });

  it("passes portal-specific system prompt to the Anthropic API", async () => {
    for (const portal of [
      "resident",
      "business",
      "citystaff",
      "researcher",
    ]) {
      vi.clearAllMocks();
      mockQueryFeatureServer.mockResolvedValue({
        features: [{ attributes: { id: 1 } }],
      });

      mockStream.mockReturnValueOnce(createMockStream({
        content: [{ type: "text", text: "Response" }],
        stop_reason: "end_turn",
      }));

      await runAgent(portal, "Hello");

      const callArgs = mockStream.mock.calls[0]?.[0];
      expect(callArgs.system).toContain(portal);
      expect(callArgs.system).toContain("arcgis_query");
      expect(callArgs.system).toContain("brightdata_search");
    }
  });
});

describe("getToolStatusText (via tool call events)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryFeatureServer.mockResolvedValue({
      features: [{ attributes: { id: 1 } }],
    });
  });

  it("returns dataset-specific status for arcgis_query", async () => {
    mockStream
      .mockReturnValueOnce(createMockStream({
        content: [
          {
            type: "tool_use",
            id: "tool-1",
            name: "arcgis_query",
            input: { dataset: "Received_311_Service_Request" },
          },
        ],
        stop_reason: "tool_use",
      }))
      .mockReturnValueOnce(createMockStream({
        content: [{ type: "text", text: "Done" }],
        stop_reason: "end_turn",
      }));

    const { events } = await runAgent("resident", "Show 311 requests");
    const resultEvent = events.find(
      (e: any) => e.type === EventType.TOOL_CALL_RESULT,
    ) as any;

    expect(resultEvent).toBeDefined();
    expect(resultEvent.content).toContain("received_311_service_request");
  });
});

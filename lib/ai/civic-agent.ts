import { Observable, Subscriber } from "rxjs";
import {
  AbstractAgent,
  type RunAgentInput,
  type BaseEvent,
  EventType,
} from "@ag-ui/client";
import Anthropic from "@anthropic-ai/sdk";
import type {
  MessageParam,
  ContentBlock,
  ToolUseBlock,
  ToolResultBlockParam,
} from "@anthropic-ai/sdk/resources/messages";
import { allTools } from "./tools";
import { getSystemPrompt } from "./prompts";
import { queryFeatureServer } from "@/lib/arcgis";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

// ── Constants ────────────────────────────────────────────────────────────────

const MODEL = "claude-sonnet-4-20250514";
const MAX_ITERATIONS = 5;
const MAX_TOOL_RESULT_CHARS = 50_000;

const MAX_TOKENS: Record<string, number> = {
  resident: 4096,
  business: 4096,
  citystaff: 8192,
  researcher: 8192,
};

// ── Helpers (reused from existing client.ts) ────────────────────────────────

function getMaxTokens(portal: string): number {
  return MAX_TOKENS[portal] ?? 4096;
}

function sanitizeToolResult(result: unknown): string {
  if (result == null) return JSON.stringify(null);

  const stripped = JSON.parse(
    JSON.stringify(result, (key, value) => {
      if (
        key === "geometry" ||
        key === "rings" ||
        key === "paths" ||
        key === "coordinates"
      ) {
        return undefined;
      }
      return value;
    }),
  );

  let serialized = JSON.stringify(stripped);
  if (serialized.length > MAX_TOOL_RESULT_CHARS) {
    serialized =
      serialized.slice(0, MAX_TOOL_RESULT_CHARS) +
      "... [truncated — result too large]";
  }
  return serialized;
}

function getToolStatusText(
  toolName: string,
  input: Record<string, unknown>,
): string {
  if (toolName === "arcgis_query") {
    const dataset = (input.dataset as string) || "city data";
    return `Searching ${dataset.toLowerCase()}...`;
  }
  if (toolName === "brightdata_search") {
    const tool = input.tool as string;
    if (tool === "search_engine") {
      const query = (input.query as string) || "";
      return query
        ? `Searching the web for "${query}"...`
        : "Searching the web...";
    }
    return "Reading webpage...";
  }
  return "Working...";
}

// ── Tool execution ──────────────────────────────────────────────────────────

async function executeArcgisQuery(
  input: { dataset: string; where?: string; limit?: number },
  portal: string,
  convex: ConvexHttpClient | null,
): Promise<unknown> {
  // Check Convex dataset_registry first
  if (convex) {
    try {
      const cached = await convex.query(api.datasetRegistry.getByName, {
        name: input.dataset,
      });
      if (cached?.featureServerUrl) {
        return queryFeatureServer(cached.featureServerUrl, {
          where: input.where,
          limit: input.limit,
        });
      }
    } catch {
      // Fall through
    }
  }

  // Fall back to ArcGIS Hub v3 API
  const datasetRes = await fetch(
    `https://opendata-citymgm.hub.arcgis.com/api/v3/datasets?filter[name]=${encodeURIComponent(input.dataset)}&page[size]=1`,
  );
  if (!datasetRes.ok) return { error: "Dataset not found" };
  const datasetData = await datasetRes.json();
  const featureUrl = datasetData.data?.[0]?.attributes?.url;
  if (!featureUrl) return { error: `Dataset "${input.dataset}" not found` };

  // Cache for future requests
  if (convex) {
    try {
      await convex.mutation(api.mutations.insertDatasetRegistry, {
        name: input.dataset,
        featureServerUrl: featureUrl,
        portals: [portal],
        fields: {},
      });
    } catch {
      // Non-critical
    }
  }

  return queryFeatureServer(featureUrl, {
    where: input.where,
    limit: input.limit,
  });
}

async function executeBrightdataSearch(input: {
  query?: string;
  url?: string;
  tool: string;
}): Promise<unknown> {
  const token = process.env.BRIGHTDATA_API_TOKEN;
  if (!token) return { error: "Bright Data not configured" };

  const res = await fetch(`https://mcp.brightdata.com/mcp?token=${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: input.tool,
        arguments:
          input.tool === "search_engine"
            ? { query: input.query }
            : { url: input.url },
      },
    }),
  });
  if (!res.ok) return { error: `Bright Data error: ${res.status}` };
  const data = await res.json();
  return data.result;
}

// ── CivicAgent ──────────────────────────────────────────────────────────────

export class CivicAgent extends AbstractAgent {
  private portal: string;
  private anthropic: Anthropic;
  private convex: ConvexHttpClient | null;

  constructor(portal: string) {
    super({
      agentId: portal,
      description: `Montgomery Civic Hub ${portal} agent`,
    });
    this.portal = portal;

    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.convex = process.env.NEXT_PUBLIC_CONVEX_URL
      ? new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL)
      : null;
  }

  /** Override clone() so CopilotKit runtime preserves our custom properties */
  clone(): CivicAgent {
    const cloned = super.clone() as CivicAgent;
    cloned.portal = this.portal;
    cloned.anthropic = this.anthropic;
    cloned.convex = this.convex;
    return cloned;
  }

  run(input: RunAgentInput): Observable<BaseEvent> {
    return new Observable((subscriber: Subscriber<BaseEvent>) => {
      this.executeRun(input, subscriber).catch((error) => {
        subscriber.next({
          type: EventType.RUN_ERROR,
          message: error instanceof Error ? error.message : "Unknown error",
        } as BaseEvent);
        subscriber.complete();
      });
    });
  }

  private async executeRun(
    input: RunAgentInput,
    subscriber: Subscriber<BaseEvent>,
  ): Promise<void> {
    const { threadId, runId } = input;
    const systemPrompt = getSystemPrompt(this.portal);

    // RUN_STARTED
    subscriber.next({
      type: EventType.RUN_STARTED,
      threadId,
      runId,
    } as BaseEvent);

    // Convert CopilotKit messages to Anthropic format
    const inputMessages = input.messages ?? [];
    const anthropicMessages: MessageParam[] = inputMessages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content:
          typeof m.content === "string" ? m.content : JSON.stringify(m.content),
      }));

    // Persist user message to Convex
    const lastUserMsg = anthropicMessages.findLast((m) => m.role === "user");
    if (this.convex && lastUserMsg) {
      try {
        await this.convex.mutation(api.mutations.insertMessage, {
          portalId: this.portal,
          sessionId: threadId,
          role: "user",
          content:
            typeof lastUserMsg.content === "string" ? lastUserMsg.content : "",
        });
      } catch {
        // Non-critical
      }
    }

    let currentMessages = [...anthropicMessages];
    let stepCount = 0;

    // ── Tool-use loop ──────────────────────────────────────────────────────
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      stepCount++;
      subscriber.next({
        type: EventType.STEP_STARTED,
        stepName: `iteration-${stepCount}`,
      } as BaseEvent);

      const response = await this.anthropic.messages.create({
        model: MODEL,
        max_tokens: getMaxTokens(this.portal),
        system: systemPrompt,
        tools: allTools,
        messages: currentMessages,
      });

      const toolUseBlocks = response.content.filter(
        (block): block is ToolUseBlock => block.type === "tool_use",
      );

      if (toolUseBlocks.length === 0 || response.stop_reason === "end_turn") {
        // No more tool calls — extract and stream final text
        const textContent = response.content
          .filter(
            (block): block is Extract<ContentBlock, { type: "text" }> =>
              block.type === "text",
          )
          .map((block) => block.text)
          .join("\n");

        subscriber.next({
          type: EventType.STEP_FINISHED,
          stepName: `iteration-${stepCount}`,
        } as BaseEvent);

        await this.streamTextMessage(subscriber, textContent, threadId);
        await this.persistAssistantMessage(threadId, textContent);

        subscriber.next({
          type: EventType.RUN_FINISHED,
          threadId,
          runId,
        } as BaseEvent);
        subscriber.complete();
        return;
      }

      // Handle tool calls
      const toolResults: ToolResultBlockParam[] = [];
      for (const toolUse of toolUseBlocks) {
        const toolCallId = toolUse.id;
        const statusText = getToolStatusText(
          toolUse.name,
          toolUse.input as Record<string, unknown>,
        );

        // TOOL_CALL_START
        subscriber.next({
          type: EventType.TOOL_CALL_START,
          toolCallId,
          toolCallName: toolUse.name,
        } as BaseEvent);

        // TOOL_CALL_ARGS
        subscriber.next({
          type: EventType.TOOL_CALL_ARGS,
          toolCallId,
          delta: JSON.stringify(toolUse.input),
        } as BaseEvent);

        // Execute tool
        let result: unknown;
        let isError = false;
        try {
          if (toolUse.name === "arcgis_query") {
            result = await executeArcgisQuery(
              toolUse.input as {
                dataset: string;
                where?: string;
                limit?: number;
              },
              this.portal,
              this.convex,
            );
          } else if (toolUse.name === "brightdata_search") {
            result = await executeBrightdataSearch(
              toolUse.input as { query?: string; url?: string; tool: string },
            );
          } else {
            result = { error: `Unknown tool: ${toolUse.name}` };
            isError = true;
          }

          if (result && typeof result === "object" && "error" in result) {
            isError = true;
          }
        } catch (error) {
          console.error(`Tool ${toolUse.name} failed:`, error);
          result = { error: "Failed to query dataset" };
          isError = true;
        }

        const sanitized = sanitizeToolResult(result);

        // TOOL_CALL_END
        subscriber.next({
          type: EventType.TOOL_CALL_END,
          toolCallId,
        } as BaseEvent);

        // TOOL_CALL_RESULT — use a unique messageId for the result
        subscriber.next({
          type: EventType.TOOL_CALL_RESULT,
          toolCallId,
          messageId: `tool-result-${toolCallId}`,
          content: statusText,
          role: "tool",
        } as BaseEvent);

        const toolResult: ToolResultBlockParam = {
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: sanitized,
        };
        if (isError) {
          toolResult.is_error = true;
        }
        toolResults.push(toolResult);
      }

      currentMessages = [
        ...currentMessages,
        { role: "assistant", content: response.content },
        { role: "user", content: toolResults },
      ];

      subscriber.next({
        type: EventType.STEP_FINISHED,
        stepName: `iteration-${stepCount}`,
      } as BaseEvent);
    }

    // ── Exhausted iterations — final streaming response ────────────────────
    stepCount++;
    subscriber.next({
      type: EventType.STEP_STARTED,
      stepName: `final-response`,
    } as BaseEvent);

    currentMessages.push({
      role: "user",
      content:
        "You have used all available tool calls. Please respond now with the information you have gathered so far. Do not request any more tool calls.",
    });

    let fullText = "";
    const messageId = `msg-${Date.now()}`;

    subscriber.next({
      type: EventType.TEXT_MESSAGE_START,
      messageId,
      role: "assistant",
    } as BaseEvent);

    const stream = this.anthropic.messages.stream({
      model: MODEL,
      max_tokens: getMaxTokens(this.portal),
      system: systemPrompt,
      messages: currentMessages,
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        fullText += event.delta.text;
        subscriber.next({
          type: EventType.TEXT_MESSAGE_CONTENT,
          messageId,
          delta: event.delta.text,
        } as BaseEvent);
      }
    }

    subscriber.next({
      type: EventType.TEXT_MESSAGE_END,
      messageId,
    } as BaseEvent);

    subscriber.next({
      type: EventType.STEP_FINISHED,
      stepName: `final-response`,
    } as BaseEvent);

    await this.persistAssistantMessage(threadId, fullText);

    subscriber.next({
      type: EventType.RUN_FINISHED,
      threadId,
      runId: input.runId,
    } as BaseEvent);
    subscriber.complete();
  }

  /** Stream a complete text as a TEXT_MESSAGE sequence with async delays */
  private async streamTextMessage(
    subscriber: Subscriber<BaseEvent>,
    text: string,
    _threadId: string,
  ): Promise<void> {
    const messageId = `msg-${Date.now()}`;

    subscriber.next({
      type: EventType.TEXT_MESSAGE_START,
      messageId,
      role: "assistant",
    } as BaseEvent);

    // Stream in small chunks with async delays for real streaming effect
    const chunkSize = 20;
    for (let i = 0; i < text.length; i += chunkSize) {
      subscriber.next({
        type: EventType.TEXT_MESSAGE_CONTENT,
        messageId,
        delta: text.slice(i, i + chunkSize),
      } as BaseEvent);
      // Yield to event loop so CopilotKit can flush each chunk to the client
      await new Promise((resolve) => setTimeout(resolve, 12));
    }

    subscriber.next({
      type: EventType.TEXT_MESSAGE_END,
      messageId,
    } as BaseEvent);
  }

  /** Persist the assistant response to Convex */
  private async persistAssistantMessage(
    sessionId: string,
    content: string,
  ): Promise<void> {
    if (!this.convex || !content.trim()) return;
    try {
      await this.convex.mutation(api.mutations.insertMessage, {
        portalId: this.portal,
        sessionId,
        role: "assistant",
        content,
      });
    } catch {
      // Non-critical
    }
  }
}

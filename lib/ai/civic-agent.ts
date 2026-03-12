import { AbstractAgent, type BaseEvent, EventType, type RunAgentInput } from "@ag-ui/client";
import type { Tool as AGUITool } from "@ag-ui/core";
import Anthropic from "@anthropic-ai/sdk";
import type {
  ContentBlock,
  MessageParam,
  Tool,
  ToolResultBlockParam,
  ToolUseBlock,
} from "@anthropic-ai/sdk/resources/messages";
import { ConvexHttpClient } from "convex/browser";
import { Observable, type Subscriber } from "rxjs";
import { api } from "@/convex/_generated/api";
import { queryFeatureServer } from "@/lib/arcgis";
import { getSystemPrompt } from "./prompts";
import { allTools } from "./tools";

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
      if (key === "geometry" || key === "rings" || key === "paths" || key === "coordinates") {
        return undefined;
      }
      return value;
    }),
  );

  let serialized = JSON.stringify(stripped);
  if (serialized.length > MAX_TOOL_RESULT_CHARS) {
    serialized = serialized.slice(0, MAX_TOOL_RESULT_CHARS) + "... [truncated — result too large]";
  }
  return serialized;
}

function getToolStatusText(toolName: string, input: Record<string, unknown>): string {
  if (toolName === "arcgis_query") {
    const dataset = (input.dataset as string) || "city data";
    return `Searching ${dataset.toLowerCase()}...`;
  }
  if (toolName === "brightdata_search") {
    const tool = input.tool as string;
    if (tool === "search_engine") {
      const query = (input.query as string) || "";
      return query ? `Searching the web for "${query}"...` : "Searching the web...";
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
        arguments: input.tool === "search_engine" ? { query: input.query } : { url: input.url },
      },
    }),
  });
  if (!res.ok) return { error: `Bright Data error: ${res.status}` };
  const data = await res.json();
  return data.result;
}

// ── Frontend tool/context helpers ─────────────────────────────────────────

/** Names of server-side tools the agent executes directly */
const SERVER_TOOL_NAMES = new Set(allTools.map((t) => t.name));

/** Convert AG-UI tool definitions (from useCopilotAction) to Anthropic format */
function convertFrontendTools(aguiTools: AGUITool[]): Tool[] {
  return aguiTools
    .filter((t) => !SERVER_TOOL_NAMES.has(t.name))
    .map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.parameters ?? {
        type: "object" as const,
        properties: {},
      },
    }));
}

/** Build context supplement from useCopilotReadable values */
function buildContextSupplement(context: Array<{ description: string; value: string }>): string {
  if (!context || context.length === 0) return "";

  const lines = context.map(
    (c) =>
      `- **${c.description}:** ${typeof c.value === "string" ? c.value : JSON.stringify(c.value)}`,
  );
  return `\n\n## Current Dashboard State (live from the UI)\n${lines.join("\n")}`;
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

  private async executeRun(input: RunAgentInput, subscriber: Subscriber<BaseEvent>): Promise<void> {
    const { threadId, runId } = input;

    // ── Merge frontend tools & context into the LLM call ────────────────
    const frontendTools = convertFrontendTools((input.tools as AGUITool[]) ?? []);
    const frontendToolNames = new Set(frontendTools.map((t) => t.name));
    const mergedTools: Tool[] = [...allTools, ...frontendTools];

    const contextSupplement = buildContextSupplement(
      (input.context as Array<{ description: string; value: string }>) ?? [],
    );
    const systemPrompt = getSystemPrompt(this.portal) + contextSupplement;

    // RUN_STARTED
    subscriber.next({
      type: EventType.RUN_STARTED,
      threadId,
      runId,
    } as BaseEvent);

    // Convert AG-UI / CopilotKit messages to Anthropic format.
    // On re-invocation after frontend tool execution, CopilotKit sends:
    //   1. Original user message (role: "user")
    //   2. Assistant message (role: "assistant", toolCalls: [...], content?: string)
    //   3. Tool result messages (role: "tool", toolCallId, content)
    // Anthropic expects tool results grouped as role:"user" content:[tool_result, ...]
    const inputMessages = input.messages ?? [];
    const anthropicMessages: MessageParam[] = [];

    // biome-ignore lint/suspicious/noExplicitAny: AG-UI message types vary
    let pendingToolResults: Array<any> = [];

    const flushToolResults = () => {
      if (pendingToolResults.length > 0) {
        anthropicMessages.push({ role: "user", content: pendingToolResults });
        pendingToolResults = [];
      }
    };

    for (const m of inputMessages) {
      if (m.role === "user") {
        flushToolResults();
        const content =
          typeof m.content === "string"
            ? m.content
            : m.content != null
              ? JSON.stringify(m.content)
              : "";
        if (content) {
          anthropicMessages.push({ role: "user", content });
        }
      } else if (m.role === "assistant") {
        flushToolResults();
        // biome-ignore lint/suspicious/noExplicitAny: AG-UI toolCalls shape
        const msg = m as any;
        const toolCalls: Array<{ id: string; function: { name: string; arguments: string } }> =
          msg.toolCalls ?? [];
        // Build Anthropic content blocks: text (if any) + tool_use blocks
        // biome-ignore lint/suspicious/noExplicitAny: Anthropic content block union
        const contentBlocks: any[] = [];
        const textContent = typeof msg.content === "string" ? msg.content : "";
        if (textContent) {
          contentBlocks.push({ type: "text", text: textContent });
        }
        for (const tc of toolCalls) {
          let parsedInput = {};
          try {
            parsedInput = JSON.parse(tc.function.arguments);
          } catch {
            // keep empty object
          }
          contentBlocks.push({
            type: "tool_use",
            id: tc.id,
            name: tc.function.name,
            input: parsedInput,
          });
        }
        if (contentBlocks.length > 0) {
          anthropicMessages.push({ role: "assistant", content: contentBlocks });
        } else if (textContent) {
          anthropicMessages.push({ role: "assistant", content: textContent });
        }
        // Skip assistant messages with no content and no tool calls (edge case)
      } else if (m.role === "tool") {
        // biome-ignore lint/suspicious/noExplicitAny: AG-UI ToolMessage shape
        const toolMsg = m as any;
        pendingToolResults.push({
          type: "tool_result",
          tool_use_id: toolMsg.toolCallId,
          content:
            typeof toolMsg.content === "string"
              ? toolMsg.content
              : JSON.stringify(toolMsg.content ?? ""),
        });
      }
      // Skip other roles (activity, reasoning, etc.)
    }
    flushToolResults();

    // Debug: log the converted messages to diagnose API errors
    console.log(
      "[CivicAgent] Anthropic messages:",
      JSON.stringify(
        anthropicMessages.map((m) => ({
          role: m.role,
          content:
            typeof m.content === "string"
              ? m.content.slice(0, 80)
              : Array.isArray(m.content)
                ? m.content.map((b) => ({
                    type: b.type,
                    ...("id" in b ? { id: b.id } : {}),
                    ...("name" in b ? { name: b.name } : {}),
                    ...("tool_use_id" in b ? { tool_use_id: b.tool_use_id } : {}),
                  }))
                : typeof m.content,
        })),
        null,
        2,
      ),
    );

    // Persist user message to Convex
    const lastUserMsg = anthropicMessages.findLast((m) => m.role === "user");
    if (this.convex && lastUserMsg) {
      try {
        await this.convex.mutation(api.mutations.insertMessage, {
          portalId: this.portal,
          sessionId: threadId,
          role: "user",
          content: typeof lastUserMsg.content === "string" ? lastUserMsg.content : "",
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

      let response: Anthropic.Messages.Message;
      try {
        response = await this.anthropic.messages.create({
          model: MODEL,
          max_tokens: getMaxTokens(this.portal),
          system: systemPrompt,
          tools: mergedTools,
          messages: currentMessages,
        });
      } catch (apiError) {
        console.error("[CivicAgent] Anthropic API error:", apiError);
        throw apiError;
      }

      const toolUseBlocks = response.content.filter(
        (block): block is ToolUseBlock => block.type === "tool_use",
      );

      if (toolUseBlocks.length === 0 || response.stop_reason === "end_turn") {
        // No more tool calls — extract and stream final text
        const textContent = response.content
          .filter(
            (block): block is Extract<ContentBlock, { type: "text" }> => block.type === "text",
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

      // ── Classify tool calls: server-side vs frontend ──────────────────
      const serverToolCalls = toolUseBlocks.filter((t) => !frontendToolNames.has(t.name));
      const frontendToolCalls = toolUseBlocks.filter((t) => frontendToolNames.has(t.name));

      // ── Handle frontend tool calls ────────────────────────────────────
      // Emit events for ALL tool calls (text + tool_use blocks), then
      // if any are frontend actions, stop the run so CopilotKit can
      // execute them on the client and re-invoke the agent with results.
      if (frontendToolCalls.length > 0) {
        // Stream any text the LLM produced alongside the tool calls
        const textContent = response.content
          .filter(
            (block): block is Extract<ContentBlock, { type: "text" }> => block.type === "text",
          )
          .map((block) => block.text)
          .join("\n");

        if (textContent.trim()) {
          await this.streamTextMessage(subscriber, textContent, threadId);
        }

        // Emit tool call events for frontend actions
        for (const toolUse of frontendToolCalls) {
          subscriber.next({
            type: EventType.TOOL_CALL_START,
            toolCallId: toolUse.id,
            toolCallName: toolUse.name,
          } as BaseEvent);

          subscriber.next({
            type: EventType.TOOL_CALL_ARGS,
            toolCallId: toolUse.id,
            delta: JSON.stringify(toolUse.input),
          } as BaseEvent);

          subscriber.next({
            type: EventType.TOOL_CALL_END,
            toolCallId: toolUse.id,
          } as BaseEvent);
        }

        // Finish step and run — CopilotKit will execute frontend actions
        // and re-invoke the agent with tool results in messages
        subscriber.next({
          type: EventType.STEP_FINISHED,
          stepName: `iteration-${stepCount}`,
        } as BaseEvent);

        subscriber.next({
          type: EventType.RUN_FINISHED,
          threadId,
          runId,
        } as BaseEvent);
        subscriber.complete();
        return;
      }

      // ── Handle server-side tool calls (existing behavior) ─────────────
      const toolResults: ToolResultBlockParam[] = [];
      for (const toolUse of serverToolCalls) {
        const toolCallId = toolUse.id;
        const statusText = getToolStatusText(
          toolUse.name,
          toolUse.input as Record<string, unknown>,
        );

        subscriber.next({
          type: EventType.TOOL_CALL_START,
          toolCallId,
          toolCallName: toolUse.name,
        } as BaseEvent);

        subscriber.next({
          type: EventType.TOOL_CALL_ARGS,
          toolCallId,
          delta: JSON.stringify(toolUse.input),
        } as BaseEvent);

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

        subscriber.next({
          type: EventType.TOOL_CALL_END,
          toolCallId,
        } as BaseEvent);

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
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
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
  private async persistAssistantMessage(sessionId: string, content: string): Promise<void> {
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

import Anthropic from "@anthropic-ai/sdk";
import type {
  MessageParam,
  ContentBlock,
  ToolUseBlock,
  ToolResultBlockParam,
} from "@anthropic-ai/sdk/resources/messages";
import { allTools } from "./tools";
import { getSystemPrompt } from "./prompts";

// Fix #4: Validate API key before constructing client
if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY is not set");
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Fix #2: Extract model string to a constant
const MODEL = "claude-sonnet-4-20250514";

// Fix #7: Max tokens per portal category
const MAX_TOKENS: Record<string, number> = {
  resident: 4096,
  business: 4096,
  citystaff: 8192,
  researcher: 8192,
};

function getMaxTokens(portal: string): number {
  return MAX_TOKENS[portal] ?? 4096;
}

// Fix #5: Strip geometry and truncate large tool results
const MAX_TOOL_RESULT_CHARS = 50_000;

function sanitizeToolResult(result: unknown): string {
  if (result == null) return JSON.stringify(null);

  // Strip geometry data from GeoJSON-like responses
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

  // Truncate if too large
  if (serialized.length > MAX_TOOL_RESULT_CHARS) {
    serialized =
      serialized.slice(0, MAX_TOOL_RESULT_CHARS) +
      "... [truncated — result too large]";
  }

  return serialized;
}

export interface ToolHandler {
  arcgis_query: (input: {
    dataset: string;
    where?: string;
    limit?: number;
  }) => Promise<unknown>;
  brightdata_search: (input: {
    query?: string;
    url?: string;
    tool: string;
  }) => Promise<unknown>;
}

/** Non-streaming chat — used internally for tool-call iterations */
async function chatNonStreaming(
  systemPrompt: string,
  messages: MessageParam[],
  portal: string,
) {
  return anthropic.messages.create({
    model: MODEL,
    max_tokens: getMaxTokens(portal),
    system: systemPrompt,
    tools: allTools,
    messages,
  });
}

/**
 * Run the tool-use loop (non-streaming), then stream the final text response.
 * Returns a ReadableStream of text chunks.
 */
export function chatStream(
  portal: string,
  messages: MessageParam[],
  toolHandler: ToolHandler,
): ReadableStream<string> {
  const systemPrompt = getSystemPrompt(portal);

  return new ReadableStream<string>({
    async start(controller) {
      try {
        let currentMessages = [...messages];
        const toolCalls: { name: string }[] = [];
        const maxIterations = 5;

        // Tool-use loop — non-streaming iterations (max 5)
        for (let i = 0; i < maxIterations; i++) {
          const response = await chatNonStreaming(
            systemPrompt,
            currentMessages,
            portal,
          );

          const toolUseBlocks = response.content.filter(
            (block): block is ToolUseBlock => block.type === "tool_use",
          );

          if (
            toolUseBlocks.length === 0 ||
            response.stop_reason === "end_turn"
          ) {
            // No more tool calls — emit this final response
            const textContent = response.content
              .filter(
                (block): block is Extract<ContentBlock, { type: "text" }> =>
                  block.type === "text",
              )
              .map((block) => block.text)
              .join("\n");

            controller.enqueue(textContent);
            controller.close();
            return;
          }

          // Handle tool calls
          const toolResults: ToolResultBlockParam[] = [];
          for (const toolUse of toolUseBlocks) {
            // Send friendly status to client
            const statusText = getToolStatusText(
              toolUse.name,
              toolUse.input as Record<string, unknown>,
            );
            controller.enqueue(`\x00status:${statusText}\x00`);

            let result: unknown;
            let isError = false;
            try {
              if (toolUse.name === "arcgis_query") {
                result = await toolHandler.arcgis_query(toolUse.input as any);
              } else if (toolUse.name === "brightdata_search") {
                result = await toolHandler.brightdata_search(
                  toolUse.input as any,
                );
              } else {
                result = { error: `Unknown tool: ${toolUse.name}` };
                isError = true;
              }

              // Fix #8: Check if result itself contains an error
              if (result && typeof result === "object" && "error" in result) {
                isError = true;
              }
            } catch (error) {
              // Fix #6: Return generic error message, log details server-side
              console.error(`Tool ${toolUse.name} failed:`, error);
              result = { error: "Failed to query dataset" };
              isError = true;
            }
            toolCalls.push({ name: toolUse.name });

            // Fix #5: Sanitize tool results before passing to Claude
            const toolResult: ToolResultBlockParam = {
              type: "tool_result",
              tool_use_id: toolUse.id,
              content: sanitizeToolResult(result),
            };

            // Fix #8: Set is_error flag on tool failures
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
        }

        // Fix #3: After exhausting tool iterations, tell Claude to respond
        // without tools so it doesn't try more tool calls
        currentMessages.push({
          role: "user",
          content:
            "You have used all available tool calls. Please respond now with the information you have gathered so far. Do not request any more tool calls.",
        });

        const stream = anthropic.messages.stream({
          model: MODEL,
          max_tokens: getMaxTokens(portal),
          system: systemPrompt,
          // Fix #3: Remove tools from final streaming call
          messages: currentMessages,
        });

        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(event.delta.text);
          }
        }

        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
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

import Anthropic from "@anthropic-ai/sdk";
import type {
  MessageParam,
  ContentBlock,
  ToolUseBlock,
  ToolResultBlockParam,
} from "@anthropic-ai/sdk/resources/messages";
import { allTools } from "./tools";
import { getSystemPrompt } from "./prompts";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

export async function chat(
  portal: string,
  messages: MessageParam[],
  toolHandler: ToolHandler,
): Promise<{
  content: string;
  toolCalls: { name: string; input: unknown; result: unknown }[];
}> {
  const systemPrompt = getSystemPrompt(portal);
  const toolCalls: { name: string; input: unknown; result: unknown }[] = [];
  let currentMessages = [...messages];

  // Tool use loop — max 5 iterations
  for (let i = 0; i < 5; i++) {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      tools: allTools,
      messages: currentMessages,
    });

    // Check if we need to handle tool use
    const toolUseBlocks = response.content.filter(
      (block): block is ToolUseBlock => block.type === "tool_use",
    );

    if (toolUseBlocks.length === 0 || response.stop_reason === "end_turn") {
      // Extract text content
      const textContent = response.content
        .filter(
          (block): block is Extract<ContentBlock, { type: "text" }> =>
            block.type === "text",
        )
        .map((block) => block.text)
        .join("\n");
      return { content: textContent, toolCalls };
    }

    // Handle tool calls
    const toolResults: ToolResultBlockParam[] = [];
    for (const toolUse of toolUseBlocks) {
      let result: unknown;
      try {
        if (toolUse.name === "arcgis_query") {
          result = await toolHandler.arcgis_query(toolUse.input as any);
        } else if (toolUse.name === "brightdata_search") {
          result = await toolHandler.brightdata_search(toolUse.input as any);
        } else {
          result = { error: `Unknown tool: ${toolUse.name}` };
        }
      } catch (error) {
        result = { error: String(error) };
      }
      toolCalls.push({ name: toolUse.name, input: toolUse.input, result });
      toolResults.push({
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: JSON.stringify(result),
      });
    }

    // Add assistant message and tool results
    currentMessages = [
      ...currentMessages,
      { role: "assistant", content: response.content },
      { role: "user", content: toolResults },
    ];
  }

  return {
    content:
      "I apologize, but I was unable to complete the request after multiple tool calls.",
    toolCalls,
  };
}

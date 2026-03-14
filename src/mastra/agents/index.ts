import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { arcgisQueryTool, brightdataSearchTool } from "../tools";
import { getSystemPrompt } from "./prompts";

const MODEL = "anthropic/claude-sonnet-4-20250514" as const;

const tools = {
  arcgis_query: arcgisQueryTool,
  brightdata_search: brightdataSearchTool,
};

// Memory configs per agent type
function basicMemory() {
  return new Memory({
    options: {
      lastMessages: 20,
      workingMemory: { enabled: true },
    },
  });
}

function advancedMemory() {
  return new Memory({
    options: {
      lastMessages: 20,
      workingMemory: { enabled: true },
      semanticRecall: true,
    },
  });
}

function fullMemory() {
  return new Memory({
    options: {
      lastMessages: 20,
      workingMemory: { enabled: true },
      semanticRecall: true,
      observationalMemory: true,
    },
  });
}

export const residentAgent = new Agent({
  id: "resident",
  name: "Resident Portal Agent",
  instructions: getSystemPrompt("resident"),
  model: MODEL,
  tools,
  memory: basicMemory(),
});

export const businessAgent = new Agent({
  id: "business",
  name: "Business Portal Agent",
  instructions: getSystemPrompt("business"),
  model: MODEL,
  tools,
  memory: basicMemory(),
});

export const citystaffAgent = new Agent({
  id: "citystaff",
  name: "City Staff Portal Agent",
  instructions: getSystemPrompt("citystaff"),
  model: MODEL,
  tools,
  memory: fullMemory(),
});

export const researcherAgent = new Agent({
  id: "researcher",
  name: "Researcher Portal Agent",
  instructions: getSystemPrompt("researcher"),
  model: MODEL,
  tools,
  memory: fullMemory(),
});

export const executiveAgent = new Agent({
  id: "executive",
  name: "Executive Portal Agent",
  instructions: getSystemPrompt("executive"),
  model: MODEL,
  tools,
  memory: advancedMemory(),
});

export const insightsAgent = new Agent({
  id: "insights",
  name: "Insights Portal Agent",
  instructions: getSystemPrompt("insights"),
  model: MODEL,
  tools,
  memory: advancedMemory(),
});

export const allAgents = {
  resident: residentAgent,
  business: businessAgent,
  citystaff: citystaffAgent,
  researcher: researcherAgent,
  executive: executiveAgent,
  insights: insightsAgent,
};

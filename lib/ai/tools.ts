import type { Tool } from "@anthropic-ai/sdk/resources/messages";

export const arcgisQueryTool: Tool = {
  name: "arcgis_query",
  description:
    "Query City of Montgomery ArcGIS FeatureServer datasets. Returns GIS feature data including geometry and attributes for crime data, permits, licenses, 911 calls, expenditures, and more.",
  input_schema: {
    type: "object" as const,
    properties: {
      dataset: {
        type: "string",
        description:
          "Name of the dataset to query (e.g., 'Crime Statistics', 'Building Permits', '911 Call Map')",
      },
      where: {
        type: "string",
        description:
          'SQL WHERE clause to filter results (e.g., "offense=\'THEFT\'" or "1=1" for all)',
      },
      limit: {
        type: "number",
        description: "Maximum number of records to return (default 100)",
      },
    },
    required: ["dataset"],
  },
};

export const brightdataSearchTool: Tool = {
  name: "brightdata_search",
  description:
    "Search the web or scrape specific URLs for Montgomery, AL civic information using Bright Data. Use for news, council agendas, emergency alerts, and other web content not in ArcGIS.",
  input_schema: {
    type: "object" as const,
    properties: {
      query: {
        type: "string",
        description: "Search query string (used with search_engine tool)",
      },
      url: {
        type: "string",
        description:
          "Specific URL to scrape as markdown (used with scrape_as_markdown tool)",
      },
      tool: {
        type: "string",
        enum: ["search_engine", "scrape_as_markdown"],
        description: "Which Bright Data tool to use",
      },
    },
    required: ["tool"],
  },
};

export const allTools: Tool[] = [arcgisQueryTool, brightdataSearchTool];

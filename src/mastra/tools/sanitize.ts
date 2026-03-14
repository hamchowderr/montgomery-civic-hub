const MAX_TOOL_RESULT_CHARS = 50_000;

/**
 * Strip geometry arrays from ArcGIS responses and truncate to prevent
 * blowing up the LLM context window.
 */
export function sanitizeToolResult(result: unknown): string {
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

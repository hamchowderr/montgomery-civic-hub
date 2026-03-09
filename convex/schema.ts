import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  chat_messages: defineTable({
    portalId: v.string(),
    sessionId: v.string(),
    role: v.union(
      v.literal("user"),
      v.literal("assistant"),
      v.literal("system"),
    ),
    content: v.string(),
    toolCalls: v.optional(v.any()),
    createdAt: v.number(),
  }).index("by_session", ["sessionId", "createdAt"]),

  scraped_cache: defineTable({
    url: v.string(),
    content: v.string(),
    fetchedAt: v.number(),
  }).index("by_url", ["url"]),

  arcgis_cache: defineTable({
    dataset: v.string(),
    where: v.string(),
    data: v.any(),
    fetchedAt: v.number(),
  }).index("by_dataset_where", ["dataset", "where"]),

  dataset_registry: defineTable({
    name: v.string(),
    featureServerUrl: v.string(),
    portals: v.array(v.string()),
    fields: v.any(),
  }).index("by_name", ["name"]),

  portal_stats_cache: defineTable({
    portal: v.string(),
    stats: v.array(
      v.object({
        title: v.string(),
        value: v.string(),
        delta: v.optional(v.string()),
      }),
    ),
    fetchedAt: v.number(),
  }).index("by_portal", ["portal"]),

  map_features_cache: defineTable({
    portal: v.string(),
    geojson: v.any(),
    layers: v.array(
      v.object({
        id: v.string(),
        label: v.string(),
        color: v.string(),
        type: v.string(),
      }),
    ),
    fetchedAt: v.number(),
  }).index("by_portal", ["portal"]),

  chart_data_cache: defineTable({
    chartId: v.string(),
    data: v.any(),
    fetchedAt: v.number(),
  }).index("by_chartId", ["chartId"]),
});

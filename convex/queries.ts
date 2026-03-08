import { query } from "./_generated/server";
import { v } from "convex/values";

export const getChatMessages = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chat_messages")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();
  },
});

export const getCachedScrape = query({
  args: { url: v.string() },
  handler: async (ctx, args) => {
    const cached = await ctx.db
      .query("scraped_cache")
      .withIndex("by_url", (q) => q.eq("url", args.url))
      .first();
    if (!cached) return null;
    const ONE_HOUR = 60 * 60 * 1000;
    if (Date.now() - cached.fetchedAt > ONE_HOUR) return null;
    return cached;
  },
});

export const getCachedArcGIS = query({
  args: { dataset: v.string(), where: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const whereClause = args.where ?? "1=1";
    const cached = await ctx.db
      .query("arcgis_cache")
      .withIndex("by_dataset_where", (q) =>
        q.eq("dataset", args.dataset).eq("where", whereClause),
      )
      .first();
    if (!cached) return null;
    const FIFTEEN_MIN = 15 * 60 * 1000;
    if (Date.now() - cached.fetchedAt > FIFTEEN_MIN) return null;
    return cached;
  },
});

export const getDatasetRegistry = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("dataset_registry").collect();
  },
});

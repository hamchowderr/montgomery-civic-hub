import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const insertMessage = mutation({
  args: {
    portalId: v.string(),
    sessionId: v.string(),
    role: v.union(
      v.literal("user"),
      v.literal("assistant"),
      v.literal("system"),
    ),
    content: v.string(),
    toolCalls: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("chat_messages", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const upsertScrapeCache = mutation({
  args: { url: v.string(), content: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("scraped_cache")
      .withIndex("by_url", (q) => q.eq("url", args.url))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        content: args.content,
        fetchedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("scraped_cache", { ...args, fetchedAt: Date.now() });
    }
  },
});

export const upsertArcGISCache = mutation({
  args: { dataset: v.string(), where: v.string(), data: v.any() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("arcgis_cache")
      .withIndex("by_dataset_where", (q) =>
        q.eq("dataset", args.dataset).eq("where", args.where),
      )
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        data: args.data,
        fetchedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("arcgis_cache", { ...args, fetchedAt: Date.now() });
    }
  },
});

export const insertDatasetRegistry = mutation({
  args: {
    name: v.string(),
    featureServerUrl: v.string(),
    portals: v.array(v.string()),
    fields: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("dataset_registry", args);
  },
});

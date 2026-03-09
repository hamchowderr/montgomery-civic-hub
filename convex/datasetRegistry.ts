import { query } from "./_generated/server";
import { v } from "convex/values";

export const getByName = query({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    return await ctx.db
      .query("dataset_registry")
      .withIndex("by_name", (q) => q.eq("name", name))
      .first();
  },
});

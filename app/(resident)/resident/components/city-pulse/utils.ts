import type { NewsResult } from "@/app/actions/resident-news";
import { CATEGORY_COLORS, CATEGORY_TEXT_COLORS } from "./types";

/**
 * Format a date relative to now (e.g. "2h ago", "3d ago").
 */
export function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}

/**
 * Get the chart fill color for a category id.
 */
export function getCategoryColor(id: string): string {
  return CATEGORY_COLORS[id] ?? "hsl(221 83% 53%)";
}

/**
 * Get the text color class for a category id.
 */
export function getCategoryTextColor(id: string): string {
  return CATEGORY_TEXT_COLORS[id] ?? "text-blue-600 dark:text-blue-400";
}

/**
 * Group news results by source domain and return sorted counts.
 */
export function groupBySource(
  results: Record<string, NewsResult[]>,
): { source: string; count: number }[] {
  const sourceMap = new Map<string, number>();

  for (const items of Object.values(results)) {
    for (const item of items) {
      const source = item.source.replace(/^www\./, "");
      sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
    }
  }

  return Array.from(sourceMap.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Group news results by category and return counts with colors.
 */
export function groupByCategory(
  results: Record<string, NewsResult[]>,
  categoryLabels: Record<string, string>,
): { category: string; id: string; count: number; color: string }[] {
  return Object.entries(results)
    .map(([id, items]) => ({
      category: categoryLabels[id] || id,
      id,
      count: items.length,
      color: getCategoryColor(id),
    }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);
}

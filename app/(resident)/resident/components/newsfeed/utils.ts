// ---------------------------------------------------------------------------
// Incident Newsfeed — pure utility functions
// ---------------------------------------------------------------------------

import type { FilterState, IncidentItem } from "./types";

export function relativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function statusColor(status: IncidentItem["status"]) {
  switch (status) {
    case "Open":
      return "bg-red-500/15 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700";
    case "In Progress":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700";
    case "Closed":
      return "bg-green-500/15 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700";
  }
}

export function statusBorderColor(status: IncidentItem["status"]) {
  switch (status) {
    case "Open":
      return "border-l-red-500";
    case "In Progress":
      return "border-l-amber-500";
    case "Closed":
      return "border-l-green-500";
  }
}

export function normalizeStatus(raw: string): IncidentItem["status"] {
  const lower = raw.toLowerCase();
  if (lower.includes("progress")) return "In Progress";
  if (lower.includes("closed") || lower.includes("resolved")) return "Closed";
  return "Open";
}

export function formatDuration(ms: number): string {
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}mo`;
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

/** Build a WHERE clause from the current filter state and year range */
export function buildIncidentWhereClause(
  filters: FilterState,
  yearRange: { from: number; to: number },
): string {
  const clauses: string[] = [];

  // Always apply year filter
  clauses.push(`Year >= ${yearRange.from} AND Year <= ${yearRange.to}`);

  if (filters.departments.length > 0) {
    const deptList = filters.departments.map((d) => `'${d.replace(/'/g, "''")}'`).join(",");
    clauses.push(`Department IN (${deptList})`);
  }

  if (filters.status !== "All") {
    clauses.push(`Status = '${filters.status}'`);
  }

  if (filters.district && filters.district !== "all") {
    clauses.push(`District = ${filters.district}`);
  }

  if (filters.origin && filters.origin !== "all") {
    clauses.push(`Origin = '${filters.origin.replace(/'/g, "''")}'`);
  }

  if (filters.requestType) {
    clauses.push(`Request_Type = '${filters.requestType.replace(/'/g, "''")}'`);
  }

  return clauses.join(" AND ");
}

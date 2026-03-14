"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { VacantProperty } from "./types";
import { formatCurrency } from "./utils";

type NhSortField = "name" | "count" | "acres" | "value" | "pctAvailable";
type NhSortDir = "asc" | "desc";

interface NeighborhoodRow {
  name: string;
  count: number;
  acres: number;
  value: number;
  pctAvailable: number;
}

export function NeighborhoodTable({ properties }: { properties: VacantProperty[] }) {
  const [sortBy, setSortBy] = useState<NhSortField>("count");
  const [sortDir, setSortDir] = useState<NhSortDir>("desc");

  const rows = useMemo(() => {
    const map = new Map<
      string,
      { count: number; acres: number; value: number; available: number }
    >();
    for (const p of properties) {
      const key = p.neighborhood;
      const row = map.get(key) ?? { count: 0, acres: 0, value: 0, available: 0 };
      row.count++;
      row.acres += p.acreage;
      row.value += p.appraised;
      if (p.use === "AVAILABLE") row.available++;
      map.set(key, row);
    }
    return [...map.entries()].map(([name, r]) => ({
      name,
      count: r.count,
      acres: r.acres,
      value: r.value,
      pctAvailable: r.count > 0 ? (r.available / r.count) * 100 : 0,
    }));
  }, [properties]);

  const sorted = useMemo(() => {
    const arr = [...rows];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      if (sortBy === "name") return dir * a.name.localeCompare(b.name);
      return dir * (a[sortBy] - b[sortBy]);
    });
    return arr;
  }, [rows, sortBy, sortDir]);

  const handleSort = useCallback(
    (field: NhSortField) => {
      if (sortBy === field) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(field);
        setSortDir(field === "name" ? "asc" : "desc");
      }
    },
    [sortBy],
  );

  const SortIcon = ({ field }: { field: NhSortField }) => {
    if (sortBy !== field) return <ArrowUpDown className="size-3 text-muted-foreground/40" />;
    return sortDir === "asc" ? (
      <ArrowUp className="size-3 text-foreground" />
    ) : (
      <ArrowDown className="size-3 text-foreground" />
    );
  };

  if (rows.length === 0) return null;

  const columns: { field: NhSortField; label: string; align?: string }[] = [
    { field: "name", label: "Neighborhood" },
    { field: "count", label: "Properties", align: "text-right" },
    { field: "acres", label: "Total Acres", align: "text-right" },
    { field: "value", label: "Appraised Value", align: "text-right" },
    { field: "pctAvailable", label: "% Available", align: "text-right" },
  ];

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold mb-3">Neighborhood Summary</h3>
        <ScrollArea className="max-h-[220px]">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-card z-10">
              <tr className="border-b">
                {columns.map((col) => (
                  <th
                    key={col.field}
                    className={`pb-2 pr-3 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors ${col.align ?? "text-left"}`}
                    onClick={() => handleSort(col.field)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      <SortIcon field={col.field} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => (
                <tr
                  key={row.name}
                  className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <td className="py-1.5 pr-3 font-medium truncate max-w-[140px]">{row.name}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">{row.count}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">{row.acres.toFixed(1)}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">
                    {formatCurrency(row.value)}
                  </td>
                  <td className="py-1.5 text-right tabular-nums">{row.pctAvailable.toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

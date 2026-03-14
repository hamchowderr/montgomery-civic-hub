"use client";

import { useCopilotReadable } from "@copilotkit/react-core";
import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ARCGIS_URLS, queryFeatureStats } from "@/lib/arcgis-client";

import { type DistrictRow, GOLD } from "./types";
import { ratioColor } from "./utils";

export function EquityIndicators() {
  const [rows, setRows] = useState<DistrictRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [stats311, statsViol] = await Promise.all([
          queryFeatureStats({
            url: ARCGIS_URLS.serviceRequests311,
            groupByField: "District",
            statisticField: "OBJECTID",
          }),
          queryFeatureStats({
            url: ARCGIS_URLS.codeViolations,
            groupByField: "CouncilDistrict",
            statisticField: "OffenceNum",
          }),
        ]);

        if (cancelled) return;

        // Normalize: extract numeric district from both datasets
        const extractNum = (s: string): number | null => {
          const m = s.match(/(\d+)/);
          return m ? parseInt(m[1], 10) : null;
        };

        const map311 = new Map<number, number>();
        for (const r of stats311) {
          const d = extractNum(r.group);
          if (d !== null) map311.set(d, (map311.get(d) ?? 0) + r.value);
        }

        const mapViol = new Map<number, number>();
        for (const r of statsViol) {
          const d = extractNum(r.group);
          if (d !== null) mapViol.set(d, (mapViol.get(d) ?? 0) + r.value);
        }

        // Merge all district numbers
        const allDistricts = new Set([...map311.keys(), ...mapViol.keys()]);
        const merged: DistrictRow[] = Array.from(allDistricts)
          .sort((a, b) => a - b)
          .map((district) => {
            const r = map311.get(district) ?? 0;
            const v = mapViol.get(district) ?? 0;
            return {
              district,
              requests311: r,
              violations: v,
              ratio: v > 0 ? parseFloat((r / v).toFixed(2)) : 0,
            };
          });

        setRows(merged);
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useCopilotReadable({
    description:
      "Equity indicators by council district: 311 requests, code violations, service ratio",
    value: rows.length > 0 ? rows : "Loading equity data...",
  });

  const allRatios = rows.map((r) => r.ratio);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold" style={{ color: GOLD }}>
          Equity Indicators by District
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No district data available.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">District</TableHead>
                  <TableHead className="text-right">311 Requests</TableHead>
                  <TableHead className="text-right">Code Violations</TableHead>
                  <TableHead className="text-right">Service Ratio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.district}>
                    <TableCell className="font-medium">District {row.district}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.requests311.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.violations.toLocaleString()}
                    </TableCell>
                    <TableCell
                      className={`text-right tabular-nums font-semibold ${ratioColor(row.ratio, allRatios)}`}
                    >
                      {row.ratio > 0 ? row.ratio.toFixed(2) : "\u2014"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="mt-2 text-[10px] text-muted-foreground">
              Service Ratio = 311 Requests / Code Violations. Higher ratio indicates more
              resident-initiated service activity relative to enforcement.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

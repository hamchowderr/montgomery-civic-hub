"use client";

import { AlertTriangle, HardHat, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ARCGIS_URLS, queryFeatureAttributes } from "@/lib/arcgis-client";
import type { NearbyItem, VacantProperty } from "./types";

interface NearbyActivityProps {
  property: VacantProperty;
}

export function NearbyActivity({ property }: NearbyActivityProps) {
  const [items, setItems] = useState<NearbyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const prevAddress = useRef<string | null>(null);

  useEffect(() => {
    if (property.address === prevAddress.current) return;
    prevAddress.current = property.address;

    let cancelled = false;
    async function fetchNearby() {
      setLoading(true);
      setItems([]);

      const parts = property.address.split(" ");
      const street = parts.length > 1 ? parts.slice(1).join(" ") : property.address;
      const escaped = street.replace(/'/g, "''");

      try {
        const [permits, violations] = await Promise.all([
          queryFeatureAttributes({
            url: ARCGIS_URLS.constructionPermits,
            where: `Address LIKE '%${escaped}%'`,
            outFields: "Address,PermitType,IssueDate,Status",
          }),
          queryFeatureAttributes({
            url: ARCGIS_URLS.codeViolations,
            where: `Address1 LIKE '%${escaped}%'`,
            outFields: "Address1,ViolationType,DateOpened,Status",
          }),
        ]);

        if (cancelled) return;

        const mapped: NearbyItem[] = [];

        for (const p of permits.slice(0, 10)) {
          const rawDate = p.IssueDate as number | null;
          mapped.push({
            type: "permit",
            description: `${String(p.PermitType ?? "Permit")} — ${String(p.Address ?? "")}`,
            date: rawDate ? new Date(rawDate).toLocaleDateString() : "N/A",
            status: String(p.Status ?? "Unknown"),
          });
        }

        for (const v of violations.slice(0, 10)) {
          const rawDate = v.DateOpened as number | null;
          mapped.push({
            type: "violation",
            description: `${String(v.ViolationType ?? "Violation")} — ${String(v.Address1 ?? "")}`,
            date: rawDate ? new Date(rawDate).toLocaleDateString() : "N/A",
            status: String(v.Status ?? "Unknown"),
          });
        }

        setItems(mapped);
      } catch (err) {
        console.error("[NearbyActivity] fetch failed:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchNearby();
    return () => {
      cancelled = true;
    };
  }, [property.address]);

  if (loading) {
    return (
      <div className="space-y-3 p-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <MapPin className="size-8 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">No permits or violations found nearby</p>
        <p className="text-xs text-muted-foreground/60">
          We searched for activity on this street but found no records.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-1">
      {items.map((item, i) => (
        <div key={`${item.type}-${i}`} className="rounded-lg border bg-card p-3 space-y-1.5">
          <div className="flex items-center gap-1.5">
            {item.type === "permit" ? (
              <HardHat className="size-3.5 text-blue-500" />
            ) : (
              <AlertTriangle className="size-3.5 text-amber-500" />
            )}
            <Badge
              variant="outline"
              className={`text-[10px] ${
                item.type === "permit"
                  ? "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400"
                  : "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400"
              }`}
            >
              {item.type === "permit" ? "Permit" : "Violation"}
            </Badge>
            <span className="ml-auto text-[10px] text-muted-foreground">{item.date}</span>
          </div>
          <p className="text-xs text-foreground">{item.description}</p>
          <p className="text-[10px] text-muted-foreground">Status: {item.status}</p>
        </div>
      ))}
    </div>
  );
}

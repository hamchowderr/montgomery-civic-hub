"use client";

import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  Filter,
  Hash,
  MapPin,
  Phone,
  Radio,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { IncidentItem } from "./types";
import { formatDuration, relativeTime, statusBorderColor, statusColor } from "./utils";

interface IncidentCardProps {
  item: IncidentItem;
  isExpanded: boolean;
  onToggleExpand: () => void;
  activeRequestType: string;
  onFilterByType: (type: string) => void;
}

export function IncidentCard({
  item,
  isExpanded,
  onToggleExpand,
  activeRequestType,
  onFilterByType,
}: IncidentCardProps) {
  const resolutionMs = item.closeDate ? item.closeDate.getTime() - item.date.getTime() : null;

  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${item.address}, Montgomery, AL`,
  )}`;

  return (
    <div
      className={`rounded-lg border border-l-4 ${statusBorderColor(item.status)} transition-colors hover:bg-muted/50 cursor-pointer`}
      onClick={onToggleExpand}
    >
      {/* Collapsed summary row */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <ChevronDown
              className={`mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-0" : "-rotate-90"}`}
            />
            <span className="text-sm font-semibold leading-tight line-clamp-2">{item.type}</span>
          </div>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {relativeTime(item.date)}
          </span>
        </div>
        <div className="mt-1 ml-6 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{item.address}</span>
        </div>
        <div className="mt-2 ml-6 flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className={`h-5 px-1.5 text-[10px] ${statusColor(item.status)}`}>
            {item.status}
          </Badge>
          <Badge
            variant="secondary"
            className="h-5 gap-1 px-1.5 text-[10px] bg-blue-500/10 text-blue-700 dark:text-blue-400"
          >
            <Radio className="h-2.5 w-2.5" />
            311
          </Badge>
          {item.department && (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
              {item.department}
            </Badge>
          )}
          {resolutionMs !== null && resolutionMs > 0 && (
            <Badge
              variant="outline"
              className="h-5 gap-1 px-1.5 text-[10px] bg-green-500/10 text-green-700 dark:text-green-400"
            >
              <CheckCircle2 className="h-2.5 w-2.5" />
              {formatDuration(resolutionMs)}
            </Badge>
          )}
        </div>
      </div>

      {/* Expanded detail panel — smooth transition via grid trick */}
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${
          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t bg-muted/30 px-4 py-3 space-y-3">
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Request ID</span>
                <span className="ml-auto font-mono text-xs">{item.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Created</span>
                <span className="ml-auto text-xs">
                  {item.date.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  {item.date.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Address</span>
                <span className="ml-auto text-xs text-right max-w-[200px] truncate">
                  {item.address}
                </span>
              </div>
              {item.district && item.district !== "0" && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">District</span>
                  <span className="ml-auto text-xs">District {item.district}</span>
                </div>
              )}
              {item.department && (
                <div className="flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Department</span>
                  <span className="ml-auto text-xs">{item.department}</span>
                </div>
              )}
              {item.origin && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Origin</span>
                  <span className="ml-auto text-xs">{item.origin}</span>
                </div>
              )}
              {item.closeDate && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  <span className="text-muted-foreground">Closed</span>
                  <span className="ml-auto text-xs">
                    {item.closeDate.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
              {resolutionMs !== null && resolutionMs > 0 && (
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Resolution Time</span>
                  <span className="ml-auto text-xs font-semibold">
                    {formatDuration(resolutionMs)}
                  </span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {item.type && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFilterByType(item.type);
                  }}
                >
                  <Filter className="mr-1.5 h-3 w-3" />
                  {activeRequestType === item.type
                    ? "Clear filter"
                    : `Show all "${item.type}" requests`}
                </Button>
              )}
              {item.address && (
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted"
                >
                  <MapPin className="h-3 w-3" />
                  View on Map
                  <ExternalLink className="h-2.5 w-2.5 text-muted-foreground" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

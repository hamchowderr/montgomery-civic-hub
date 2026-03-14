"use client";

import { CalendarDays, ClipboardList, Newspaper, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { PulseStats } from "./types";

interface PulseOverviewProps {
  stats: PulseStats;
  isLoading: boolean;
  lastUpdated?: Date;
}

const STAT_CARDS = [
  {
    key: "totalArticles" as const,
    label: "Total Articles",
    icon: Newspaper,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-l-blue-500",
    pulse: true,
  },
  {
    key: "totalServiceRequests" as const,
    label: "311 Requests",
    icon: ClipboardList,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-l-orange-500",
    pulse: false,
  },
  {
    key: "safetyAlerts" as const,
    label: "Safety Alerts",
    icon: ShieldAlert,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-l-red-500",
    pulse: false,
  },
  {
    key: "communityEvents" as const,
    label: "Community Events",
    icon: CalendarDays,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-l-emerald-500",
    pulse: false,
  },
];

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function PulseOverview({ stats, isLoading, lastUpdated }: PulseOverviewProps) {
  const [, setTick] = useState(0);

  // Re-render every 30s to update "last updated" text
  useEffect(() => {
    if (!lastUpdated) return;
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon;
          const value = stats[card.key];
          return (
            <Card
              key={card.key}
              className={`border-l-4 ${card.borderColor} transition-shadow hover:shadow-md`}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <div
                  className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${card.bgColor}`}
                >
                  <Icon className={`size-6 ${card.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  {isLoading ? (
                    <>
                      <Skeleton className="mb-1 h-7 w-14" />
                      <Skeleton className="h-3 w-20" />
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold tabular-nums">{value.toLocaleString()}</p>
                        {card.pulse && value > 0 && (
                          <span className="relative flex size-2.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                            <span className="relative inline-flex size-2.5 rounded-full bg-blue-500" />
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{card.label}</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {lastUpdated && !isLoading && (
        <p className="text-right text-[11px] text-muted-foreground/70">
          Last updated {timeAgo(lastUpdated)}
        </p>
      )}
    </div>
  );
}

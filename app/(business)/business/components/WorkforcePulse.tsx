"use client";

import {
  Briefcase,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Factory,
  Loader2,
  Search,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useChartData } from "@/lib/hooks/use-chart-data";
import { searchWorkforceData } from "../actions";

interface SearchResult {
  title: string;
  snippet: string;
  url: string;
  source: string;
}

const INITIAL_COUNT = 5;

function SearchResultList({ results, label }: { results: SearchResult[]; label: string }) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = results.length > INITIAL_COUNT;
  const visible = expanded ? results : results.slice(0, INITIAL_COUNT);

  if (results.length === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">No {label} available</p>;
  }

  return (
    <>
      <div className="space-y-3">
        {visible.map((r, i) => (
          <SearchResultCard key={i} result={r} />
        ))}
      </div>
      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 w-full text-xs text-muted-foreground"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              Show less <ChevronUp className="ml-1 size-3" />
            </>
          ) : (
            <>
              Show {results.length - INITIAL_COUNT} more <ChevronDown className="ml-1 size-3" />
            </>
          )}
        </Button>
      )}
    </>
  );
}

export function WorkforcePulse() {
  const [workforceResults, setWorkforceResults] = useState<SearchResult[]>([]);
  const [jobResults, setJobResults] = useState<SearchResult[]>([]);
  const [dataCenterResults, setDataCenterResults] = useState<SearchResult[]>([]);
  const [isPending, startTransition] = useTransition();

  const { data: licenseData, isLoading: licensesLoading } = useChartData("licensesByYear");
  const { data: permitData, isLoading: permitsLoading } = useChartData("permitsByYear");

  // Merge licenses + permits into a combined trend
  const economicTrend = (() => {
    if (!licenseData || !permitData) return [];
    const yearMap = new Map<string, { year: string; licenses: number; permits: number }>();
    for (const l of licenseData) {
      yearMap.set(l.year, { year: l.year, licenses: l.count, permits: 0 });
    }
    for (const p of permitData) {
      const entry = yearMap.get(p.year) ?? { year: p.year, licenses: 0, permits: 0 };
      entry.permits = p.count;
      yearMap.set(p.year, entry);
    }
    return Array.from(yearMap.values()).sort((a, b) => a.year.localeCompare(b.year));
  })();

  // Fetch Bright Data results
  useEffect(() => {
    startTransition(async () => {
      const [workforce, jobs, dataCenter] = await Promise.all([
        searchWorkforceData("Montgomery AL unemployment rate employment statistics 2024"),
        searchWorkforceData("Montgomery Alabama job postings hiring 2024"),
        searchWorkforceData("Montgomery Meta data center DC BLOX economic impact jobs"),
      ]);
      setWorkforceResults(workforce);
      setJobResults(jobs);
      setDataCenterResults(dataCenter);
    });
  }, []);

  const loadingSpinner = (text: string) => (
    <div className="flex items-center gap-2 py-6 justify-center text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      {text}
    </div>
  );

  return (
    <div className="flex flex-col gap-4 overflow-auto p-4">
      {/* Workforce Snapshot */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Briefcase className="size-4" />
            Workforce Snapshot
          </CardTitle>
          <p className="text-xs text-muted-foreground">Key employment stats from web search</p>
        </CardHeader>
        <CardContent>
          {isPending ? (
            loadingSpinner("Searching workforce data...")
          ) : (
            <SearchResultList results={workforceResults} label="workforce data" />
          )}
          <p className="mt-3 text-[10px] text-muted-foreground">
            Source: Bright Data web search · refreshed every 15 min
          </p>
        </CardContent>
      </Card>

      {/* Recent Job Postings */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Search className="size-4" />
            Recent Job Postings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isPending ? (
            loadingSpinner("Searching job postings...")
          ) : (
            <SearchResultList results={jobResults} label="job postings" />
          )}
          <p className="mt-3 text-[10px] text-muted-foreground">
            Source: Bright Data web search · refreshed every 15 min
          </p>
        </CardContent>
      </Card>

      {/* Economic Growth Signals — ArcGIS */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <TrendingUp className="size-4" />
            Economic Growth Signals
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Business licenses and construction permits by year
          </p>
        </CardHeader>
        <CardContent>
          {licensesLoading || permitsLoading ? (
            <div className="h-[200px] animate-pulse rounded bg-muted" />
          ) : economicTrend.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={economicTrend}>
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="licenses"
                    stroke="#3b82f6"
                    name="Licenses"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="permits"
                    stroke="#10b981"
                    name="Permits"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-2 flex justify-center gap-4">
                <div className="flex items-center gap-1.5 text-xs">
                  <div className="size-2.5 rounded-full bg-blue-500" />
                  Business Licenses
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <div className="size-2.5 rounded-full bg-green-500" />
                  Construction Permits
                </div>
              </div>
            </>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">No trend data</p>
          )}
          <p className="mt-3 text-[10px] text-muted-foreground">Source: Montgomery ArcGIS</p>
        </CardContent>
      </Card>

      {/* Data Center Economy */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Factory className="size-4" />
            Data Center Economy
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Meta, DC BLOX, and data center employment impact
          </p>
        </CardHeader>
        <CardContent>
          {isPending ? (
            loadingSpinner("Searching data center impact...")
          ) : (
            <SearchResultList results={dataCenterResults} label="data center results" />
          )}
          <p className="mt-3 text-[10px] text-muted-foreground">
            Source: Bright Data web search · refreshed every 15 min
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function SearchResultCard({ result }: { result: SearchResult }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          {result.url ? (
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium hover:underline inline-flex items-center gap-1"
            >
              {result.title}
              <ExternalLink className="size-3 shrink-0" />
            </a>
          ) : (
            <p className="text-sm font-medium">{result.title}</p>
          )}
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{result.snippet}</p>
          {result.source && result.source !== "System" && (
            <p className="mt-1 text-[10px] text-muted-foreground">{result.source}</p>
          )}
        </div>
      </div>
    </div>
  );
}

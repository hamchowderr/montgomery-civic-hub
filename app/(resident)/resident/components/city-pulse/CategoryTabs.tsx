"use client";

import { RefreshCw } from "lucide-react";
import { useState } from "react";
import type { NewsResult } from "@/app/actions/resident-news";
import { SearchResultCard } from "@/components/SearchResultCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CATEGORY_TEXT_COLORS } from "./types";
import { CATEGORIES } from "./useCityPulseData";

interface CategoryTabsProps {
  news: Record<string, NewsResult[]>;
  loading: Record<string, boolean>;
  refreshCategory: (id: string) => void;
  refreshAll: () => void;
}

/** Bottom border color classes keyed by category id */
const UNDERLINE_COLORS: Record<string, string> = {
  news: "data-[state=active]:border-b-blue-500",
  government: "data-[state=active]:border-b-purple-500",
  safety: "data-[state=active]:border-b-red-500",
  events: "data-[state=active]:border-b-emerald-500",
  infrastructure: "data-[state=active]:border-b-amber-500",
};

export function CategoryTabs({ news, loading, refreshCategory, refreshAll }: CategoryTabsProps) {
  const [activeTab, setActiveTab] = useState("news");

  const anyLoading = Object.values(loading).some(Boolean);

  return (
    <Card>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Montgomery City Pulse</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 text-xs"
                disabled={anyLoading}
                onClick={refreshAll}
              >
                <RefreshCw className={`h-3 w-3 ${anyLoading ? "animate-spin" : ""}`} />
                Refresh All
              </Button>
            </div>
          </div>
          <TabsList className="mt-3 h-auto w-full justify-start gap-0 rounded-none border-b bg-transparent p-0">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const count = news[cat.id]?.length;
              const isActive = activeTab === cat.id;
              return (
                <TabsTrigger
                  key={cat.id}
                  value={cat.id}
                  className={`relative gap-1.5 rounded-none border-b-2 border-b-transparent px-4 py-2.5 text-xs font-medium transition-colors data-[state=active]:bg-transparent data-[state=active]:shadow-none ${UNDERLINE_COLORS[cat.id] ?? ""}`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 ${isActive ? (CATEGORY_TEXT_COLORS[cat.id] ?? "") : "text-muted-foreground"}`}
                  />
                  <span className={isActive ? "" : "text-muted-foreground"}>{cat.label}</span>
                  {count != null && (
                    <Badge
                      variant={isActive ? "default" : "secondary"}
                      className="ml-1 h-5 min-w-[20px] justify-center px-1.5 text-[10px]"
                    >
                      {count}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </CardHeader>

        {CATEGORIES.map((cat) => (
          <TabsContent key={cat.id} value={cat.id} className="mt-0">
            <CardContent className="p-4 pt-2">
              {(loading[cat.id] ?? false) ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="space-y-2 rounded-lg border p-4">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : (news[cat.id] ?? []).length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <cat.icon className={`h-8 w-8 ${cat.color} opacity-40`} />
                  <p className="text-sm text-muted-foreground">
                    No {cat.label.toLowerCase()} results found. Try refreshing.
                  </p>
                  <Button variant="outline" size="sm" onClick={() => refreshCategory(cat.id)}>
                    <RefreshCw className="mr-1.5 h-3 w-3" />
                    Retry
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {(news[cat.id] ?? []).map((item) => (
                    <SearchResultCard
                      key={item.url}
                      result={item}
                      icon={<cat.icon className={`h-4 w-4 ${cat.color}`} />}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  );
}

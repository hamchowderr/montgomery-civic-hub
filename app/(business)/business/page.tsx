"use client";

import { PortalNav } from "@/components/PortalNav";
import { BusinessMap } from "./components/BusinessMap";
import { BusinessChat } from "./components/BusinessChat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePortalData } from "@/lib/hooks/use-portal-data";
import { RefreshCw, HelpCircle } from "lucide-react";
import { useTour } from "@/components/ui/tour";

export default function BusinessPage() {
  const { stats, isLoading, refresh } = usePortalData("business");
  const { start } = useTour();

  return (
    <div className="flex min-h-screen flex-col">
      <PortalNav />

      <main className="flex-1 p-4 space-y-4">
        <div
          className="flex items-center justify-between"
          data-tour-step-id="business-welcome"
        >
          <div>
            <h1 className="text-2xl font-bold">Business Portal</h1>
            <p className="text-muted-foreground">
              Permits, Licenses &amp; Economic Intelligence
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => start("business-tour")}
              className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-muted transition-colors"
            >
              <HelpCircle className="h-4 w-4" />
              Take a Tour
            </button>
            {!isLoading && stats && (
              <button
                onClick={refresh}
                className="p-1.5 rounded-md hover:bg-muted transition-colors"
                aria-label="Refresh stats"
              >
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          data-tour-step-id="business-stats"
        >
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 w-16 animate-pulse rounded bg-muted" />
                  </CardContent>
                </Card>
              ))
            : stats?.map((stat) => (
                <Card key={stat.title}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    {stat.delta && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {stat.delta}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <BusinessMap />
          </div>
          <div className="lg:col-span-1">
            <BusinessChat />
          </div>
        </div>
      </main>
    </div>
  );
}

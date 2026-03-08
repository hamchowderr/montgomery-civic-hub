"use client";

import { PortalNav } from "@/components/PortalNav";
import { ResearcherMap } from "./components/ResearcherMap";
import { ResearcherChart } from "./components/ResearcherChart";
import { ResearcherChat } from "./components/ResearcherChat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  { title: "Total Crime Records", value: "23,847" },
  { title: "911 Calls (2024)", value: "156,302" },
  { title: "Datasets Available", value: "14" },
];

export default function ResearcherPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PortalNav />

      <main className="flex-1 p-4 space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Researcher Portal</h1>
          <p className="text-muted-foreground">
            Crime Trends, Demographics &amp; Public Safety Analysis
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div>
            <ResearcherMap />
          </div>
          <div>
            <ResearcherChart />
          </div>
          <div>
            <ResearcherChat />
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";

import { PortalNav } from "@/components/PortalNav";
import { ResidentMap } from "./components/ResidentMap";
import { ResidentChat } from "./components/ResidentChat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  { title: "Recent Crime Reports", value: "47" },
  { title: "Service Requests", value: "124" },
  { title: "Sanitation Schedule", value: "Next: Mon 3/10" },
];

export default function ResidentPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PortalNav />

      <main className="flex-1 p-4 space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Resident Dashboard</h1>
          <p className="text-muted-foreground">
            Neighborhood Safety &amp; City Services
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
          <div className="lg:col-span-2">
            <ResidentMap />
          </div>
          <div className="lg:col-span-1">
            <ResidentChat />
          </div>
        </div>
      </main>
    </div>
  );
}

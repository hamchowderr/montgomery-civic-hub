"use client";

import { PortalNav } from "@/components/PortalNav";
import { BusinessMap } from "./components/BusinessMap";
import { BusinessChat } from "./components/BusinessChat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  { title: "Active Permits", value: "218" },
  { title: "Business Licenses", value: "1,342" },
  { title: "New Applications", value: "36" },
];

export default function BusinessPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PortalNav />

      <main className="flex-1 p-4 space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Business Portal</h1>
          <p className="text-muted-foreground">
            Permits, Licenses &amp; Economic Intelligence
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

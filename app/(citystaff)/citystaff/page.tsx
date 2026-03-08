"use client";

import { PortalNav } from "@/components/PortalNav";
import { CityStaffMap } from "./components/CityStaffMap";
import { CityStaffChart } from "./components/CityStaffChart";
import { CityStaffChat } from "./components/CityStaffChat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  { title: "Active Projects", value: "17" },
  { title: "Budget Utilization", value: "68%" },
  { title: "911 Calls Today", value: "142" },
];

export default function CityStaffPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PortalNav />

      <main className="flex-1 p-4 space-y-4">
        <div>
          <h1 className="text-2xl font-bold">City Staff Dashboard</h1>
          <p className="text-muted-foreground">
            Infrastructure, Budgets &amp; Operations
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
            <CityStaffMap />
          </div>
          <div>
            <CityStaffChart />
          </div>
          <div>
            <CityStaffChat />
          </div>
        </div>
      </main>
    </div>
  );
}

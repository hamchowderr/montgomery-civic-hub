"use client";

import { PortalNav } from "@/components/PortalNav";
import { CityStaffMap } from "./components/CityStaffMap";
import { CityStaffChart } from "./components/CityStaffChart";
import { DataPanel } from "@/components/DataPanel";
import { PortalLayout } from "@/components/PortalLayout";
import { CityStaffTable } from "./components/CityStaffTable";
import { YearFilterProvider } from "@/lib/contexts/year-filter";

import { CopilotProvider } from "@/components/CopilotProvider";
import { useCopilotReadable } from "@copilotkit/react-core";
import { Button } from "@/components/ui/button";
import { HelpCircle, Building2 } from "lucide-react";
import { useTour } from "@/components/ui/tour";

function CityStaffContent() {
  const { start } = useTour();

  useCopilotReadable({
    description: "Current portal context",
    value: { portal: "citystaff", availableViews: ["map", "table", "chart"] },
  });

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 sm:p-6">
      <div
        className="flex items-center justify-between"
        data-tour-step-id="citystaff-welcome"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-portal-citystaff/10">
            <Building2 className="h-4.5 w-4.5 text-portal-citystaff" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              City Staff Dashboard
            </h1>
            <p className="hidden text-sm text-muted-foreground sm:block">
              Infrastructure, Budgets &amp; Operations
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => start("citystaff-tour")}
          >
            <HelpCircle className="size-3.5" />
            <span className="hidden sm:inline">Take a Tour</span>
          </Button>
        </div>
      </div>

      <PortalLayout
        portal="citystaff"
        chatTitle="City Staff Assistant"
        welcomeMessage="Hello! I can help you access infrastructure data, budget information, paving projects, and operational metrics. What are you looking for?"
        chatPlaceholder="Ask about infrastructure, budgets, operations..."
      >
        <DataPanel
          portalId="citystaff"
          mapContent={<CityStaffMap />}
          tableContent={<CityStaffTable />}
          chartContent={<CityStaffChart />}
        />
      </PortalLayout>
    </main>
  );
}

export default function CityStaffPage() {
  return (
    <CopilotProvider agent="citystaff">
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        <PortalNav />
        <YearFilterProvider>
          <CityStaffContent />
        </YearFilterProvider>
      </div>
    </CopilotProvider>
  );
}

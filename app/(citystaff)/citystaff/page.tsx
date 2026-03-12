"use client";

import { useCopilotReadable } from "@copilotkit/react-core";
import { Building2, HelpCircle } from "lucide-react";
import { CopilotProvider } from "@/components/CopilotProvider";
import { DataPanel } from "@/components/DataPanel";
import { PortalLayout } from "@/components/PortalLayout";
import { PortalNav } from "@/components/PortalNav";
import { Button } from "@/components/ui/button";
import { useTour } from "@/components/ui/tour";
import { YearFilterProvider } from "@/lib/contexts/year-filter";
import { CityStaffChart } from "./components/CityStaffChart";
import { CityStaffMap } from "./components/CityStaffMap";
import { CityStaffTable } from "./components/CityStaffTable";

function CityStaffContent() {
  const { start } = useTour();

  useCopilotReadable({
    description: "Current portal context",
    value: { portal: "citystaff", availableViews: ["map", "table", "chart"] },
  });

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3 sm:gap-4 sm:p-4 md:p-6">
      <div
        className="flex items-center justify-between gap-2"
        data-tour-step-id="citystaff-welcome"
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex size-8 sm:size-9 items-center justify-center rounded-lg bg-portal-citystaff/10 shrink-0">
            <Building2 className="size-4 text-portal-citystaff" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight sm:text-xl md:text-2xl truncate">
              City Staff Dashboard
            </h1>
            <p className="hidden text-sm text-muted-foreground sm:block">
              Infrastructure, Budgets &amp; Operations
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => start("citystaff-tour")}>
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

"use client";

import { useCopilotReadable } from "@copilotkit/react-core";
import { HelpCircle, Home } from "lucide-react";
import { CopilotProvider } from "@/components/CopilotProvider";
import { DataPanel } from "@/components/DataPanel";
import { PortalLayout } from "@/components/PortalLayout";
import { PortalNav } from "@/components/PortalNav";
import { Button } from "@/components/ui/button";
import { useTour } from "@/components/ui/tour";
import { YearFilterProvider } from "@/lib/contexts/year-filter";
import { ResidentChart } from "./components/ResidentChart";
import { ResidentMap } from "./components/ResidentMap";
import { ResidentTable } from "./components/ResidentTable";

function ResidentContent() {
  const { start } = useTour();

  useCopilotReadable({
    description: "Current portal context",
    value: { portal: "resident", availableViews: ["map", "table", "chart"] },
  });

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3 sm:gap-4 sm:p-4 md:p-6">
      {/* Portal header */}
      <div className="flex items-center justify-between gap-2" data-tour-step-id="resident-welcome">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex size-8 sm:size-9 items-center justify-center rounded-lg bg-portal-resident/10 shrink-0">
            <Home className="size-4 text-portal-resident" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight sm:text-xl md:text-2xl truncate">
              Resident Dashboard
            </h1>
            <p className="hidden text-sm text-muted-foreground sm:block">
              Neighborhood Safety &amp; City Services
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => start("resident-tour")}>
            <HelpCircle className="size-3.5" />
            <span className="hidden sm:inline">Take a Tour</span>
          </Button>
        </div>
      </div>

      <PortalLayout
        portal="resident"
        chatTitle="Resident Assistant"
        welcomeMessage="Welcome! I can help you with neighborhood safety information, city services, sanitation schedules, road and transportation service requests, and more. How can I assist you today?"
        chatPlaceholder="Ask about neighborhood safety, services..."
      >
        <DataPanel
          portalId="resident"
          mapContent={<ResidentMap />}
          tableContent={<ResidentTable />}
          chartContent={<ResidentChart />}
        />
      </PortalLayout>
    </main>
  );
}

export default function ResidentPage() {
  return (
    <CopilotProvider agent="resident">
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        <PortalNav />
        <YearFilterProvider>
          <ResidentContent />
        </YearFilterProvider>
      </div>
    </CopilotProvider>
  );
}

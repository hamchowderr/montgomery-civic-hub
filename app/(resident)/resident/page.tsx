"use client";

import { PortalNav } from "@/components/PortalNav";
import { ResidentMap } from "./components/ResidentMap";
import { DataPanel } from "@/components/DataPanel";
import { PortalLayout } from "@/components/PortalLayout";
import { ResidentTable } from "./components/ResidentTable";
import { ResidentChart } from "./components/ResidentChart";
import { YearFilterProvider } from "@/lib/contexts/year-filter";

import { CopilotProvider } from "@/components/CopilotProvider";
import { useCopilotReadable } from "@copilotkit/react-core";
import { Button } from "@/components/ui/button";
import { HelpCircle, Home } from "lucide-react";
import { useTour } from "@/components/ui/tour";

function ResidentContent() {
  const { start } = useTour();

  useCopilotReadable({
    description: "Current portal context",
    value: { portal: "resident", availableViews: ["map", "table", "chart"] },
  });

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 sm:p-6">
      {/* Portal header */}
      <div
        className="flex items-center justify-between"
        data-tour-step-id="resident-welcome"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-portal-resident/10">
            <Home className="h-4.5 w-4.5 text-portal-resident" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              Resident Dashboard
            </h1>
            <p className="hidden text-sm text-muted-foreground sm:block">
              Neighborhood Safety &amp; City Services
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => start("resident-tour")}
          >
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

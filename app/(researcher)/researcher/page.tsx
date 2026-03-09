"use client";

import { PortalNav } from "@/components/PortalNav";
import { ResearcherMap } from "./components/ResearcherMap";
import { ResearcherChart } from "./components/ResearcherChart";
import { DataPanel } from "@/components/DataPanel";
import { PortalLayout } from "@/components/PortalLayout";
import { ResearcherTable } from "./components/ResearcherTable";
import { YearFilterProvider } from "@/lib/contexts/year-filter";

import { CopilotProvider } from "@/components/CopilotProvider";
import { useCopilotReadable } from "@copilotkit/react-core";
import { Button } from "@/components/ui/button";
import { HelpCircle, GraduationCap } from "lucide-react";
import { useTour } from "@/components/ui/tour";

function ResearcherContent() {
  const { start } = useTour();

  useCopilotReadable({
    description: "Current portal context",
    value: { portal: "researcher", availableViews: ["map", "table", "chart"] },
  });

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 sm:p-6">
      <div
        className="flex items-center justify-between"
        data-tour-step-id="researcher-welcome"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-portal-researcher/10">
            <GraduationCap className="h-4.5 w-4.5 text-portal-researcher" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              Researcher Portal
            </h1>
            <p className="hidden text-sm text-muted-foreground sm:block">
              Crime Trends, Demographics &amp; Public Safety Analysis
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => start("researcher-tour")}
          >
            <HelpCircle className="size-3.5" />
            <span className="hidden sm:inline">Take a Tour</span>
          </Button>
        </div>
      </div>

      <PortalLayout
        portal="researcher"
        chatTitle="Research Assistant"
        welcomeMessage="Welcome, researcher! I can help you explore crime statistics, 911 call data, demographic trends, and available public datasets for Montgomery. What would you like to analyze?"
        chatPlaceholder="Ask about crime trends, demographics, datasets..."
      >
        <DataPanel
          portalId="researcher"
          mapContent={<ResearcherMap />}
          tableContent={<ResearcherTable />}
          chartContent={<ResearcherChart />}
        />
      </PortalLayout>
    </main>
  );
}

export default function ResearcherPage() {
  return (
    <CopilotProvider agent="researcher">
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        <PortalNav />
        <YearFilterProvider>
          <ResearcherContent />
        </YearFilterProvider>
      </div>
    </CopilotProvider>
  );
}

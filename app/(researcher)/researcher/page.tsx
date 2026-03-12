"use client";

import { useCopilotReadable } from "@copilotkit/react-core";
import { GraduationCap, HelpCircle } from "lucide-react";
import { CopilotProvider } from "@/components/CopilotProvider";
import { DataPanel } from "@/components/DataPanel";
import { PortalLayout } from "@/components/PortalLayout";
import { PortalNav } from "@/components/PortalNav";
import { Button } from "@/components/ui/button";
import { useTour } from "@/components/ui/tour";
import { YearFilterProvider } from "@/lib/contexts/year-filter";
import { ResearcherChart } from "./components/ResearcherChart";
import { ResearcherMap } from "./components/ResearcherMap";
import { ResearcherTable } from "./components/ResearcherTable";

function ResearcherContent() {
  const { start } = useTour();

  useCopilotReadable({
    description: "Current portal context",
    value: { portal: "researcher", availableViews: ["map", "table", "chart"] },
  });

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3 sm:gap-4 sm:p-4 md:p-6">
      <div
        className="flex items-center justify-between gap-2"
        data-tour-step-id="researcher-welcome"
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex size-8 sm:size-9 items-center justify-center rounded-lg bg-portal-researcher/10 shrink-0">
            <GraduationCap className="size-4 text-portal-researcher" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight sm:text-xl md:text-2xl truncate">
              Researcher Portal
            </h1>
            <p className="hidden text-sm text-muted-foreground sm:block">
              Crime Trends, Demographics &amp; Public Safety Analysis
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => start("researcher-tour")}>
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

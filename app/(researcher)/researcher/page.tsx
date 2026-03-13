"use client";

import { useCopilotReadable } from "@copilotkit/react-core";
import { CopilotProvider } from "@/components/CopilotProvider";
import { DataPanel } from "@/components/DataPanel";
import { PortalLayout } from "@/components/PortalLayout";
import { PortalNav } from "@/components/PortalNav";
import { YearFilterProvider } from "@/lib/contexts/year-filter";
import { ResearcherChart } from "./components/ResearcherChart";
import { ResearcherMap } from "./components/ResearcherMap";
import { ResearcherTable } from "./components/ResearcherTable";

function ResearcherContent() {
  useCopilotReadable({
    description: "Current portal context",
    value: { portal: "researcher", availableViews: ["map", "table", "chart"] },
  });

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-2 sm:p-3">
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

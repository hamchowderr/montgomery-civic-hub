"use client";

import { useCopilotReadable } from "@copilotkit/react-core";
import { CopilotProvider } from "@/components/CopilotProvider";
import { DataPanel } from "@/components/DataPanel";
import { PortalLayout } from "@/components/PortalLayout";
import { PortalNav } from "@/components/PortalNav";
import { YearFilterProvider } from "@/lib/contexts/year-filter";
import { ResidentChart } from "./components/ResidentChart";
import { ResidentMap } from "./components/ResidentMap";
import { ResidentTable } from "./components/ResidentTable";

function ResidentContent() {
  useCopilotReadable({
    description: "Current portal context",
    value: {
      portal: "resident",
      availableViews: ["map", "table", "chart"],
    },
  });

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-2 sm:p-3">
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

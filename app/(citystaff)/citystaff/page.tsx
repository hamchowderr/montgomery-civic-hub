"use client";

import { useCopilotReadable } from "@copilotkit/react-core";
import { CopilotProvider } from "@/components/CopilotProvider";
import { DataPanel } from "@/components/DataPanel";
import { PortalLayout } from "@/components/PortalLayout";
import { PortalNav } from "@/components/PortalNav";
import { YearFilterProvider } from "@/lib/contexts/year-filter";
import { CityStaffChart } from "./components/CityStaffChart";
import { CityStaffMap } from "./components/CityStaffMap";
import { CityStaffTable } from "./components/CityStaffTable";

function CityStaffContent() {
  useCopilotReadable({
    description: "Current portal context",
    value: { portal: "citystaff", availableViews: ["map", "table", "chart"] },
  });

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-2 sm:p-3">
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

"use client";

import { useCopilotReadable } from "@copilotkit/react-core";
import { CopilotProvider } from "@/components/CopilotProvider";
import { DataPanel } from "@/components/DataPanel";
import { PortalLayout } from "@/components/PortalLayout";
import { PortalNav } from "@/components/PortalNav";
import { YearFilterProvider } from "@/lib/contexts/year-filter";
import { BusinessChart } from "./components/BusinessChart";
import { BusinessMap } from "./components/BusinessMap";
import { BusinessTable } from "./components/BusinessTable";

function BusinessContent() {
  useCopilotReadable({
    description: "Current portal context",
    value: {
      portal: "business",
      availableViews: ["map", "table", "chart"],
    },
  });

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-2 sm:p-3">
      <PortalLayout
        portal="business"
        chatTitle="Business Assistant"
        welcomeMessage="Welcome! I can help you find information about permits, licenses, zoning, vacant and city-owned property lookups, and business development in Montgomery. What do you need?"
        chatPlaceholder="Ask about permits, licenses, zoning..."
      >
        <DataPanel
          portalId="business"
          mapContent={<BusinessMap />}
          tableContent={<BusinessTable />}
          chartContent={<BusinessChart />}
        />
      </PortalLayout>
    </main>
  );
}

export default function BusinessPage() {
  return (
    <CopilotProvider agent="business">
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        <PortalNav />
        <YearFilterProvider>
          <BusinessContent />
        </YearFilterProvider>
      </div>
    </CopilotProvider>
  );
}

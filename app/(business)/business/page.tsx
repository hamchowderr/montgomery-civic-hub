"use client";

import { useCopilotReadable } from "@copilotkit/react-core";
import { Briefcase, HelpCircle } from "lucide-react";
import { CopilotProvider } from "@/components/CopilotProvider";
import { DataPanel } from "@/components/DataPanel";
import { PortalLayout } from "@/components/PortalLayout";
import { PortalNav } from "@/components/PortalNav";
import { Button } from "@/components/ui/button";
import { useTour } from "@/components/ui/tour";
import { YearFilterProvider } from "@/lib/contexts/year-filter";
import { BusinessChart } from "./components/BusinessChart";
import { BusinessMap } from "./components/BusinessMap";
import { BusinessTable } from "./components/BusinessTable";

function BusinessContent() {
  const { start } = useTour();

  useCopilotReadable({
    description: "Current portal context",
    value: { portal: "business", availableViews: ["map", "table", "chart"] },
  });

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3 sm:gap-4 sm:p-4 md:p-6">
      <div className="flex items-center justify-between gap-2" data-tour-step-id="business-welcome">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex size-8 sm:size-9 items-center justify-center rounded-lg bg-portal-business/10 shrink-0">
            <Briefcase className="size-4 text-portal-business" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight sm:text-xl md:text-2xl truncate">
              Business Portal
            </h1>
            <p className="hidden text-sm text-muted-foreground sm:block">
              Permits, Licenses &amp; Economic Intelligence
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => start("business-tour")}>
            <HelpCircle className="size-3.5" />
            <span className="hidden sm:inline">Take a Tour</span>
          </Button>
        </div>
      </div>

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

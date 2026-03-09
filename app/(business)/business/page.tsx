"use client";

import { PortalNav } from "@/components/PortalNav";
import { BusinessMap } from "./components/BusinessMap";
import { DataPanel } from "@/components/DataPanel";
import { PortalLayout } from "@/components/PortalLayout";
import { BusinessTable } from "./components/BusinessTable";
import { BusinessChart } from "./components/BusinessChart";
import { YearFilterProvider } from "@/lib/contexts/year-filter";

import { CopilotProvider } from "@/components/CopilotProvider";
import { useCopilotReadable } from "@copilotkit/react-core";
import { Button } from "@/components/ui/button";
import { HelpCircle, Briefcase } from "lucide-react";
import { useTour } from "@/components/ui/tour";

function BusinessContent() {
  const { start } = useTour();

  useCopilotReadable({
    description: "Current portal context",
    value: { portal: "business", availableViews: ["map", "table", "chart"] },
  });

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 sm:p-6">
      <div
        className="flex items-center justify-between"
        data-tour-step-id="business-welcome"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-portal-business/10">
            <Briefcase className="h-4.5 w-4.5 text-portal-business" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              Business Portal
            </h1>
            <p className="hidden text-sm text-muted-foreground sm:block">
              Permits, Licenses &amp; Economic Intelligence
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => start("business-tour")}
          >
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

"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CopilotProvider } from "@/components/CopilotProvider";
import { PortalNav } from "@/components/PortalNav";
import { DemographicsDashboard } from "../components/demographics/DemographicsDashboard";

function DemographicsContent() {
  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="border-b px-4 py-2 sm:px-6">
          <Link
            href="/researcher"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Back to Researcher Portal
          </Link>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8">
          <DemographicsDashboard />
        </div>
      </div>
    </main>
  );
}

export default function DemographicsPage() {
  return (
    <CopilotProvider agent="researcher">
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        <PortalNav />
        <DemographicsContent />
      </div>
    </CopilotProvider>
  );
}

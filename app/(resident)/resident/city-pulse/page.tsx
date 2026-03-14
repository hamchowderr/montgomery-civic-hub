"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CopilotProvider } from "@/components/CopilotProvider";
import { PortalNav } from "@/components/PortalNav";
import { CityPulseDashboard } from "../components/city-pulse/CityPulseDashboard";

function CityPulseContent() {
  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="border-b px-4 py-2 sm:px-6">
          <Link
            href="/resident"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Back to Resident Dashboard
          </Link>
        </div>

        <div className="min-h-0 flex-1">
          <CityPulseDashboard />
        </div>
      </div>
    </main>
  );
}

export default function CityPulsePage() {
  return (
    <CopilotProvider agent="resident">
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        <PortalNav />
        <CityPulseContent />
      </div>
    </CopilotProvider>
  );
}

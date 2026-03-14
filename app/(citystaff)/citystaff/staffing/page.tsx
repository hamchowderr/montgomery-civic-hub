"use client";

import { ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";
import { CopilotProvider } from "@/components/CopilotProvider";
import { PortalNav } from "@/components/PortalNav";
import { StaffingDashboard } from "../components/StaffingDashboard";

function StaffingContent() {
  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-auto">
      <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="space-y-3">
          <Link
            href="/citystaff"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Back to City Staff Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-portal-citystaff/10">
              <Shield className="size-5 text-portal-citystaff" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                MPD Staffing & Recruiting
              </h1>
              <p className="text-sm text-muted-foreground">
                Officer staffing levels, district coverage, demand analysis, and recruiting actions
              </p>
            </div>
          </div>
        </div>

        {/* Full-page dashboard */}
        <StaffingDashboard />
      </div>
    </main>
  );
}

export default function StaffingPage() {
  return (
    <CopilotProvider agent="citystaff">
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        <PortalNav />
        <StaffingContent />
      </div>
    </CopilotProvider>
  );
}

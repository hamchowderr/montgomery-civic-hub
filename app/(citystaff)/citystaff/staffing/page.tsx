"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CopilotProvider } from "@/components/CopilotProvider";
import { PortalNav } from "@/components/PortalNav";
import { StaffingDashboard } from "../components/staffing/StaffingDashboard";

function StaffingContent() {
  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="border-b px-4 py-2 sm:px-6">
          <Link
            href="/citystaff"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Back to City Staff Dashboard
          </Link>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          <StaffingDashboard />
        </div>
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

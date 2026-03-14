"use client";

import { ArrowLeft, Radio } from "lucide-react";
import Link from "next/link";
import { CopilotProvider } from "@/components/CopilotProvider";
import { PortalNav } from "@/components/PortalNav";
import { YearFilterProvider } from "@/lib/contexts/year-filter";
import { IncidentNewsfeed } from "../components/IncidentNewsfeed";

function NewsfeedContent() {
  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-auto">
      <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="space-y-3">
          <Link
            href="/resident"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Back to Resident Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-portal-resident/10">
              <Radio className="size-5 text-portal-resident" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Live Incident Feed</h1>
              <p className="text-sm text-muted-foreground">
                Real-time 311 service requests and local news for Montgomery, AL
              </p>
            </div>
          </div>
        </div>

        {/* Full-page component */}
        <IncidentNewsfeed />
      </div>
    </main>
  );
}

export default function NewsfeedPage() {
  return (
    <CopilotProvider agent="resident">
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        <PortalNav />
        <YearFilterProvider>
          <NewsfeedContent />
        </YearFilterProvider>
      </div>
    </CopilotProvider>
  );
}

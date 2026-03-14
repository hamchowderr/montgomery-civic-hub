"use client";

import { ArrowLeft, Phone } from "lucide-react";
import Link from "next/link";
import { CopilotProvider } from "@/components/CopilotProvider";
import { PortalNav } from "@/components/PortalNav";
import { EmergencyContact } from "../components/EmergencyContact";

function EmergencyContent() {
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
            <div className="flex size-10 items-center justify-center rounded-lg bg-red-500/10">
              <Phone className="size-5 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Emergency Contacts</h1>
              <p className="text-sm text-muted-foreground">
                Montgomery emergency numbers, precinct finder, and MPD response context
              </p>
            </div>
          </div>
        </div>

        {/* Full-page component */}
        <EmergencyContact />
      </div>
    </main>
  );
}

export default function EmergencyPage() {
  return (
    <CopilotProvider agent="resident">
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        <PortalNav />
        <EmergencyContent />
      </div>
    </CopilotProvider>
  );
}

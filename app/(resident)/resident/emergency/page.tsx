"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CopilotProvider } from "@/components/CopilotProvider";
import { PortalNav } from "@/components/PortalNav";
import { EmergencyContact } from "../components/emergency/EmergencyContact";

function EmergencyContent() {
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

        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin px-4 sm:px-6 md:px-8 py-6">
          <EmergencyContact />
        </div>
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

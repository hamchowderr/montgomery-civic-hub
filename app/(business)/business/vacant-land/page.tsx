"use client";

import { ArrowLeft, LandPlot } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CopilotProvider } from "@/components/CopilotProvider";
import { PortalNav } from "@/components/PortalNav";
import { LandReuseCard } from "../components/LandReuseCard";
import { VacantLandExplorer, type VacantProperty } from "../components/VacantLandExplorer";

function VacantLandContent() {
  const [selectedProperty, setSelectedProperty] = useState<VacantProperty | null>(null);

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Header */}
        <div className="space-y-3 border-b px-4 py-4 sm:px-6 md:px-8">
          <Link
            href="/business"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Back to Business Portal
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-portal-business/10">
              <LandPlot className="size-5 text-portal-business" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Vacant Land Explorer
              </h1>
              <p className="text-sm text-muted-foreground">
                Browse city-owned properties with zoning filters and AI reuse suggestions
              </p>
            </div>
          </div>
        </div>

        {/* Full-height explorer + reuse card */}
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <div className="min-h-0 flex-1">
            <VacantLandExplorer onSelectProperty={setSelectedProperty} />
          </div>
          {selectedProperty && (
            <div className="w-full shrink-0 border-t p-4 lg:w-80 lg:border-l lg:border-t-0">
              <LandReuseCard property={selectedProperty} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function VacantLandPage() {
  return (
    <CopilotProvider agent="business">
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        <PortalNav />
        <VacantLandContent />
      </div>
    </CopilotProvider>
  );
}

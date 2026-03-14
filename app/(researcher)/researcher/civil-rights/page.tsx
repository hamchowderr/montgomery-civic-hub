"use client";

import { ArrowLeft, Landmark } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CopilotProvider } from "@/components/CopilotProvider";
import { PortalNav } from "@/components/PortalNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CivilRightsTimeline } from "../components/CivilRightsTimeline";

function CivilRightsContent() {
  const [selectedLandmark, setSelectedLandmark] = useState<{
    name: string;
    year: number;
    event: string;
    description: string;
    coordinates: [number, number];
  } | null>(null);

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-auto">
      <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="space-y-3">
          <Link
            href="/researcher"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Back to Researcher Portal
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-[#D4AF37]/10">
              <Landmark className="size-5" style={{ color: "#D4AF37" }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Civil Rights History
              </h1>
              <p className="text-sm text-muted-foreground">
                Montgomery&apos;s pivotal role in the American Civil Rights Movement
              </p>
            </div>
          </div>
        </div>

        {/* Timeline component */}
        <CivilRightsTimeline onSelectLandmark={setSelectedLandmark} />

        {/* Selected landmark detail */}
        {selectedLandmark && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-lg font-bold" style={{ color: "#D4AF37" }}>
                  {selectedLandmark.year}
                </span>
                <span>{selectedLandmark.event}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm font-medium">{selectedLandmark.name}</p>
              <p className="text-sm text-muted-foreground">{selectedLandmark.description}</p>
              <p className="text-xs text-muted-foreground">
                Location: {selectedLandmark.coordinates[1].toFixed(4)},{" "}
                {selectedLandmark.coordinates[0].toFixed(4)}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

export default function CivilRightsPage() {
  return (
    <CopilotProvider agent="researcher">
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        <PortalNav />
        <CivilRightsContent />
      </div>
    </CopilotProvider>
  );
}

"use client";

import { AlertTriangle, Phone, PhoneCall, Siren } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EMERGENCY_NUMBERS } from "./types";

interface EmergencyNumbersProps {
  sirenCount: number | null;
}

export function EmergencyNumbers({ sirenCount }: EmergencyNumbersProps) {
  return (
    <div className="space-y-4">
      {/* Hero 911 Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 via-red-700 to-red-900 px-6 py-8 text-white shadow-xl shadow-red-500/20 dark:from-red-800 dark:via-red-900 dark:to-red-950 sm:px-8 sm:py-10">
        {/* Background pattern */}
        <div className="pointer-events-none absolute inset-0 opacity-10">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full border-[6px] border-white/30" />
          <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full border-[6px] border-white/20" />
        </div>

        <div className="relative flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/20 ring-4 ring-white/30 sm:h-20 sm:w-20">
            <PhoneCall className="h-8 w-8 sm:h-10 sm:w-10" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold uppercase tracking-widest text-red-100">
              Life-Threatening Emergency
            </p>
            <p className="mt-1 text-5xl font-black tracking-tight sm:text-6xl">CALL 911</p>
            <p className="mt-2 text-sm text-red-200">
              Police, Fire, or Medical emergencies in Montgomery, AL
            </p>
          </div>
          <a
            href="tel:911"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-bold text-red-700 shadow-lg transition-all hover:bg-red-50 hover:shadow-xl active:scale-95 sm:px-8 sm:py-4 sm:text-lg"
          >
            <Phone className="h-5 w-5" />
            Call 911
          </a>
        </div>

        {sirenCount !== null && (
          <div className="relative mt-6 flex items-center justify-center gap-2 rounded-lg bg-white/10 px-4 py-2 backdrop-blur-sm sm:justify-start">
            <Siren className="h-4 w-4 text-amber-300" />
            <span className="text-sm font-medium text-red-100">
              <span className="font-bold text-white">{sirenCount}</span> Tornado Sirens Active in
              Montgomery County
            </span>
          </div>
        )}
      </div>

      {/* Non-emergency number cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {EMERGENCY_NUMBERS.filter((item) => !item.highlight).map((item) => (
          <Card key={item.number} className="group transition-all hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50">
                <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                <a
                  href={`tel:${item.number.replace(/-/g, "")}`}
                  className="text-base font-semibold font-mono tracking-tight transition-colors hover:text-blue-600 dark:hover:text-blue-400"
                >
                  {item.number}
                </a>
              </div>
              <Badge
                variant="outline"
                className="shrink-0 text-[10px] opacity-0 transition-opacity group-hover:opacity-100"
              >
                Tap to call
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

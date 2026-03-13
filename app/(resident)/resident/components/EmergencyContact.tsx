"use client";

import { useCopilotReadable } from "@copilotkit/react-core";
import { AlertTriangle, Phone, Shield } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const emergencyNumbers = [
  { label: "Emergency", number: "911", highlight: true },
  { label: "MPD Non-Emergency", number: "334-625-2651" },
  { label: "Fire Non-Emergency", number: "334-241-2600" },
  { label: "City Main Line", number: "334-625-2000" },
];

const precinctMap: Record<string, { name: string; address: string }> = {
  "1": { name: "North Precinct", address: "320 N Ripley St" },
  "2": { name: "North Precinct", address: "320 N Ripley St" },
  "3": { name: "Central Precinct", address: "115 E South Blvd" },
  "4": { name: "Central Precinct", address: "115 E South Blvd" },
  "5": { name: "South Precinct", address: "600 E Fairview Ave" },
  "6": { name: "South Precinct", address: "600 E Fairview Ave" },
  "7": { name: "East Precinct", address: "1100 Air Base Blvd" },
  "8": { name: "East Precinct", address: "1100 Air Base Blvd" },
  "9": { name: "West Precinct", address: "2222 West Blvd" },
};

const responseStats = [
  { label: "Priority response times", stat: "Up 17% since 2019" },
  { label: "Officer vacancy rate", stat: "19%" },
  { label: "911 center vacancy", stat: "43% — 64 open positions" },
];

export function EmergencyContact() {
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const precinct = selectedDistrict ? precinctMap[selectedDistrict] : null;

  useCopilotReadable({
    description: "Montgomery emergency contacts and MPD response statistics",
    value: { emergencyNumbers, responseStats },
  });

  return (
    <div data-tour-step-id="resident-emergency" className="grid gap-3 sm:grid-cols-3">
      {/* Section A: Emergency Numbers */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4" />
            Emergency Numbers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {emergencyNumbers.map((item) => (
            <a
              key={item.number}
              href={`tel:${item.number.replace(/-/g, "")}`}
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted ${
                item.highlight ? "text-lg font-bold text-red-600" : ""
              }`}
            >
              <Phone
                className={`h-3.5 w-3.5 shrink-0 ${item.highlight ? "h-5 w-5 text-red-600" : "text-muted-foreground"}`}
              />
              <span className="flex-1">{item.label}</span>
              <span className={item.highlight ? "" : "font-mono text-xs"}>{item.number}</span>
            </a>
          ))}
        </CardContent>
      </Card>

      {/* Section B: Nearest Precinct Finder */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4" />
            Nearest Precinct
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select your district" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 9 }, (_, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>
                  District {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {precinct && (
            <div className="rounded-md border bg-muted/50 p-3 text-sm">
              <p className="font-medium">{precinct.name}</p>
              <p className="text-muted-foreground">{precinct.address}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section C: Response Time Context */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Response Time Context
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {responseStats.map((item) => (
            <div
              key={item.label}
              className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-900 dark:bg-amber-950"
            >
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                {item.stat}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

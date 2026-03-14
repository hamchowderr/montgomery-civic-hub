"use client";

import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { useRef, useState } from "react";
import { CopilotProvider } from "@/components/CopilotProvider";
import { PortalLayout } from "@/components/PortalLayout";
import { PortalNav } from "@/components/PortalNav";
import { YearFilterProvider } from "@/lib/contexts/year-filter";
import { ExecutiveDashboard } from "./components/ExecutiveDashboard";

function ExecutiveContent() {
  const [highlightedAlert, setHighlightedAlert] = useState<number | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useCopilotReadable({
    description: "Current portal context",
    value: {
      portal: "executive",
      availableViews: [
        "briefing",
        "kpis",
        "alerts",
        "crossPortalPulse",
        "servicePerformance",
        "infrastructure",
      ],
      highlightedAlert,
    },
  });

  useCopilotAction({
    name: "generate_briefing",
    description:
      "Generate a daily executive briefing summarizing key metrics, alerts, and recommended actions across all city portals",
    parameters: [
      {
        name: "format",
        type: "string",
        description: "Briefing format — quick for bullet points, detailed for full narrative",
        required: true,
        enum: ["quick", "detailed"],
      },
    ],
    handler: ({ format }) => {
      return `Please generate a ${format} executive briefing for the city of Montgomery covering current KPIs, active alerts, and recommended priorities.`;
    },
  });

  useCopilotAction({
    name: "highlight_alert",
    description: "Highlight a specific alert in the priority queue by its index",
    parameters: [
      {
        name: "alertIndex",
        type: "number",
        description: "Zero-based index of the alert to highlight",
        required: true,
      },
    ],
    handler: ({ alertIndex }) => {
      setHighlightedAlert(alertIndex);
      setTimeout(() => setHighlightedAlert(null), 5000);
      return `Alert ${alertIndex} highlighted`;
    },
  });

  useCopilotAction({
    name: "switch_executive_view",
    description: "Scroll to a specific section of the executive dashboard",
    parameters: [
      {
        name: "view",
        type: "string",
        description: "Section to scroll to",
        required: true,
        enum: [
          "briefing",
          "kpis",
          "alerts",
          "crossPortalPulse",
          "servicePerformance",
          "infrastructure",
        ],
      },
    ],
    handler: ({ view }) => {
      const el = sectionRefs.current[view];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return `Scrolled to ${view}`;
    },
  });

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-2 sm:p-3">
      <PortalLayout
        portal="executive"
        chatTitle="Executive Assistant"
        welcomeMessage="Welcome to the Executive Dashboard. I can help you with city-wide KPIs, daily briefings, cross-portal insights, and priority alerts. What would you like to know?"
        chatPlaceholder="Ask about city operations, KPIs, briefings..."
      >
        <ExecutiveDashboard highlightedAlert={highlightedAlert} sectionRefs={sectionRefs} />
      </PortalLayout>
    </main>
  );
}

export default function ExecutivePage() {
  return (
    <CopilotProvider agent="executive">
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        <PortalNav />
        <YearFilterProvider>
          <ExecutiveContent />
        </YearFilterProvider>
      </div>
    </CopilotProvider>
  );
}

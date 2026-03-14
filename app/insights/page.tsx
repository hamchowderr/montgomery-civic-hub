"use client";

import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { useCallback, useState } from "react";
import { CopilotProvider } from "@/components/CopilotProvider";
import { PortalLayout } from "@/components/PortalLayout";
import { PortalNav } from "@/components/PortalNav";
import { YearFilterProvider } from "@/lib/contexts/year-filter";
import { InsightsDashboard } from "./components/InsightsDashboard";

type InsightTab = "overview" | "equity" | "trends" | "districts" | "stories";

function InsightsContent() {
  const [activeTab, setActiveTab] = useState<InsightTab>("overview");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("D1");
  const [selectedMetrics, setSelectedMetrics] = useState<Set<string>>(
    () => new Set(["requests", "violations", "permits", "licenses"]),
  );

  const handleToggleMetric = useCallback((metric: string, visible: boolean) => {
    setSelectedMetrics((prev) => {
      const next = new Set(prev);
      if (visible) {
        next.add(metric);
      } else {
        next.delete(metric);
      }
      return next;
    });
  }, []);

  // AI-readable context
  useCopilotReadable({
    description: "Current insights dashboard state",
    value: {
      portal: "insights",
      activeTab,
      selectedDistrict,
      selectedMetrics: Array.from(selectedMetrics),
      availableTabs: ["overview", "equity", "trends", "districts", "stories"],
      availableDistricts: ["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9"],
    },
  });

  // AI actions
  useCopilotAction({
    name: "switch_insight_tab",
    description: "Switch to a different tab in the insights dashboard",
    parameters: [
      {
        name: "tab",
        type: "string",
        description: "The tab to switch to",
        required: true,
        enum: ["overview", "equity", "trends", "districts", "stories"],
      },
    ],
    handler: ({ tab }) => {
      setActiveTab(tab as InsightTab);
      return `Switched to ${tab} tab`;
    },
  });

  useCopilotAction({
    name: "select_district",
    description: "Select a district for detailed analysis (D1-D9)",
    parameters: [
      {
        name: "district",
        type: "string",
        description: "District identifier (e.g. D1, D2, ... D9)",
        required: true,
      },
    ],
    handler: ({ district }) => {
      setSelectedDistrict(district);
      setActiveTab("districts");
      return `Selected ${district} for analysis`;
    },
  });

  useCopilotAction({
    name: "toggle_metric",
    description: "Show or hide a metric on the trends chart",
    parameters: [
      {
        name: "metric",
        type: "string",
        description: "Metric name (requests, violations, permits, licenses)",
        required: true,
      },
      {
        name: "visible",
        type: "boolean",
        description: "Whether to show (true) or hide (false) the metric",
        required: true,
      },
    ],
    handler: ({ metric, visible }) => {
      handleToggleMetric(metric, visible);
      return `${visible ? "Showing" : "Hiding"} ${metric} on trends chart`;
    },
  });

  useCopilotAction({
    name: "generate_data_story",
    description:
      "Generate a narrative data story about Montgomery civic data. Returns a prompt for the AI to elaborate on.",
    parameters: [
      {
        name: "focus",
        type: "string",
        description:
          "What to focus the story on: full city overview, equity analysis, district spotlight, or trend analysis",
        required: true,
      },
    ],
    handler: ({ focus }) => {
      setActiveTab("stories");
      return `Please generate a data story focused on: ${focus}. Use the cross-district insights data and multi-metric trends to craft a narrative with key findings, patterns, and recommendations for Montgomery city leadership.`;
    },
  });

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-2 sm:p-3">
      <PortalLayout
        portal="insights"
        chatTitle="Data Analyst"
        welcomeMessage="Welcome to the Insights Lab! I can help you explore cross-district patterns, equity analysis, multi-year trends, and generate data-driven narratives. What would you like to investigate?"
        chatPlaceholder="Ask about district patterns, equity analysis..."
      >
        <InsightsDashboard
          activeTab={activeTab}
          onTabChange={setActiveTab}
          selectedDistrict={selectedDistrict}
          onSelectDistrict={setSelectedDistrict}
          selectedMetrics={selectedMetrics}
          onToggleMetric={handleToggleMetric}
        />
      </PortalLayout>
    </main>
  );
}

export default function InsightsPage() {
  return (
    <CopilotProvider agent="insights">
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        <PortalNav />
        <YearFilterProvider>
          <InsightsContent />
        </YearFilterProvider>
      </div>
    </CopilotProvider>
  );
}

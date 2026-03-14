"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { ChevronDown, ChevronUp, ClipboardCopy, FileText } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ACTION_ITEMS, DISTRICT_COVERAGE, STAFFING } from "./types";

export function RecruitingActions() {
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [reportMarkdown, setReportMarkdown] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggle = (id: number) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  const completedCount = ACTION_ITEMS.filter((item) => checked[item.id]).length;
  const completionPercent = Math.round((completedCount / ACTION_ITEMS.length) * 100);

  function generateReport() {
    let md = `# MPD Staffing Report\n\n`;
    md += `## Overview\n`;
    md += `- **Authorized Strength:** ${STAFFING.mpd.authorized}\n`;
    md += `- **Current Strength:** ${STAFFING.mpd.current}\n`;
    md += `- **Vacancy:** ${STAFFING.mpd.vacancy} (${STAFFING.mpd.vacancyRate}%)\n\n`;
    md += `## 911 Dispatch\n`;
    md += `- **Authorized:** ${STAFFING.dispatch.authorized}\n`;
    md += `- **Filled:** ${STAFFING.dispatch.filled}\n`;
    md += `- **Vacancy:** ${STAFFING.dispatch.vacancy} (${STAFFING.dispatch.vacancyRate}%)\n\n`;
    md += `## District Coverage\n`;
    md += `| District | Current | Target | Status |\n`;
    md += `|----------|---------|--------|--------|\n`;
    for (const d of DISTRICT_COVERAGE) {
      const status = d.current < 33 ? "Critical" : d.current <= 40 ? "Below Target" : "On Target";
      md += `| ${d.district} | ${d.current} | ${d.target} | ${status} |\n`;
    }
    md += `\n## Recruiting Action Items\n`;
    for (const item of ACTION_ITEMS) {
      const done = checked[item.id] ? "x" : " ";
      md += `- [${done}] (${item.priority}) ${item.title}\n`;
    }
    return md;
  }

  // CopilotKit action: generate staffing report
  useCopilotAction({
    name: "generate_staffing_report",
    description: "Generate a formatted markdown staffing report for MPD",
    parameters: [
      {
        name: "includeDistricts",
        type: "boolean",
        description: "Whether to include district coverage data",
        required: true,
      },
      {
        name: "includeDemand",
        type: "boolean",
        description: "Whether to include 311 demand proxy data",
        required: true,
      },
    ],
    handler: ({ includeDistricts, includeDemand }) => {
      let md = `# MPD Staffing Report\n\n`;
      md += `## Overview\n`;
      md += `- **Authorized Strength:** ${STAFFING.mpd.authorized}\n`;
      md += `- **Current Strength:** ${STAFFING.mpd.current}\n`;
      md += `- **Vacancy:** ${STAFFING.mpd.vacancy} (${STAFFING.mpd.vacancyRate}%)\n\n`;
      md += `## 911 Dispatch\n`;
      md += `- **Authorized:** ${STAFFING.dispatch.authorized}\n`;
      md += `- **Filled:** ${STAFFING.dispatch.filled}\n`;
      md += `- **Vacancy:** ${STAFFING.dispatch.vacancy} (${STAFFING.dispatch.vacancyRate}%)\n\n`;

      if (includeDistricts) {
        md += `## District Coverage\n`;
        md += `| District | Current | Target | Status |\n`;
        md += `|----------|---------|--------|--------|\n`;
        for (const d of DISTRICT_COVERAGE) {
          const status =
            d.current < 33 ? "Critical" : d.current <= 40 ? "Below Target" : "On Target";
          md += `| ${d.district} | ${d.current} | ${d.target} | ${status} |\n`;
        }
        md += `\n`;
      }

      if (includeDemand) {
        md += `## 311 Demand Proxy\n`;
        md += `311 service request volume by district is available in the dashboard for 2024.\n\n`;
      }

      md += `## Recruiting Action Items\n`;
      for (const item of ACTION_ITEMS) {
        const done = checked[item.id] ? "x" : " ";
        md += `- [${done}] (${item.priority}) ${item.title}\n`;
      }

      setReportMarkdown(md);
      setReportOpen(true);
      return md;
    },
  });

  async function handleCopy() {
    if (!reportMarkdown) return;
    try {
      await navigator.clipboard.writeText(reportMarkdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may fail in some contexts
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Recruiting Action Items</CardTitle>
        <CardDescription>Track progress on key recruiting initiatives</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress summary */}
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium">
              {completedCount} of {ACTION_ITEMS.length} complete
            </span>
            <span className="text-xs text-muted-foreground">{completionPercent}%</span>
          </div>
          <Progress value={completionPercent} className="h-2" />
        </div>

        {/* Action items */}
        <div className="space-y-2">
          {ACTION_ITEMS.map((item) => (
            <label
              key={item.id}
              className="flex items-start gap-3 cursor-pointer rounded-lg border p-3 transition-colors hover:bg-muted/50"
            >
              <Checkbox
                checked={!!checked[item.id]}
                onCheckedChange={() => toggle(item.id)}
                className="mt-0.5"
              />
              <span
                className={`flex-1 text-sm ${
                  checked[item.id] ? "line-through text-muted-foreground" : ""
                }`}
              >
                {item.title}
              </span>
              <Badge
                variant={item.priority === "High" ? "destructive" : "secondary"}
                className="shrink-0 text-[10px] px-1.5 py-0"
              >
                {item.priority}
              </Badge>
            </label>
          ))}
        </div>

        <Separator />

        {/* Generate report button */}
        <Button
          className="w-full gap-2"
          size="lg"
          onClick={() => {
            const md = generateReport();
            setReportMarkdown(md);
            setReportOpen(true);
          }}
        >
          <FileText className="h-4 w-4" />
          Generate Staffing Report
        </Button>

        {/* Report preview */}
        {reportMarkdown && (
          <div className="space-y-2">
            <button
              type="button"
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              onClick={() => setReportOpen((o) => !o)}
            >
              {reportOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {reportOpen ? "Hide Report" : "Show Report"}
            </button>
            {reportOpen && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-2 h-7 gap-1.5 text-xs"
                  onClick={handleCopy}
                >
                  <ClipboardCopy className="h-3.5 w-3.5" />
                  {copied ? "Copied!" : "Copy"}
                </Button>
                <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-md border bg-muted/50 p-3 pr-24 text-xs">
                  {reportMarkdown}
                </pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

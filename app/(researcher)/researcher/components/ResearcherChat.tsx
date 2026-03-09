"use client";

import { CopilotChat } from "@copilotkit/react-ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ResearcherChat() {
  return (
    <Card className="flex h-[500px] flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Research Assistant</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
        <CopilotChat
          labels={{
            initial:
              "Welcome, researcher! I can help you explore crime statistics, 911 call data, demographic trends, and available public datasets for Montgomery. What would you like to analyze?",
            title: "Research Assistant",
            placeholder: "Ask about crime trends, demographics, datasets...",
          }}
          className="flex-1 [&_.copilotKitHeader]:hidden"
        />
      </CardContent>
    </Card>
  );
}

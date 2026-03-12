"use client";

import { CopilotChat } from "@copilotkit/react-ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CityStaffChat() {
  return (
    <Card className="flex h-[500px] flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">City Staff Assistant</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
        <CopilotChat
          labels={{
            initial:
              "Welcome, staff! I can help with budget lookups, infrastructure project status, 911 call analytics, and operational reports. What do you need?",
            title: "City Staff Assistant",
            placeholder: "Ask about budgets, infrastructure, 911 data...",
          }}
          className="flex-1 [&_.copilotKitHeader]:hidden"
        />
      </CardContent>
    </Card>
  );
}

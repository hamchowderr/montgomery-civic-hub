"use client";

import { CopilotChat } from "@copilotkit/react-ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ResidentChat() {
  return (
    <Card className="flex h-[500px] flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Resident Assistant</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
        <CopilotChat
          labels={{
            initial:
              "Welcome! I can help you with neighborhood safety information, city services, sanitation schedules, and more. How can I assist you today?",
            title: "Resident Assistant",
            placeholder: "Ask about neighborhood safety, services...",
          }}
          className="flex-1 [&_.copilotKitHeader]:hidden"
        />
      </CardContent>
    </Card>
  );
}

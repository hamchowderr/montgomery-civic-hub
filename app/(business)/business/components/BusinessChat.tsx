"use client";

import { CopilotChat } from "@copilotkit/react-ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function BusinessChat() {
  return (
    <Card className="flex h-[500px] flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Business Assistant</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
        <CopilotChat
          labels={{
            initial:
              "Hello! I can help with business permits, licensing requirements, zoning information, and economic development resources. What do you need?",
            title: "Business Assistant",
            placeholder: "Ask about permits, licenses, zoning...",
          }}
          className="flex-1 [&_.copilotKitHeader]:hidden"
        />
      </CardContent>
    </Card>
  );
}

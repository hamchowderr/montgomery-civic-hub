"use client";

import { CopilotKit } from "@copilotkit/react-core";
import type { ReactNode } from "react";

interface CopilotProviderProps {
  children: ReactNode;
  agent?: string;
}

export function CopilotProvider({ children, agent }: CopilotProviderProps) {
  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      agent={agent}
      onError={(error) => {
        console.error("[CopilotKit] Error:", error);
      }}
    >
      {children}
    </CopilotKit>
  );
}

import { getLocalAgents } from "@ag-ui/mastra";
import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  ExperimentalEmptyAdapter,
} from "@copilotkit/runtime";
import { mastra } from "@/src/mastra";

const agents = getLocalAgents({
  mastra,
  resourceId: "montgomery-civic-hub",
});

export const POST = async (req: Request) => {
  const runtime = new CopilotRuntime({ agents });

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter: new ExperimentalEmptyAdapter(),
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};

import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { CivicAgent } from "@/lib/ai/civic-agent";

export const POST = async (req: Request) => {
  const runtime = new CopilotRuntime({
    agents: {
      resident: new CivicAgent("resident"),
      business: new CivicAgent("business"),
      citystaff: new CivicAgent("citystaff"),
      researcher: new CivicAgent("researcher"),
    },
  });

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter: new ExperimentalEmptyAdapter(),
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};

import { ConvexStore } from "@mastra/convex";
import { Mastra } from "@mastra/core";
import { allAgents } from "./agents";

function getStorage() {
  const deploymentUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const adminAuthToken = process.env.CONVEX_ADMIN_AUTH_TOKEN;
  if (!deploymentUrl || !adminAuthToken) return undefined;
  if (deploymentUrl.startsWith("YOUR_")) return undefined;

  return new ConvexStore({
    id: "civic-hub-storage",
    deploymentUrl,
    adminAuthToken,
  });
}

export const mastra = new Mastra({
  agents: allAgents,
  storage: getStorage(),
});

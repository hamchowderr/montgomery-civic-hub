"use client";

import { useEffect, useRef } from "react";

export function ConvexDashboard({
  deployKey,
  deploymentUrl,
  deploymentName,
  visiblePages,
  initialPage = "data",
}: {
  deployKey: string;
  deploymentUrl: string;
  deploymentName: string;
  visiblePages?: string[];
  initialPage?: string;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type !== "dashboard-credentials-request") return;
      iframeRef.current?.contentWindow?.postMessage(
        {
          type: "dashboard-credentials",
          adminKey: deployKey,
          deploymentUrl,
          deploymentName,
          visiblePages,
        },
        "*",
      );
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [deployKey, deploymentUrl, deploymentName, visiblePages]);

  return (
    <iframe
      ref={iframeRef}
      src={`https://dashboard-embedded.convex.dev/${initialPage}`}
      allow="clipboard-write"
      className="h-full w-full border-none"
    />
  );
}

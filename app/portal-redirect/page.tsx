"use client";

import dynamic from "next/dynamic";

const PortalRedirectContent = dynamic(() => import("./PortalRedirectContent"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-muted-foreground">Redirecting...</p>
    </div>
  ),
});

export default function PortalRedirectPage() {
  return <PortalRedirectContent />;
}

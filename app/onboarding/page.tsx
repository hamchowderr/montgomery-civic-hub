"use client";

import dynamic from "next/dynamic";

const OnboardingContent = dynamic(() => import("./OnboardingContent"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-muted-foreground">Loading...</p>
    </div>
  ),
});

export default function OnboardingPage() {
  return <OnboardingContent />;
}

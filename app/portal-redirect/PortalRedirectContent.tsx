"use client";

import { useAuth } from "@clerk/nextjs";
import { useConvexAuth, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { api } from "@/convex/_generated/api";

const STEPS = [
  "Verifying authentication…",
  "Connecting to database…",
  "Loading your profile…",
  "Preparing your dashboard…",
];

export default function PortalRedirectContent() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { isAuthenticated: isConvexAuth } = useConvexAuth();
  const user = useQuery(api.users.getCurrentUser, isConvexAuth ? undefined : "skip");
  const [step, setStep] = useState(0);
  const [convexWaitExpired, setConvexWaitExpired] = useState(false);

  // Animate progress steps
  useEffect(() => {
    if (step >= STEPS.length - 1) return;
    const timer = setTimeout(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 1200);
    return () => clearTimeout(timer);
  }, [step]);

  // Give Convex auth up to 10s before falling back to onboarding
  useEffect(() => {
    if (isConvexAuth) return; // already synced, no timeout needed
    const timeout = setTimeout(() => setConvexWaitExpired(true), 10000);
    return () => clearTimeout(timeout);
  }, [isConvexAuth]);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    // Convex auth not synced yet — wait until timeout expires
    if (!isConvexAuth) {
      if (convexWaitExpired) {
        router.push("/onboarding");
      }
      return;
    }

    if (user === undefined) return; // loading

    if (user === null || !user.role) {
      router.push("/onboarding");
    } else {
      router.push(`/${user.role}`);
    }
  }, [isLoaded, isSignedIn, isConvexAuth, user, router, convexWaitExpired]);

  const progress = Math.min(((step + 1) / STEPS.length) * 100, 95);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4">
      <div className="w-full max-w-sm space-y-4">
        <Progress value={progress} className="h-2" />
        <p className="text-center text-sm text-muted-foreground animate-pulse">{STEPS[step]}</p>
      </div>
    </div>
  );
}

"use client";

import { useAuth } from "@clerk/nextjs";
import { useConvexAuth, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "@/convex/_generated/api";

export default function PortalRedirectContent() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { isAuthenticated: isConvexAuth } = useConvexAuth();
  const user = useQuery(api.users.getCurrentUser, isConvexAuth ? undefined : "skip");

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    // Convex auth not synced yet — skip query but don't block forever
    if (!isConvexAuth) {
      const timeout = setTimeout(() => router.push("/onboarding"), 3000);
      return () => clearTimeout(timeout);
    }

    if (user === undefined) return; // loading

    if (user === null || !user.role) {
      router.push("/onboarding");
    } else {
      router.push(`/${user.role}`);
    }
  }, [isLoaded, isSignedIn, isConvexAuth, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-muted-foreground">Redirecting...</p>
    </div>
  );
}

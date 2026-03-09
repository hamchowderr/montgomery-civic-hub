"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function PortalRedirectContent() {
  const router = useRouter();
  const user = useQuery(api.users.getCurrentUser);

  useEffect(() => {
    if (user === undefined) return; // loading

    if (user === null || !user.role) {
      router.push("/onboarding");
    } else {
      router.push(`/${user.role}`);
    }
  }, [user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-muted-foreground">Redirecting...</p>
    </div>
  );
}

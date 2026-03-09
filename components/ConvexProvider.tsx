"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, useMemo } from "react";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

function isConvexConfigured(val: string | undefined): val is string {
  return !!val && !val.startsWith("YOUR_");
}

const clerkProps = {
  signInUrl: "/sign-in",
  signUpUrl: "/sign-up",
  signInFallbackRedirectUrl: "/portal-redirect",
  signUpFallbackRedirectUrl: "/portal-redirect",
  afterSignOutUrl: "/",
} as const;

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => {
    if (!isConvexConfigured(CONVEX_URL)) return null;
    return new ConvexReactClient(CONVEX_URL);
  }, []);

  // No Convex configured — Clerk-only (keyless mode works without env vars)
  if (!client) {
    return <ClerkProvider {...clerkProps}>{children}</ClerkProvider>;
  }

  // Both Convex and Clerk — full stack
  return (
    <ClerkProvider {...clerkProps}>
      <ConvexProviderWithClerk client={client} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

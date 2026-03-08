"use client";

import { TourProvider } from "@/components/ui/tour";
import { tours } from "@/lib/tours";

export function TourWrapper({ children }: { children: React.ReactNode }) {
  return <TourProvider tours={tours}>{children}</TourProvider>;
}

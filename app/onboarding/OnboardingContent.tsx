"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Home, Briefcase, Building2, GraduationCap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const portals: {
  role: "resident" | "business" | "citystaff" | "researcher";
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}[] = [
  {
    role: "resident",
    label: "Resident",
    description: "Neighborhood safety, city services, sanitation schedules",
    icon: Home,
    color: "text-portal-resident",
    bgColor: "bg-portal-resident/10 hover:bg-portal-resident/20",
  },
  {
    role: "business",
    label: "Business",
    description: "Permits, licenses, zoning, and business compliance",
    icon: Briefcase,
    color: "text-portal-business",
    bgColor: "bg-portal-business/10 hover:bg-portal-business/20",
  },
  {
    role: "citystaff",
    label: "City Staff",
    description: "Infrastructure, budgets, and internal operations",
    icon: Building2,
    color: "text-portal-citystaff",
    bgColor: "bg-portal-citystaff/10 hover:bg-portal-citystaff/20",
  },
  {
    role: "researcher",
    label: "Researcher",
    description: "Crime trends, demographics, and public data analysis",
    icon: GraduationCap,
    color: "text-portal-researcher",
    bgColor: "bg-portal-researcher/10 hover:bg-portal-researcher/20",
  },
];

export default function OnboardingContent() {
  const router = useRouter();
  const setRole = useMutation(api.users.setUserRole);

  async function handleSelect(
    role: "resident" | "business" | "citystaff" | "researcher",
  ) {
    await setRole({ role });
    router.push(`/${role}`);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome to Montgomery Civic Hub
        </h1>
        <p className="mt-2 text-muted-foreground">
          Choose your primary portal to get started. You can switch anytime.
        </p>
      </div>

      <div className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        {portals.map((portal) => (
          <button
            key={portal.role}
            onClick={() => handleSelect(portal.role)}
            className={`flex flex-col items-center gap-3 rounded-xl border p-6 transition-colors ${portal.bgColor}`}
          >
            <div
              className={`flex size-12 items-center justify-center rounded-lg ${portal.color}`}
            >
              <portal.icon className="size-6" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold">{portal.label}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {portal.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

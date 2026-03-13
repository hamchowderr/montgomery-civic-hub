"use client";

import { UserProfile } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GraduationCap, Home } from "@/components/icons";
import { Briefcase, Building2 } from "lucide-react";

const portalOptions = [
  { role: "resident" as const, label: "Resident", icon: Home },
  { role: "business" as const, label: "Business", icon: Briefcase },
  { role: "citystaff" as const, label: "City Staff", icon: Building2 },
  { role: "researcher" as const, label: "Researcher", icon: GraduationCap },
];

export default function ProfileContent() {
  const router = useRouter();
  const user = useQuery(api.users.getCurrentUser);
  const setRole = useMutation(api.users.setUserRole);

  async function handleRoleSwitch(
    role: "resident" | "business" | "citystaff" | "researcher",
  ) {
    await setRole({ role });
    router.push(`/${role}`);
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back
        </Button>

        {/* Role switcher */}
        <div className="mb-8 rounded-lg border p-6">
          <h2 className="mb-3 text-lg font-semibold">Your Portal</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Your current default portal is{" "}
            <strong className="capitalize">{user?.role ?? "not set"}</strong>.
            Switch anytime:
          </p>
          <div className="flex flex-wrap gap-2">
            {portalOptions.map((opt) => (
              <Button
                key={opt.role}
                variant={user?.role === opt.role ? "default" : "outline"}
                size="sm"
                onClick={() => handleRoleSwitch(opt.role)}
              >
                <opt.icon className="mr-1 size-3.5" />
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Clerk profile */}
        <UserProfile
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-none border",
            },
          }}
        />
      </div>
    </div>
  );
}

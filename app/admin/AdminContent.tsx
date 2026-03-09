"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ConvexDashboard } from "@/components/ConvexDashboard";
import { Button } from "@/components/ui/button";
import { Database, Users, Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const ADMIN_EMAILS = [process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? ""];

const CONVEX_DEPLOY_KEY = process.env.NEXT_PUBLIC_CONVEX_DEPLOY_KEY ?? "";
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL ?? "";
const CONVEX_DEPLOYMENT = process.env.NEXT_PUBLIC_CONVEX_DEPLOYMENT ?? "";

type Tab = "data" | "functions" | "logs";

const tabs: { id: Tab; label: string; icon: typeof Database }[] = [
  { id: "data", label: "Data", icon: Database },
  { id: "functions", label: "Functions", icon: Shield },
  { id: "logs", label: "Logs", icon: Users },
];

export default function AdminContent() {
  const { isSignedIn, isLoaded } = useAuth();
  const user = useQuery(api.users.getCurrentUser);
  const [activeTab, setActiveTab] = useState<Tab>("data");

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">
          You must be signed in to access admin.
        </p>
      </div>
    );
  }

  if (user === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user || !ADMIN_EMAILS.includes(user.email)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Shield className="mx-auto mb-4 size-12 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Access Denied</h1>
          <p className="mt-2 text-muted-foreground">
            You do not have admin privileges.
          </p>
          <Link href="/" className="mt-4 inline-block">
            <Button variant="outline">
              <ArrowLeft className="mr-2 size-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const deploymentName = CONVEX_DEPLOYMENT.replace(/^prod:/, "");

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Admin Dashboard</h1>
        </div>
        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "gap-1.5",
                activeTab !== tab.id && "text-muted-foreground",
              )}
            >
              <tab.icon className="size-3.5" />
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {CONVEX_DEPLOY_KEY ? (
          <ConvexDashboard
            deployKey={CONVEX_DEPLOY_KEY}
            deploymentUrl={CONVEX_URL}
            deploymentName={deploymentName}
            initialPage={activeTab}
            visiblePages={["data", "functions", "logs", "health", "schedules"]}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Database className="mx-auto mb-4 size-12 text-muted-foreground" />
              <h2 className="text-lg font-semibold">
                Convex Dashboard Not Configured
              </h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Set <code>NEXT_PUBLIC_CONVEX_DEPLOY_KEY</code> in your
                environment to enable the embedded Convex dashboard.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

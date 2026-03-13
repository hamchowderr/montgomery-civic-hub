"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { Database, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type React from "react";
import { useState } from "react";
import { ConvexDashboard } from "@/components/ConvexDashboard";
import { ArrowLeft, Shield, Users } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";

const ADMIN_EMAILS = [process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? ""];

const CONVEX_DEPLOY_KEY = process.env.NEXT_PUBLIC_CONVEX_DEPLOY_KEY ?? "";
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL ?? "";
const CONVEX_DEPLOYMENT = process.env.NEXT_PUBLIC_CONVEX_DEPLOYMENT ?? "";

type Tab = "users" | "data";

const tabs: {
  id: Tab;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}[] = [
  { id: "users", label: "Users", icon: Users },
  { id: "data", label: "Database", icon: Database },
];

function UsersPanel() {
  const allUsers = useQuery(api.users.listAllUsers);

  if (allUsers === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading users...</p>
      </div>
    );
  }

  const sorted = [...allUsers].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="h-full overflow-auto p-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {allUsers.length} registered user{allUsers.length !== 1 && "s"}
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">User</th>
                <th className="px-4 py-3 text-left font-medium">Email</th>
                <th className="px-4 py-3 text-left font-medium">Portal</th>
                <th className="px-4 py-3 text-left font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((u) => (
                <tr key={u._id} className="border-b last:border-b-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {u.imageUrl ? (
                        <Image
                          src={u.imageUrl}
                          alt=""
                          width={28}
                          height={28}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-medium">
                          {(u.name ?? u.email)?.[0]?.toUpperCase() ?? "?"}
                        </div>
                      )}
                      <span className="font-medium">{u.name ?? "No name"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    {u.role ? (
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium capitalize text-primary">
                        {u.role}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not set</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    No users yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DatabasePanel() {
  const deploymentName = CONVEX_DEPLOYMENT.replace(/^prod:/, "");

  if (CONVEX_DEPLOY_KEY) {
    return (
      <ConvexDashboard
        deployKey={CONVEX_DEPLOY_KEY}
        deploymentUrl={CONVEX_URL}
        deploymentName={deploymentName}
        initialPage="data"
        visiblePages={["data", "functions", "logs", "health", "schedules"]}
      />
    );
  }

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <Database className="mx-auto mb-4 size-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Local Development</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          The embedded dashboard requires a production deploy key. Use the Convex dashboard directly
          for local development.
        </p>
        <a
          href="https://dashboard.convex.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block"
        >
          <Button variant="outline" className="gap-2">
            <ExternalLink className="size-4" />
            Open Convex Dashboard
          </Button>
        </a>
      </div>
    </div>
  );
}

export default function AdminContent() {
  const { isSignedIn, isLoaded } = useAuth();
  const user = useQuery(api.users.getCurrentUser);
  const [activeTab, setActiveTab] = useState<Tab>("users");

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">You must be signed in to access admin.</p>
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
          <Shield size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Access Denied</h1>
          <p className="mt-2 text-muted-foreground">You do not have admin privileges.</p>
          <Link href="/" className="mt-4 inline-block">
            <Button variant="outline">
              <ArrowLeft size={16} className="mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={16} />
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
              className={cn("gap-1.5", activeTab !== tab.id && "text-muted-foreground")}
            >
              <tab.icon size={14} />
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">{activeTab === "users" ? <UsersPanel /> : <DatabasePanel />}</div>
    </div>
  );
}

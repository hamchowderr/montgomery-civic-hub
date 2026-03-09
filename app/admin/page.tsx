"use client";

import dynamic from "next/dynamic";

const AdminContent = dynamic(() => import("./AdminContent"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-muted-foreground">Loading admin...</p>
    </div>
  ),
});

export default function AdminPage() {
  return <AdminContent />;
}

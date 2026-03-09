"use client";

import dynamic from "next/dynamic";

const ProfileContent = dynamic(() => import("./ProfileContent"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-muted-foreground">Loading profile...</p>
    </div>
  ),
});

export default function ProfilePage() {
  return <ProfileContent />;
}

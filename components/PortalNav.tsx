"use client";

import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { Briefcase, Building2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { GraduationCap, HelpCircle, Home, Moon, Settings, Sun } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useTour } from "@/components/ui/tour";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";

const ADMIN_EMAILS = [process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? ""];

const portals = [
  {
    href: "/resident",
    label: "Resident",
    icon: Home,
    color: "bg-portal-resident",
  },
  {
    href: "/business",
    label: "Business",
    icon: Briefcase,
    color: "bg-portal-business",
  },
  {
    href: "/citystaff",
    label: "City Staff",
    icon: Building2,
    color: "bg-portal-citystaff",
  },
  {
    href: "/researcher",
    label: "Researcher",
    icon: GraduationCap,
    color: "bg-portal-researcher",
  },
];

export function PortalNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { isSignedIn } = useAuth();
  const { start } = useTour();
  const user = useQuery(api.users.getCurrentUser);
  const isAdmin = user && ADMIN_EMAILS.includes(user.email);

  const portalSlug = pathname.split("/")[1]; // "resident", "business", etc.
  const tourId = portalSlug ? `${portalSlug}-tour` : null;

  return (
    <nav
      className="flex min-w-0 items-center justify-between border-b bg-card/80 px-4 py-2 backdrop-blur-sm"
      data-tour-step-id={portalSlug ? `${portalSlug}-welcome` : undefined}
    >
      {/* Mobile home link */}
      <Link href="/" className="mr-2 flex items-center sm:hidden">
        <Image
          src="/montgomery-seal.png"
          alt="Montgomery Civic Hub"
          width={32}
          height={32}
          sizes="32px"
          className="rounded-md"
        />
      </Link>
      {/* Logo / Home link */}
      <Link href="/" className="mr-4 hidden items-center gap-2 sm:flex">
        <Image
          src="/montgomery-seal.png"
          alt="Montgomery Civic Hub"
          width={28}
          height={28}
          sizes="28px"
          className="rounded-md"
        />
      </Link>

      {/* Portal tabs */}
      <div
        className="flex min-w-0 items-center gap-0.5"
        data-tour-step-id={portalSlug ? `${portalSlug}-portal-nav` : undefined}
      >
        {portals.map((portal) => {
          const isActive = pathname.startsWith(portal.href);
          return (
            <Link key={portal.href} href={portal.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "gap-1.5 text-sm min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0",
                  isActive && "pointer-events-none",
                  !isActive && "text-muted-foreground hover:text-foreground",
                )}
              >
                <portal.icon size={14} />
                <span className="hidden sm:inline">{portal.label}</span>
              </Button>
            </Link>
          );
        })}
      </div>

      {/* Right side: admin + theme toggle + auth */}
      <div className="ml-auto flex items-center gap-1">
        {isAdmin && (
          <Link href="/admin">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Admin Dashboard"
              className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 text-muted-foreground hover:text-foreground"
            >
              <Settings size={16} />
            </Button>
          </Link>
        )}

        {tourId && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => start(tourId)}
            aria-label="Take a tour"
            className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 text-muted-foreground hover:text-foreground"
          >
            <HelpCircle size={16} />
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
          className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 text-muted-foreground hover:text-foreground"
        >
          <Sun
            size={16}
            className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
          />
          <Moon
            size={16}
            className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
          />
        </Button>

        {isSignedIn ? (
          <UserButton
            appearance={{
              elements: { avatarBox: "size-7" },
            }}
          />
        ) : (
          <SignInButton mode="redirect">
            <Button variant="outline" size="sm">
              Sign In
            </Button>
          </SignInButton>
        )}
      </div>
    </nav>
  );
}

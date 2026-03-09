"use client";

import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import { Briefcase, Building2, GraduationCap, Home, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

  return (
    <nav className="flex items-center justify-between border-b bg-card/80 px-4 py-2 backdrop-blur-sm">
      {/* Logo / Home link */}
      <Link href="/" className="mr-4 hidden items-center gap-2 sm:flex">
        <div className="flex size-7 items-center justify-center rounded-md bg-accent">
          <span className="text-xs font-bold text-accent-foreground">MCH</span>
        </div>
      </Link>

      {/* Portal tabs */}
      <div className="flex items-center gap-0.5">
        {portals.map((portal) => {
          const isActive = pathname.startsWith(portal.href);
          return (
            <Link key={portal.href} href={portal.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "gap-1.5 text-sm",
                  isActive && "pointer-events-none",
                  !isActive && "text-muted-foreground hover:text-foreground",
                )}
              >
                <portal.icon className="size-3.5" />
                <span className="hidden sm:inline">{portal.label}</span>
              </Button>
            </Link>
          );
        })}
      </div>

      {/* Right side: theme toggle + auth */}
      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
          className="text-muted-foreground hover:text-foreground"
        >
          <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
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

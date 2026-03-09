"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Sun,
  Moon,
  Home,
  Briefcase,
  Building2,
  GraduationCap,
} from "lucide-react";
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
  const { theme, setTheme } = useTheme();

  return (
    <nav className="flex min-w-0 items-center justify-between border-b bg-card/80 px-4 py-2 backdrop-blur-sm">
      {/* Mobile home link */}
      <Link href="/" className="mr-2 flex items-center sm:hidden">
        <div className="flex size-8 items-center justify-center rounded-md bg-accent">
          <span className="text-xs font-bold text-accent-foreground">M</span>
        </div>
      </Link>
      {/* Logo / Home link */}
      <Link href="/" className="mr-4 hidden items-center gap-2 sm:flex">
        <div className="flex size-7 items-center justify-center rounded-md bg-accent">
          <span className="text-xs font-bold text-accent-foreground">MCH</span>
        </div>
      </Link>

      {/* Portal tabs */}
      <div className="flex min-w-0 items-center gap-0.5">
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
                <portal.icon className="size-3.5" />
                <span className="hidden sm:inline">{portal.label}</span>
              </Button>
            </Link>
          );
        })}
      </div>

      {/* Theme toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        aria-label="Toggle theme"
        className="ml-auto min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 text-muted-foreground hover:text-foreground"
      >
        <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </Button>
    </nav>
  );
}

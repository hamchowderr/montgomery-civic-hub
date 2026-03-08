"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const portals = [
  { href: "/resident", label: "Resident" },
  { href: "/business", label: "Business" },
  { href: "/citystaff", label: "City Staff" },
  { href: "/researcher", label: "Researcher" },
];

export function PortalNav() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  return (
    <nav className="flex items-center justify-between border-b bg-background px-4 py-2">
      <div className="flex items-center gap-1">
        {portals.map((portal) => (
          <Link key={portal.href} href={portal.href}>
            <Button
              variant={pathname.startsWith(portal.href) ? "default" : "ghost"}
              size="sm"
              className={cn(
                "text-sm",
                pathname.startsWith(portal.href) && "pointer-events-none",
              )}
            >
              {portal.label}
            </Button>
          </Link>
        ))}
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        aria-label="Toggle theme"
      >
        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </Button>
    </nav>
  );
}

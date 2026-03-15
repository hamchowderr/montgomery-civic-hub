"use client";

import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import {
  BarChart3,
  Briefcase,
  Building2,
  ChevronDown,
  Gauge,
  Landmark,
  Menu,
  Newspaper,
  Phone,
  Radio,
  Scale,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useState } from "react";
import { GraduationCap, HelpCircle, Home, Moon, Settings, Sun } from "@/components/icons";
import {
  PresetSelector,
  ResetThemeButton,
  ThemeRadiusSelector,
  ThemeScaleSelector,
} from "@/components/theme-customizer/index";
import { ThemeCustomizerPanel } from "@/components/theme-customizer/panel";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator as UISeparator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
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
    subPages: [
      { href: "/resident/emergency", label: "Emergency", icon: Phone },
      { href: "/resident/newsfeed", label: "Incidents", icon: Radio },
      { href: "/resident/city-pulse", label: "City Pulse", icon: Newspaper },
    ],
  },
  {
    href: "/business",
    label: "Business",
    icon: Briefcase,
    color: "bg-portal-business",
    subPages: [{ href: "/business/vacant-land", label: "Vacant Land", icon: Building2 }],
  },
  {
    href: "/citystaff",
    label: "City Staff",
    icon: Building2,
    color: "bg-portal-citystaff",
    subPages: [{ href: "/citystaff/staffing", label: "Staffing", icon: Users }],
  },
  {
    href: "/researcher",
    label: "Researcher",
    icon: GraduationCap,
    color: "bg-portal-researcher",
    subPages: [
      { href: "/researcher/civil-rights", label: "Civil Rights", icon: Landmark },
      { href: "/researcher/demographics", label: "Demographics", icon: BarChart3 },
    ],
  },
];

const dashboards = [
  {
    href: "/executive",
    label: "Executive",
    icon: Gauge,
    color: "bg-primary",
  },
  {
    href: "/insights",
    label: "Insights",
    icon: Scale,
    color: "bg-primary",
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const portalSlug = pathname.split("/")[1]; // "resident", "business", etc.
  const subPage = pathname.split("/")[2]; // "emergency", "newsfeed", etc.
  const tourId = portalSlug
    ? subPage
      ? `${portalSlug}-${subPage}-tour`
      : `${portalSlug}-tour`
    : null;

  return (
    <nav
      className="flex min-w-0 items-center justify-between border-b bg-card/80 px-3 py-2 backdrop-blur-sm sm:px-4"
      data-tour-step-id={portalSlug ? `${portalSlug}-welcome` : undefined}
    >
      {/* Logo */}
      <Link href="/" className="mr-2 flex shrink-0 items-center gap-2">
        <Image
          src="/montgomery-seal.png"
          alt="Montgomery Civic Hub"
          width={28}
          height={28}
          sizes="28px"
          className="rounded-md"
        />
      </Link>

      {/* Portal tabs — show on all sizes but compact on mobile */}
      <div
        className="flex min-w-0 items-center gap-0.5"
        data-tour-step-id={portalSlug ? `${portalSlug}-portal-nav` : undefined}
      >
        {portals.map((portal) => {
          const isActive = pathname.startsWith(portal.href);
          const hasSubPages = portal.subPages.length > 0;

          const portalButton = (
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "relative gap-1.5 text-sm min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0",
                isActive &&
                  "text-foreground font-medium bg-[hsl(var(--portal-hue)/0.1)] hover:bg-[hsl(var(--portal-hue)/0.15)] after:absolute after:bottom-0 after:inset-x-1 after:h-0.5 after:rounded-full after:bg-[hsl(var(--portal-hue))]",
                !isActive && "text-muted-foreground hover:text-foreground",
              )}
              style={
                isActive
                  ? ({
                      "--portal-hue": `var(--portal-${portal.href.slice(1)})`,
                    } as React.CSSProperties)
                  : undefined
              }
            >
              <portal.icon size={14} />
              <span className="hidden sm:inline">{portal.label}</span>
              {hasSubPages && isActive && (
                <ChevronDown size={12} className="hidden sm:inline text-muted-foreground" />
              )}
            </Button>
          );

          // Active portal with sub-pages: click dropdown
          if (hasSubPages && isActive) {
            return (
              <DropdownMenu key={portal.href}>
                <DropdownMenuTrigger asChild className="hidden sm:inline-flex">
                  {portalButton}
                </DropdownMenuTrigger>
                {/* Mobile: just show the button without dropdown (mobile sheet handles nav) */}
                <div className="sm:hidden">
                  <Link href={portal.href} aria-current="page">
                    {portalButton}
                  </Link>
                </div>
                <DropdownMenuContent align="start" className="min-w-[160px]">
                  {portal.subPages.map((sub) => {
                    const isSubActive = pathname === sub.href;
                    return (
                      <DropdownMenuItem
                        key={sub.href}
                        className={cn("gap-2", isSubActive && "bg-muted font-medium")}
                        onClick={() => router.push(sub.href)}
                      >
                        <sub.icon
                          size={14}
                          className={isSubActive ? "text-foreground" : "text-muted-foreground"}
                        />
                        {sub.label}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          }

          // Non-active portal or no sub-pages: plain link
          return (
            <Link key={portal.href} href={portal.href} aria-current={isActive ? "page" : undefined}>
              {portalButton}
            </Link>
          );
        })}

        {/* Divider + dashboards — hidden on mobile, shown on sm+ */}
        <div className="hidden sm:flex sm:items-center sm:gap-0.5">
          <div className="mx-1.5 h-5 w-px bg-border" />
          {dashboards.map((dash) => {
            const isActive = pathname.startsWith(dash.href);
            return (
              <Link key={dash.href} href={dash.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "gap-1.5 text-sm sm:min-h-0 sm:min-w-0",
                    isActive && "pointer-events-none",
                    !isActive && "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <dash.icon size={14} />
                  <span className="hidden sm:inline">{dash.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Right side — desktop: full controls, mobile: hamburger + auth */}
      <div className="ml-auto flex items-center gap-1">
        {/* Desktop-only controls */}
        <div className="hidden sm:flex sm:items-center sm:gap-1">
          {isAdmin && (
            <Link href="/admin">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Admin Dashboard"
                className="text-muted-foreground hover:text-foreground"
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
              className="text-muted-foreground hover:text-foreground"
            >
              <HelpCircle size={16} />
            </Button>
          )}

          <ThemeCustomizerPanel />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            className="text-muted-foreground hover:text-foreground"
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
        </div>

        {/* Auth — always visible */}
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

        {/* Mobile hamburger menu */}
        <Button
          variant="ghost"
          size="icon"
          className="min-h-[44px] min-w-[44px] sm:hidden text-muted-foreground hover:text-foreground"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </Button>

        {/* Mobile sidebar sheet */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="right" className="w-72 p-0">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center gap-2 border-b px-4 py-3">
                <Image
                  src="/montgomery-seal.png"
                  alt="Montgomery Civic Hub"
                  width={24}
                  height={24}
                  sizes="24px"
                  className="rounded-md"
                />
                <span className="text-sm font-semibold">Montgomery Civic Hub</span>
              </div>

              {/* Navigation links */}
              <div className="flex-1 overflow-y-auto">
                {/* Portals section with collapsible sub-pages */}
                <div className="px-4 pt-4 pb-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Portals
                  </p>
                  {portals.map((portal) => {
                    const isActive = pathname.startsWith(portal.href);
                    return (
                      <Collapsible key={portal.href} defaultOpen={isActive}>
                        <CollapsibleTrigger
                          aria-label={`${portal.label} sub-pages`}
                          className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-muted"
                        >
                          <div className="flex items-center gap-3">
                            <portal.icon
                              size={16}
                              className={isActive ? "text-foreground" : "text-muted-foreground"}
                            />
                            <span className={isActive ? "font-medium" : "text-muted-foreground"}>
                              {portal.label}
                            </span>
                          </div>
                          <ChevronDown
                            size={14}
                            className="text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180"
                          />
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="ml-7 border-l pl-3 py-1">
                            {portal.subPages.map((sub) => (
                              <Link
                                key={sub.href}
                                href={sub.href}
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                <div
                                  className={cn(
                                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                                    pathname === sub.href
                                      ? "bg-accent text-accent-foreground font-medium"
                                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                  )}
                                >
                                  <sub.icon size={14} />
                                  {sub.label}
                                </div>
                              </Link>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </div>

                <UISeparator className="my-2" />

                {/* Dashboards section */}
                <div className="px-4 pt-4 pb-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Dashboards
                  </p>
                  {dashboards.map((dash) => {
                    const isActive = pathname.startsWith(dash.href);
                    return (
                      <Link
                        key={dash.href}
                        href={dash.href}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                            isActive
                              ? "bg-accent text-accent-foreground font-medium"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground",
                          )}
                        >
                          <dash.icon size={16} />
                          {dash.label}
                        </div>
                      </Link>
                    );
                  })}
                </div>

                <UISeparator className="my-2" />

                {/* Admin link */}
                {isAdmin && (
                  <>
                    <div className="px-4 py-2">
                      <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                        <div className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                          <Settings size={16} />
                          Admin Dashboard
                        </div>
                      </Link>
                    </div>
                    <UISeparator className="my-2" />
                  </>
                )}

                {/* Settings section */}
                <div className="px-4 pt-2 pb-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Settings
                  </p>

                  {/* Tour button */}
                  {tourId && (
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        start(tourId);
                      }}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <HelpCircle size={16} />
                      Take a Tour
                    </button>
                  )}

                  {/* Dark mode toggle */}
                  <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                    {theme === "dark" ? "Light Mode" : "Dark Mode"}
                  </button>
                </div>

                <UISeparator className="my-2" />

                {/* Theme customizer inline */}
                <div className="px-4 pt-2 pb-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    Theme
                  </p>
                  <div className="space-y-3">
                    <PresetSelector />
                    <UISeparator />
                    <ThemeRadiusSelector />
                    <UISeparator />
                    <ThemeScaleSelector />
                    <UISeparator />
                    <ResetThemeButton />
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}

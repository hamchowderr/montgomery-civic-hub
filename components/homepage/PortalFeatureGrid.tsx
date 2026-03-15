"use client";

import { Briefcase, Building2, Check, Minus, Zap } from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";
import { FadeInWhenVisible, SectionAccent } from "@/components/homepage/shared";
import { ArrowRight, GraduationCap, Home } from "@/components/icons";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IconComponent = ComponentType<any>;

interface PortalDef {
  id: string;
  name: string;
  icp: string;
  icon: IconComponent;
  href: string;
  color: { text: string; bg: string; bgLight: string };
}

type FeatureValue = true | false | string;

interface FeatureRow {
  category: string;
  feature: string;
  description: string;
  resident: FeatureValue;
  business: FeatureValue;
  citystaff: FeatureValue;
  researcher: FeatureValue;
}

/* ═══════════════════════════════════════════════════════
   Data
   ═══════════════════════════════════════════════════════ */

const portals: PortalDef[] = [
  {
    id: "resident",
    name: "Resident",
    icp: "Citizens & Homeowners",
    icon: Home,
    href: "/resident",
    color: {
      text: "text-portal-resident",
      bg: "bg-portal-resident",
      bgLight: "bg-portal-resident/10",
    },
  },
  {
    id: "business",
    name: "Business",
    icp: "Owners & Developers",
    icon: Briefcase,
    href: "/business",
    color: {
      text: "text-portal-business",
      bg: "bg-portal-business",
      bgLight: "bg-portal-business/10",
    },
  },
  {
    id: "citystaff",
    name: "City Staff",
    icp: "Government Officials",
    icon: Building2,
    href: "/citystaff",
    color: {
      text: "text-portal-citystaff",
      bg: "bg-portal-citystaff",
      bgLight: "bg-portal-citystaff/10",
    },
  },
  {
    id: "researcher",
    name: "Researcher",
    icp: "Academics & Analysts",
    icon: GraduationCap,
    href: "/researcher",
    color: {
      text: "text-portal-researcher",
      bg: "bg-portal-researcher",
      bgLight: "bg-portal-researcher/10",
    },
  },
];

const features: FeatureRow[] = [
  // Interactive Maps
  {
    category: "Interactive Maps",
    feature: "Neighborhood Map",
    description: "311 service requests plotted by location and status",
    resident: true,
    business: false,
    citystaff: false,
    researcher: false,
  },
  {
    category: "Interactive Maps",
    feature: "Permit & License Map",
    description: "Active permits, zoning overlays, and business locations",
    resident: false,
    business: true,
    citystaff: false,
    researcher: false,
  },
  {
    category: "Interactive Maps",
    feature: "Infrastructure Map",
    description: "Code violations, facilities, and city assets",
    resident: false,
    business: false,
    citystaff: true,
    researcher: false,
  },
  {
    category: "Interactive Maps",
    feature: "Multi-Layer Spatial Analysis",
    description: "Overlay crime, demographics, and service data on one map",
    resident: false,
    business: false,
    citystaff: false,
    researcher: true,
  },
  // AI Assistant
  {
    category: "AI Assistant",
    feature: "Natural Language Queries",
    description: "Ask questions in plain English, get data-backed answers",
    resident: true,
    business: true,
    citystaff: true,
    researcher: true,
  },
  {
    category: "AI Assistant",
    feature: "Source Citations",
    description: "Every answer links back to the official dataset it came from",
    resident: true,
    business: true,
    citystaff: true,
    researcher: true,
  },
  {
    category: "AI Assistant",
    feature: "Executive Briefing Generator",
    description: "AI-written staff reports and council briefing summaries",
    resident: false,
    business: false,
    citystaff: true,
    researcher: false,
  },
  {
    category: "AI Assistant",
    feature: "Research Methodology Notes",
    description: "Auto-generated methodology and reproducibility documentation",
    resident: false,
    business: false,
    citystaff: false,
    researcher: true,
  },
  // Data & Analytics
  {
    category: "Data & Analytics",
    feature: "Service Request Tracking",
    description: "Browse, filter, and track 311 requests by type and district",
    resident: true,
    business: false,
    citystaff: true,
    researcher: true,
  },
  {
    category: "Data & Analytics",
    feature: "Permit Database",
    description: "Search active permits by address, type, and value",
    resident: false,
    business: true,
    citystaff: true,
    researcher: true,
  },
  {
    category: "Data & Analytics",
    feature: "Real-Time KPI Dashboard",
    description: "Live metrics on response times, compliance, and budget",
    resident: false,
    business: false,
    citystaff: true,
    researcher: false,
  },
  {
    category: "Data & Analytics",
    feature: "Cross-Dataset Analysis",
    description: "Correlate trends across 40+ city datasets with statistical tools",
    resident: false,
    business: false,
    citystaff: false,
    researcher: true,
  },
  // Export & Sharing
  {
    category: "Export & Sharing",
    feature: "PDF Reports",
    description: "Download formatted reports for meetings or records",
    resident: false,
    business: true,
    citystaff: true,
    researcher: true,
  },
  {
    category: "Export & Sharing",
    feature: "CSV / GeoJSON Export",
    description: "Raw data export for external analysis tools",
    resident: false,
    business: false,
    citystaff: true,
    researcher: true,
  },
  {
    category: "Export & Sharing",
    feature: "Trend Charts",
    description: "Visualize volume changes and patterns over time",
    resident: true,
    business: true,
    citystaff: true,
    researcher: true,
  },
];

/* ═══════════════════════════════════════════════════════
   Cell renderer
   ═══════════════════════════════════════════════════════ */

function FeatureCell({ value, portalColor }: { value: FeatureValue; portalColor: string }) {
  if (value === true) {
    return (
      <div
        className={cn(
          "mx-auto flex h-6 w-6 items-center justify-center rounded-full",
          portalColor.replace("text-", "bg-") + "/15",
        )}
      >
        <Check className={cn("h-3.5 w-3.5", portalColor)} strokeWidth={3} />
      </div>
    );
  }
  if (value === false) {
    return (
      <div className="mx-auto flex h-6 w-6 items-center justify-center">
        <Minus className="h-3.5 w-3.5 text-muted-foreground/30" strokeWidth={2} />
      </div>
    );
  }
  return <span className={cn("text-xs font-medium", portalColor)}>{value}</span>;
}

/* ═══════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════ */

export function PortalFeatureGrid() {
  const categories = [...new Set(features.map((f) => f.category))];

  return (
    <section className="bg-background py-24">
      <div className="mx-auto max-w-6xl px-4">
        <FadeInWhenVisible className="text-center">
          <p className="mb-3 flex items-center justify-center gap-1.5 text-sm font-medium uppercase tracking-wider text-accent">
            <Zap className="h-4 w-4" />
            Compare Portals
          </p>
          <h2 className="font-display text-fluid-3xl font-bold tracking-tight">
            Every portal, at a glance.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Four portals, each tailored to a different audience. See exactly what each one offers.
          </p>
          <SectionAccent className="mt-4" />
        </FadeInWhenVisible>

        {/* Comparison Table — desktop */}
        <FadeInWhenVisible delay={0.1}>
          <div className="mt-12 hidden md:block overflow-x-auto rounded-xl border bg-card">
            <table className="w-full">
              {/* Portal headers */}
              <thead>
                <tr className="border-b">
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground w-[280px]">
                    Features
                  </th>
                  {portals.map((portal) => (
                    <th key={portal.id} className="p-4 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className={cn(
                            "grid h-10 w-10 place-items-center rounded-lg",
                            portal.color.bgLight,
                            portal.color.text,
                          )}
                        >
                          <portal.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{portal.name}</div>
                          <div className="text-[11px] text-muted-foreground">{portal.icp}</div>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {categories.map((category) => {
                  const categoryFeatures = features.filter((f) => f.category === category);
                  return (
                    <CategoryGroup key={category} category={category} features={categoryFeatures} />
                  );
                })}
              </tbody>

              {/* CTA row */}
              <tfoot>
                <tr className="border-t bg-muted/30">
                  <td className="p-4" />
                  {portals.map((portal) => (
                    <td key={portal.id} className="p-4 text-center">
                      <Link
                        href={portal.href}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors",
                          portal.color.bg,
                          "text-white hover:opacity-90",
                        )}
                      >
                        Enter Portal
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </FadeInWhenVisible>

        {/* Mobile card layout */}
        <div className="mt-12 grid grid-cols-1 gap-4 md:hidden">
          {portals.map((portal) => {
            const portalFeatures = features.filter(
              (f) =>
                f[
                  portal.id as keyof Pick<
                    FeatureRow,
                    "resident" | "business" | "citystaff" | "researcher"
                  >
                ] === true,
            );
            return (
              <FadeInWhenVisible key={portal.id} delay={0.05}>
                <div className="rounded-xl border bg-card overflow-hidden">
                  {/* Portal header */}
                  <div className="flex items-center gap-3 border-b px-4 py-3">
                    <div
                      className={cn(
                        "grid h-9 w-9 place-items-center rounded-lg",
                        portal.color.bgLight,
                        portal.color.text,
                      )}
                    >
                      <portal.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{portal.name}</div>
                      <div className="text-[11px] text-muted-foreground">{portal.icp}</div>
                    </div>
                    <Link
                      href={portal.href}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                        portal.color.bg,
                        "text-white hover:opacity-90",
                      )}
                    >
                      Enter
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                  {/* Feature list */}
                  <div className="px-4 py-3">
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                      {portalFeatures.map((f) => (
                        <div key={f.feature} className="flex items-center gap-1.5">
                          <Check
                            className={cn("h-3 w-3 shrink-0", portal.color.text)}
                            strokeWidth={3}
                          />
                          <span className="text-xs text-muted-foreground">{f.feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </FadeInWhenVisible>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   Category Group
   ═══════════════════════════════════════════════════════ */

function CategoryGroup({
  category,
  features: categoryFeatures,
}: {
  category: string;
  features: FeatureRow[];
}) {
  return (
    <>
      {/* Category header */}
      <tr className="border-t bg-muted/40">
        <td colSpan={5} className="px-4 py-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {category}
          </span>
        </td>
      </tr>

      {/* Feature rows */}
      {categoryFeatures.map((feature, i) => (
        <tr
          key={feature.feature}
          className={cn(
            "border-t border-border/50 transition-colors hover:bg-muted/20",
            i === categoryFeatures.length - 1 && "border-b-0",
          )}
        >
          <td className="px-4 py-3">
            <div className="text-sm font-medium">{feature.feature}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{feature.description}</div>
          </td>
          {portals.map((portal) => (
            <td key={portal.id} className="px-4 py-3 text-center">
              <FeatureCell
                value={
                  feature[
                    portal.id as keyof Pick<
                      FeatureRow,
                      "resident" | "business" | "citystaff" | "researcher"
                    >
                  ]
                }
                portalColor={portal.color.text}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

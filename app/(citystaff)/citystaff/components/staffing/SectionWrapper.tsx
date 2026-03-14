"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface SectionWrapperProps {
  icon: React.ReactNode;
  title: string;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function SectionWrapper({
  icon,
  title,
  badge,
  badgeVariant = "secondary",
  defaultOpen = false,
  children,
}: SectionWrapperProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-lg border bg-card px-4 py-3 text-left transition-colors hover:bg-muted/50"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
            {icon}
          </span>
          <span className="flex-1 text-sm font-semibold">{title}</span>
          {badge && (
            <Badge variant={badgeVariant} className="text-[10px] px-1.5 py-0">
              {badge}
            </Badge>
          )}
          {open ? (
            <ChevronDown className="size-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 text-muted-foreground" />
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pt-3">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

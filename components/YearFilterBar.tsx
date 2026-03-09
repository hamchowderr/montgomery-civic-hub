"use client";

import { useYearFilter } from "@/lib/contexts/year-filter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarRange } from "lucide-react";

export function YearFilterBar() {
  const { yearRange, setFrom, setTo, yearOptions } = useYearFilter();

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-2.5">
      <CalendarRange className="size-4 shrink-0 text-accent" />
      <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Filter
      </span>
      <div className="h-4 w-px bg-border" />
      <Select
        value={String(yearRange.from)}
        onValueChange={(v) => setFrom(Number(v))}
      >
        <SelectTrigger className="h-8 w-[90px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {yearOptions.map((y) => (
            <SelectItem key={y} value={String(y)} disabled={y > yearRange.to}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-sm text-muted-foreground">to</span>
      <Select
        value={String(yearRange.to)}
        onValueChange={(v) => setTo(Number(v))}
      >
        <SelectTrigger className="h-8 w-[90px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {yearOptions.map((y) => (
            <SelectItem key={y} value={String(y)} disabled={y < yearRange.from}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

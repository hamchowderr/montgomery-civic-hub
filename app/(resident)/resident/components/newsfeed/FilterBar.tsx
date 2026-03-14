"use client";

import { Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FilterState } from "./types";
import { DISTRICTS, STATUS_OPTIONS } from "./types";

interface FilterBarProps {
  filters: FilterState;
  departmentOptions: string[];
  originOptions: string[];
  isLoadingFilters: boolean;
  onUpdateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
}

export function FilterBar({
  filters,
  departmentOptions,
  originOptions,
  isLoadingFilters,
  onUpdateFilter,
}: FilterBarProps) {
  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 rounded-lg border border-b bg-card/95 p-2 backdrop-blur-sm">
      <Filter className="h-4 w-4 text-muted-foreground" />

      <Select
        value={filters.departments.length === 1 ? filters.departments[0] : "all"}
        onValueChange={(val) => onUpdateFilter("departments", val === "all" ? [] : [val])}
        disabled={isLoadingFilters}
      >
        <SelectTrigger className="h-8 w-[180px] text-xs">
          <SelectValue placeholder="All Departments" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Departments</SelectItem>
          {departmentOptions.map((dept) => (
            <SelectItem key={dept} value={dept}>
              {dept}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex rounded-md border">
        {STATUS_OPTIONS.map((s) => (
          <Button
            key={s}
            variant={filters.status === s ? "default" : "ghost"}
            size="sm"
            className="h-8 rounded-none px-3 text-xs first:rounded-l-md last:rounded-r-md"
            onClick={() => onUpdateFilter("status", s as FilterState["status"])}
          >
            {s}
          </Button>
        ))}
      </div>

      <Select value={filters.district} onValueChange={(val) => onUpdateFilter("district", val)}>
        <SelectTrigger className="h-8 w-[130px] text-xs">
          <SelectValue placeholder="All Districts" />
        </SelectTrigger>
        <SelectContent>
          {DISTRICTS.map((d) => (
            <SelectItem key={d} value={d}>
              {d === "all" ? "All Districts" : `District ${d}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.origin}
        onValueChange={(val) => onUpdateFilter("origin", val)}
        disabled={isLoadingFilters}
      >
        <SelectTrigger className="h-8 w-[140px] text-xs">
          <SelectValue placeholder="All Origins" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Origins</SelectItem>
          {originOptions.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {filters.requestType && (
        <Badge
          variant="secondary"
          className="h-7 cursor-pointer gap-1 text-xs"
          onClick={() => onUpdateFilter("requestType", "")}
        >
          {filters.requestType}
          <span className="ml-1 text-muted-foreground">&times;</span>
        </Badge>
      )}
    </div>
  );
}

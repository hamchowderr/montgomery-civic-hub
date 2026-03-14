"use client";

import { ChevronLeft, ChevronRight, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { IncidentCard } from "./IncidentCard";
import type { IncidentItem } from "./types";
import { PAGE_SIZE } from "./types";

interface IncidentListProps {
  items: IncidentItem[];
  pagedItems: IncidentItem[];
  isLoadingFeed: boolean;
  currentPage: number;
  totalPages: number;
  expandedId: string | null;
  activeRequestType: string;
  onPageChange: (page: number | ((prev: number) => number)) => void;
  onToggleExpand: (id: string) => void;
  onFilterByType: (type: string) => void;
}

/**
 * Build an array of page numbers to display with "..." gaps.
 * Always shows first, last, and a window around the current page.
 */
function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i);
  }

  const pages: (number | "ellipsis")[] = [];
  const showAround = 1; // pages to show around current

  // Always show first page
  pages.push(0);

  const rangeStart = Math.max(1, current - showAround);
  const rangeEnd = Math.min(total - 2, current + showAround);

  if (rangeStart > 1) {
    pages.push("ellipsis");
  }

  for (let i = rangeStart; i <= rangeEnd; i++) {
    pages.push(i);
  }

  if (rangeEnd < total - 2) {
    pages.push("ellipsis");
  }

  // Always show last page
  if (total > 1) {
    pages.push(total - 1);
  }

  return pages;
}

export function IncidentList({
  items,
  pagedItems,
  isLoadingFeed,
  currentPage,
  totalPages,
  expandedId,
  activeRequestType,
  onPageChange,
  onToggleExpand,
  onFilterByType,
}: IncidentListProps) {
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  const renderPagination = () => {
    if (isLoadingFeed || items.length <= PAGE_SIZE) return null;

    return (
      <div className="flex items-center justify-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={currentPage === 0}
          onClick={() => onPageChange((p: number) => p - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {pageNumbers.map((page, idx) =>
          page === "ellipsis" ? (
            <span
              key={`ellipsis-${idx}`}
              className="flex h-8 w-8 items-center justify-center text-xs text-muted-foreground"
            >
              ...
            </span>
          ) : (
            <Button
              key={page}
              variant={page === currentPage ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8 text-xs tabular-nums"
              onClick={() => onPageChange(page)}
            >
              {page + 1}
            </Button>
          ),
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={currentPage >= totalPages - 1}
          onClick={() => onPageChange((p: number) => p + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-semibold">Recent Requests</span>
          {!isLoadingFeed && (
            <Badge
              variant="secondary"
              className="h-5 min-w-[20px] justify-center px-1.5 text-[10px] font-bold tabular-nums"
            >
              {items.length}
            </Badge>
          )}
        </div>
        {/* Top pagination — compact */}
        {!isLoadingFeed && items.length > PAGE_SIZE && (
          <span className="text-xs tabular-nums text-muted-foreground">
            Page {currentPage + 1} of {totalPages}
          </span>
        )}
      </div>

      {isLoadingFeed ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-3 rounded-lg border border-l-4 border-l-muted p-2.5">
              <div className="flex-1 space-y-3">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-12 rounded-full" />
                  <Skeleton className="h-4 w-16 rounded-full" />
                  <Skeleton className="h-4 w-10 rounded-full" />
                </div>
              </div>
              <Skeleton className="h-3 w-10 shrink-0" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No requests found matching current filters.
        </p>
      ) : (
        <div className="space-y-3">
          {pagedItems.map((item) => (
            <IncidentCard
              key={item.id}
              item={item}
              isExpanded={expandedId === item.id}
              onToggleExpand={() => onToggleExpand(item.id)}
              activeRequestType={activeRequestType}
              onFilterByType={onFilterByType}
            />
          ))}
        </div>
      )}

      {/* Bottom pagination — page numbers with ellipsis */}
      <div className="mt-3">{renderPagination()}</div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type FilterFn,
  flexRender,
  getCoreRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowUpDown,
  Download,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "lucide-react";

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  isLoading?: boolean;
  pageSize?: number;
  exportable?: boolean;
  exportFilename?: string;
  filterPlaceholder?: string;
  filterColumn?: string;
}

function SkeletonRows({ columns, rows }: { columns: number; rows: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: columns }).map((_, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-20" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

function downloadCSV<TData>(
  data: TData[],
  columns: ColumnDef<TData, unknown>[],
  filename: string,
) {
  const headers = columns
    .map((col) => {
      if (typeof col.header === "string") return col.header;
      if ("accessorKey" in col && col.accessorKey)
        return String(col.accessorKey);
      return col.id ?? "";
    })
    .filter(Boolean);

  const rows = data.map((row) =>
    columns.map((col) => {
      const key = "accessorKey" in col ? String(col.accessorKey) : col.id;
      if (!key) return "";
      const value = (row as Record<string, unknown>)[key];
      const str = String(value ?? "");
      return str.includes(",") || str.includes('"')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    }),
  );

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function getColumnHeader<TData>(col: ColumnDef<TData, unknown>): string {
  if (typeof col.header === "string") return col.header;
  if ("accessorKey" in col && col.accessorKey) return String(col.accessorKey);
  return col.id ?? "";
}

function getColumnKey<TData>(col: ColumnDef<TData, unknown>): string {
  if ("accessorKey" in col) return String(col.accessorKey);
  return col.id ?? "";
}

const DATE_KEYS = /date|created|closed|issued|expired|completion/i;
const CURRENCY_KEYS = /cost|fee|value|price|budget/i;
const MILES_KEYS = /miles|length_miles/i;

function smartFormat(key: string, value: unknown): string {
  if (value == null || value === "") return "—";

  // Epoch timestamps (milliseconds)
  const num = Number(value);
  if (DATE_KEYS.test(key) && !isNaN(num) && num > 1e11) {
    return new Date(num).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  // ISO date strings
  if (
    DATE_KEYS.test(key) &&
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}/.test(value)
  ) {
    return new Date(value).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  // Currency
  if (CURRENCY_KEYS.test(key) && !isNaN(num)) {
    return num.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  }
  // Miles
  if (MILES_KEYS.test(key) && !isNaN(num)) {
    return `${num.toFixed(2)} mi`;
  }

  return String(value);
}

function RowDetailDialog<TData>({
  row,
  columns,
  open,
  onOpenChange,
}: {
  row: TData | null;
  columns: ColumnDef<TData, unknown>[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!row) return null;

  const record = row as Record<string, unknown>;
  const entries = columns
    .map((col) => ({
      label: getColumnHeader(col),
      key: getColumnKey(col),
      value: record[getColumnKey(col)],
    }))
    .filter((e) => e.label && e.key);

  // Use the first meaningful text field as the title
  const titleEntry = entries.find(
    (e) => e.value != null && e.value !== "" && typeof e.value === "string",
  );
  const title = titleEntry ? String(titleEntry.value) : "Record Details";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base leading-snug pr-6">
            {title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Full details for this record
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <div className="grid gap-3">
          {entries.map((entry) => {
            const display = smartFormat(entry.key, entry.value);
            return (
              <div key={entry.key} className="grid grid-cols-[120px_1fr] gap-2">
                <span className="text-xs font-medium text-muted-foreground truncate">
                  {entry.label}
                </span>
                <span className="text-sm break-words">{display}</span>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const MAX_FACET_VALUES = 12;
const SKIP_FACET_KEYS =
  /date|created|closed|issued|expired|completion|cost|fee|value|price|budget|miles|length|address|description|name|street|from_|to_|id$/i;

interface Facet {
  columnKey: string;
  header: string;
  values: string[];
}

function detectFacets<TData>(
  data: TData[],
  columns: ColumnDef<TData, unknown>[],
): Facet[] {
  if (data.length === 0) return [];

  const facets: Facet[] = [];
  for (const col of columns) {
    const key = getColumnKey(col);
    if (!key || SKIP_FACET_KEYS.test(key)) continue;

    const uniqueValues = new Set<string>();
    let tooMany = false;
    for (const row of data) {
      const val = (row as Record<string, unknown>)[key];
      if (val == null || val === "") continue;
      const str = String(val);
      uniqueValues.add(str);
      if (uniqueValues.size > MAX_FACET_VALUES) {
        tooMany = true;
        break;
      }
    }

    if (!tooMany && uniqueValues.size >= 2) {
      facets.push({
        columnKey: key,
        header: getColumnHeader(col),
        values: Array.from(uniqueValues).sort(),
      });
    }
  }
  return facets;
}

const arrIncludesFilter: FilterFn<unknown> = (row, columnId, filterValue) => {
  const value = row.getValue(columnId);
  if (!Array.isArray(filterValue) || filterValue.length === 0) return true;
  return filterValue.includes(String(value ?? ""));
};

function FacetFilterBar({
  facets,
  activeFilters,
  onToggle,
  onClearAll,
}: {
  facets: Facet[];
  activeFilters: Record<string, string[]>;
  onToggle: (columnKey: string, value: string) => void;
  onClearAll: () => void;
}) {
  const hasActive = Object.values(activeFilters).some((v) => v.length > 0);

  return (
    <div className="flex flex-wrap items-start gap-3">
      {facets.map((facet) => (
        <div key={facet.columnKey} className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-muted-foreground px-0.5">
            {facet.header}
          </span>
          <div className="flex flex-wrap gap-1">
            {facet.values.map((val) => {
              const isActive = activeFilters[facet.columnKey]?.includes(val);
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => onToggle(facet.columnKey, val)}
                  className={cn(
                    "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-input hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  {val}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {hasActive && (
        <button
          type="button"
          onClick={onClearAll}
          className="self-end inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="size-3" />
          Clear filters
        </button>
      )}
    </div>
  );
}

export function DataTable<TData>({
  columns,
  data,
  isLoading = false,
  pageSize = 25,
  exportable = false,
  exportFilename = "export",
  filterPlaceholder = "Filter rows...",
  filterColumn,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedRow, setSelectedRow] = useState<TData | null>(null);

  const facets = useMemo(() => detectFacets(data, columns), [data, columns]);
  const facetColumnKeys = useMemo(
    () => new Set(facets.map((f) => f.columnKey)),
    [facets],
  );

  const columnsWithFacetFilter = useMemo(
    () =>
      columns.map((col) => {
        const key = getColumnKey(col);
        if (facetColumnKeys.has(key)) {
          return { ...col, filterFn: arrIncludesFilter as FilterFn<TData> };
        }
        return col;
      }),
    [columns, facetColumnKeys],
  );

  const table = useReactTable({
    data,
    columns: columnsWithFacetFilter,
    getCoreRowModel: getCoreRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: { sorting, columnFilters, globalFilter },
    initialState: { pagination: { pageSize } },
  });

  const activeFilters = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const f of columnFilters) {
      if (Array.isArray(f.value)) {
        map[f.id] = f.value as string[];
      }
    }
    return map;
  }, [columnFilters]);

  function toggleFacetValue(columnKey: string, value: string) {
    const current = activeFilters[columnKey] ?? [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    table
      .getColumn(columnKey)
      ?.setFilterValue(next.length > 0 ? next : undefined);
    table.setPageIndex(0);
  }

  function clearAllFacets() {
    for (const facet of facets) {
      table.getColumn(facet.columnKey)?.setFilterValue(undefined);
    }
    table.setPageIndex(0);
  }

  const totalRows = table.getFilteredRowModel().rows.length;
  const pageCount = table.getPageCount();
  const currentPage = table.getState().pagination.pageIndex + 1;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={filterPlaceholder}
            value={
              filterColumn
                ? ((table
                    .getColumn(filterColumn)
                    ?.getFilterValue() as string) ?? "")
                : globalFilter
            }
            onChange={(e) => {
              if (filterColumn) {
                table
                  .getColumn(filterColumn)
                  ?.setFilterValue(e.target.value || undefined);
              } else {
                setGlobalFilter(e.target.value);
              }
            }}
            className="pl-8 h-8 text-sm"
          />
        </div>
        {exportable && data.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => downloadCSV(data, columns, exportFilename)}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export CSV
          </Button>
        )}
      </div>

      {!isLoading && facets.length > 0 && data.length > 0 && (
        <FacetFilterBar
          facets={facets}
          activeFilters={activeFilters}
          onToggle={toggleFacetValue}
          onClearAll={clearAllFacets}
        />
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        type="button"
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        <ArrowUpDown className="size-3.5" />
                      </button>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <SkeletonRows columns={columns.length} rows={pageSize} />
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {globalFilter || columnFilters.length > 0
                    ? "No matching results"
                    : "No data available"}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedRow(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!isLoading && data.length > 0 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-muted-foreground">
            {totalRows} row{totalRows !== 1 ? "s" : ""}
            {globalFilter || columnFilters.length > 0
              ? ` (filtered from ${data.length})`
              : ""}
            {pageCount > 1 && (
              <span>
                {" "}
                · Page {currentPage} of {pageCount}
              </span>
            )}
          </p>
          {pageCount > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      )}

      <RowDetailDialog
        row={selectedRow}
        columns={columns}
        open={selectedRow !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedRow(null);
        }}
      />
    </div>
  );
}

export { type ColumnDef } from "@tanstack/react-table";

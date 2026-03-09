import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DataTable } from "@/components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";

interface TestRow {
  id: number;
  name: string;
  status: string;
}

const columns: ColumnDef<TestRow, unknown>[] = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "name", header: "Name" },
  { accessorKey: "status", header: "Status" },
];

const data: TestRow[] = Array.from({ length: 25 }, (_, i) => ({
  id: i + 1,
  name: `Item ${i + 1}`,
  status: i % 2 === 0 ? "Active" : "Closed",
}));

describe("DataTable", () => {
  it("renders column headers", () => {
    render(<DataTable columns={columns} data={data} />);
    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    // "Status" appears both as a column header and a facet label
    expect(screen.getAllByText("Status").length).toBeGreaterThanOrEqual(1);
  });

  it("renders data rows", () => {
    render(<DataTable columns={columns} data={data.slice(0, 3)} />);
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
    expect(screen.getByText("Item 3")).toBeInTheDocument();
  });

  it("shows empty state when no data", () => {
    render(<DataTable columns={columns} data={[]} />);
    expect(screen.getByText("No data available")).toBeInTheDocument();
  });

  it("shows loading skeleton", () => {
    const { container } = render(
      <DataTable columns={columns} data={[]} isLoading />,
    );
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("paginates when data exceeds pageSize", () => {
    render(<DataTable columns={columns} data={data} pageSize={10} />);
    expect(screen.getByText(/Page 1 of 3/)).toBeInTheDocument();
  });

  it("navigates pages", () => {
    render(<DataTable columns={columns} data={data} pageSize={10} />);
    const nextBtn = screen
      .getAllByRole("button")
      .find((btn) => btn.querySelector(".lucide-chevron-right"));
    if (nextBtn) fireEvent.click(nextBtn);
    expect(screen.getByText(/Page 2 of 3/)).toBeInTheDocument();
  });

  it("shows export button when exportable", () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        exportable
        exportFilename="test"
      />,
    );
    expect(screen.getByText("Export CSV")).toBeInTheDocument();
  });

  it("does not show export button when not exportable", () => {
    render(<DataTable columns={columns} data={data} />);
    expect(screen.queryByText("Export CSV")).not.toBeInTheDocument();
  });
});

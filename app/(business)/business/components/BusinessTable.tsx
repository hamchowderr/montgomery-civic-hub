"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTableData } from "@/lib/hooks/use-table-data";

export function BusinessTable() {
  const {
    data,
    columns,
    isLoading,
    datasets,
    selectedDataset,
    setSelectedDataset,
    exportFilename,
    filterPlaceholder,
  } = useTableData("business");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">
          {datasets.find((d) => d.key === selectedDataset)?.label ?? "Data"}
        </CardTitle>
        {datasets.length > 1 && (
          <Select value={selectedDataset} onValueChange={setSelectedDataset}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {datasets.map((d) => (
                <SelectItem key={d.key} value={d.key}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={data}
          isLoading={isLoading}
          exportable
          exportFilename={exportFilename}
          filterPlaceholder={filterPlaceholder}
        />
      </CardContent>
    </Card>
  );
}

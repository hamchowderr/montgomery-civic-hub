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
import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";

export function CityStaffTable() {
  const {
    data,
    columns,
    isLoading,
    datasets,
    selectedDataset,
    setSelectedDataset,
    exportFilename,
    filterPlaceholder,
  } = useTableData("citystaff");

  useCopilotReadable({
    description: "City staff table dataset state",
    value: {
      selectedDataset,
      availableDatasets: datasets.map((d) => ({ key: d.key, label: d.label })),
    },
  });

  useCopilotAction({
    name: "select_table_dataset",
    description: "Switch the table to display a different dataset",
    parameters: [
      {
        name: "datasetKey",
        type: "string",
        description: "The dataset key to select",
        required: true,
      },
    ],
    handler: ({ datasetKey }) => {
      setSelectedDataset(datasetKey);
      const label =
        datasets.find((d) => d.key === datasetKey)?.label ?? datasetKey;
      return `Table switched to ${label}`;
    },
  });

  return (
    <Card className="border-0 shadow-none rounded-none">
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

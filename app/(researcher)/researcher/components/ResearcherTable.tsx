"use client";

import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { DataTable } from "@/components/ui/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTableData } from "@/lib/hooks/use-table-data";

export function ResearcherTable() {
  const {
    data,
    columns,
    isLoading,
    datasets,
    selectedDataset,
    setSelectedDataset,
    exportFilename,
    filterPlaceholder,
  } = useTableData("researcher");

  useCopilotReadable({
    description: "Researcher table dataset state",
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
      const label = datasets.find((d) => d.key === datasetKey)?.label ?? datasetKey;
      return `Table switched to ${label}`;
    },
  });

  return (
    <div className="flex h-full flex-col px-3 py-2">
      {datasets.length > 1 && (
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium">
            {datasets.find((d) => d.key === selectedDataset)?.label ?? "Data"}
          </span>
          <Select value={selectedDataset} onValueChange={setSelectedDataset}>
            <SelectTrigger className="h-7 w-[180px] text-xs">
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
        </div>
      )}
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        exportable
        exportFilename={exportFilename}
        filterPlaceholder={filterPlaceholder}
      />
    </div>
  );
}

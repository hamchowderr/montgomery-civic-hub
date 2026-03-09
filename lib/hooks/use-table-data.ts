"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { ARCGIS_URLS, queryFeatureAttributes } from "@/lib/arcgis-client";
import { useYearFilter, type YearRange } from "@/lib/contexts/year-filter";
import { yearWhere, formatCurrency } from "@/lib/arcgis-helpers";

interface UseTableDataReturn {
  data: Record<string, unknown>[];
  columns: ColumnDef<Record<string, unknown>, unknown>[];
  isLoading: boolean;
  refresh: () => void;
  datasets: { key: string; label: string }[];
  selectedDataset: string;
  setSelectedDataset: (key: string) => void;
  exportFilename: string;
  filterPlaceholder: string;
}

function formatDate(val: unknown): string {
  if (val == null || val === "") return "—";
  const num = Number(val);
  if (!isNaN(num) && num > 1e11) {
    return new Date(num).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  const str = String(val);
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return new Date(str).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  return str;
}

function formatMiles(val: unknown): string {
  if (val == null || val === "") return "—";
  const num = Number(val);
  if (isNaN(num)) return String(val);
  return `${num.toFixed(2)} mi`;
}

function makeColumns(
  fields: {
    key: string;
    header: string;
    format?: "date" | "currency" | "miles";
  }[],
): ColumnDef<Record<string, unknown>, unknown>[] {
  return fields.map(({ key, header, format }) => ({
    accessorKey: key,
    header,
    cell: ({ getValue }) => {
      const val = getValue();
      if (format === "date") return formatDate(val);
      if (format === "currency") return formatCurrency(val);
      if (format === "miles") return formatMiles(val);
      if (val == null || val === "") return "—";
      return String(val);
    },
  }));
}

interface DatasetConfig {
  label: string;
  sources: {
    url: string;
    where?: string;
    outFields: string;
    yearFilterField?: string;
    yearQuoted?: boolean;
  }[];
  fields: {
    key: string;
    header: string;
    format?: "date" | "currency" | "miles";
  }[];
  exportFilename: string;
  filterPlaceholder: string;
}

const PORTAL_CONFIGS: Record<string, Record<string, DatasetConfig>> = {
  resident: {
    "311-requests": {
      label: "311 Service Requests",
      sources: [
        {
          url: ARCGIS_URLS.serviceRequests311,
          outFields:
            "Request_ID,Request_Type,Department,Address,Status,District,Create_Date,Close_Date,Origin",
          yearFilterField: "Year",
        },
      ],
      fields: [
        { key: "Request_ID", header: "Request ID" },
        { key: "Request_Type", header: "Type" },
        { key: "Department", header: "Department" },
        { key: "Address", header: "Address" },
        { key: "Status", header: "Status" },
        { key: "District", header: "District" },
        { key: "Create_Date", header: "Created", format: "date" },
        { key: "Close_Date", header: "Closed", format: "date" },
        { key: "Origin", header: "Source" },
      ],
      exportFilename: "montgomery-311-requests",
      filterPlaceholder: "Search service requests…",
    },
    "code-violations": {
      label: "Code Violations",
      sources: [
        {
          url: ARCGIS_URLS.codeViolations,
          outFields: "OffenceNum,CaseType,CaseStatus,Address1,District,Year",
          yearFilterField: "Year",
          yearQuoted: true,
        },
      ],
      fields: [
        { key: "OffenceNum", header: "Case #" },
        { key: "CaseType", header: "Type" },
        { key: "CaseStatus", header: "Status" },
        { key: "Address1", header: "Address" },
        { key: "District", header: "District" },
        { key: "Year", header: "Year" },
      ],
      exportFilename: "montgomery-code-violations",
      filterPlaceholder: "Search code violations…",
    },
    nuisance: {
      label: "Nuisance Reports",
      sources: [
        {
          url: ARCGIS_URLS.nuisance,
          outFields: "OffenseNo,Location,Remark,Type,Date,District",
        },
      ],
      fields: [
        { key: "OffenseNo", header: "Case #" },
        { key: "Location", header: "Location" },
        { key: "Remark", header: "Remark" },
        { key: "Type", header: "Type" },
        { key: "Date", header: "Date", format: "date" },
        { key: "District", header: "District" },
      ],
      exportFilename: "montgomery-nuisance-reports",
      filterPlaceholder: "Search nuisance reports…",
    },
  },
  business: {
    "construction-permits": {
      label: "Construction Permits",
      sources: [
        {
          url: ARCGIS_URLS.constructionPermits,
          outFields:
            "PermitNo,PermitDescription,ProjectType,PhysicalAddress,EstimatedCost,Total_Fee,PermitStatus,IssuedDate,Zoning,ContractorName,UseType",
          yearFilterField: "Year",
          yearQuoted: true,
        },
      ],
      fields: [
        { key: "PermitNo", header: "Permit #" },
        { key: "PermitDescription", header: "Description" },
        { key: "ProjectType", header: "Project Type" },
        { key: "PhysicalAddress", header: "Address" },
        { key: "EstimatedCost", header: "Est. Cost", format: "currency" },
        { key: "Total_Fee", header: "Total Fee", format: "currency" },
        { key: "PermitStatus", header: "Status" },
        { key: "IssuedDate", header: "Issued", format: "date" },
        { key: "Zoning", header: "Zoning" },
        { key: "ContractorName", header: "Contractor" },
        { key: "UseType", header: "Use Type" },
      ],
      exportFilename: "montgomery-construction-permits",
      filterPlaceholder: "Search construction permits…",
    },
    "business-licenses": {
      label: "Business Licenses",
      sources: [
        {
          url: ARCGIS_URLS.businessLicense,
          outFields:
            "custCOMPANY_NAME,custDBA,Full_Address,scNAME,pvYEAR,pvEFFDATE,pvEXPIRE",
          yearFilterField: "pvYEAR",
        },
      ],
      fields: [
        { key: "custCOMPANY_NAME", header: "Company" },
        { key: "custDBA", header: "DBA" },
        { key: "Full_Address", header: "Address" },
        { key: "scNAME", header: "Category" },
        { key: "pvYEAR", header: "Year" },
        { key: "pvEFFDATE", header: "Effective", format: "date" },
        { key: "pvEXPIRE", header: "Expires", format: "date" },
      ],
      exportFilename: "montgomery-business-licenses",
      filterPlaceholder: "Search business licenses…",
    },
  },
  citystaff: {
    "paving-projects": {
      label: "Paving Projects",
      sources: [
        {
          url: ARCGIS_URLS.pavingProject,
          outFields:
            "StreetName,From_,To_,DistrictDesc,Status,Year,Length_Miles,Contractor,CompletionDate,Class",
        },
      ],
      fields: [
        { key: "StreetName", header: "Street" },
        { key: "From_", header: "From" },
        { key: "To_", header: "To" },
        { key: "DistrictDesc", header: "District" },
        { key: "Status", header: "Status" },
        { key: "Year", header: "Year" },
        { key: "Length_Miles", header: "Length", format: "miles" },
        { key: "Contractor", header: "Contractor" },
        { key: "CompletionDate", header: "Completed", format: "date" },
        { key: "Class", header: "Road Class" },
      ],
      exportFilename: "montgomery-paving-projects",
      filterPlaceholder: "Search paving projects…",
    },
    "code-violations": {
      label: "Code Violations",
      sources: [
        {
          url: ARCGIS_URLS.codeViolations,
          outFields: "OffenceNum,CaseType,CaseStatus,Address1,District,Year",
          yearFilterField: "Year",
          yearQuoted: true,
        },
      ],
      fields: [
        { key: "OffenceNum", header: "Case #" },
        { key: "CaseType", header: "Type" },
        { key: "CaseStatus", header: "Status" },
        { key: "Address1", header: "Address" },
        { key: "District", header: "District" },
        { key: "Year", header: "Year" },
      ],
      exportFilename: "montgomery-code-violations",
      filterPlaceholder: "Search code violations…",
    },
    "311-requests": {
      label: "311 Service Requests",
      sources: [
        {
          url: ARCGIS_URLS.serviceRequests311,
          outFields:
            "Request_ID,Request_Type,Department,Address,Status,District,Create_Date,Close_Date",
          yearFilterField: "Year",
        },
      ],
      fields: [
        { key: "Request_ID", header: "Request ID" },
        { key: "Request_Type", header: "Type" },
        { key: "Department", header: "Department" },
        { key: "Address", header: "Address" },
        { key: "Status", header: "Status" },
        { key: "District", header: "District" },
        { key: "Create_Date", header: "Created", format: "date" },
        { key: "Close_Date", header: "Closed", format: "date" },
      ],
      exportFilename: "montgomery-311-requests",
      filterPlaceholder: "Search service requests…",
    },
    nuisance: {
      label: "Nuisance Reports",
      sources: [
        {
          url: ARCGIS_URLS.nuisance,
          outFields: "OffenseNo,Location,Remark,Type,Date,District",
        },
      ],
      fields: [
        { key: "OffenseNo", header: "Case #" },
        { key: "Location", header: "Location" },
        { key: "Remark", header: "Remark" },
        { key: "Type", header: "Type" },
        { key: "Date", header: "Date", format: "date" },
        { key: "District", header: "District" },
      ],
      exportFilename: "montgomery-nuisance-reports",
      filterPlaceholder: "Search nuisance reports…",
    },
  },
  researcher: {
    "311-requests": {
      label: "311 Service Requests",
      sources: [
        {
          url: ARCGIS_URLS.serviceRequests311,
          outFields:
            "Request_ID,Request_Type,Department,Address,Status,District,Year,Create_Date,Close_Date,Origin",
          yearFilterField: "Year",
        },
      ],
      fields: [
        { key: "Request_ID", header: "Request ID" },
        { key: "Request_Type", header: "Type" },
        { key: "Department", header: "Department" },
        { key: "Address", header: "Address" },
        { key: "Status", header: "Status" },
        { key: "District", header: "District" },
        { key: "Year", header: "Year" },
        { key: "Create_Date", header: "Created", format: "date" },
        { key: "Close_Date", header: "Closed", format: "date" },
        { key: "Origin", header: "Source" },
      ],
      exportFilename: "montgomery-311-requests",
      filterPlaceholder: "Search service requests…",
    },
    "code-violations": {
      label: "Code Violations",
      sources: [
        {
          url: ARCGIS_URLS.codeViolations,
          outFields: "OffenceNum,CaseType,CaseStatus,Address1,District,Year",
          yearFilterField: "Year",
          yearQuoted: true,
        },
      ],
      fields: [
        { key: "OffenceNum", header: "Case #" },
        { key: "CaseType", header: "Type" },
        { key: "CaseStatus", header: "Status" },
        { key: "Address1", header: "Address" },
        { key: "District", header: "District" },
        { key: "Year", header: "Year" },
      ],
      exportFilename: "montgomery-code-violations",
      filterPlaceholder: "Search code violations…",
    },
    "construction-permits": {
      label: "Construction Permits",
      sources: [
        {
          url: ARCGIS_URLS.constructionPermits,
          outFields:
            "PermitNo,PermitDescription,ProjectType,PhysicalAddress,EstimatedCost,PermitStatus,IssuedDate,Year",
          yearFilterField: "Year",
          yearQuoted: true,
        },
      ],
      fields: [
        { key: "PermitNo", header: "Permit #" },
        { key: "PermitDescription", header: "Description" },
        { key: "ProjectType", header: "Project Type" },
        { key: "PhysicalAddress", header: "Address" },
        { key: "EstimatedCost", header: "Est. Cost", format: "currency" },
        { key: "PermitStatus", header: "Status" },
        { key: "IssuedDate", header: "Issued", format: "date" },
        { key: "Year", header: "Year" },
      ],
      exportFilename: "montgomery-construction-permits",
      filterPlaceholder: "Search construction permits…",
    },
    "business-licenses": {
      label: "Business Licenses",
      sources: [
        {
          url: ARCGIS_URLS.businessLicense,
          outFields:
            "custCOMPANY_NAME,custDBA,Full_Address,scNAME,pvYEAR,pvEFFDATE,pvEXPIRE",
          yearFilterField: "pvYEAR",
        },
      ],
      fields: [
        { key: "custCOMPANY_NAME", header: "Company" },
        { key: "custDBA", header: "DBA" },
        { key: "Full_Address", header: "Address" },
        { key: "scNAME", header: "Category" },
        { key: "pvYEAR", header: "Year" },
        { key: "pvEFFDATE", header: "Effective", format: "date" },
        { key: "pvEXPIRE", header: "Expires", format: "date" },
      ],
      exportFilename: "montgomery-business-licenses",
      filterPlaceholder: "Search business licenses…",
    },
  },
};

export type { DatasetConfig };

export function useTableData(portal: string): UseTableDataReturn {
  const portalDatasets = PORTAL_CONFIGS[portal];
  const datasetKeys = useMemo(
    () => (portalDatasets ? Object.keys(portalDatasets) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [portal],
  );

  const [selectedDataset, setSelectedDataset] = useState(
    () => datasetKeys[0] ?? "",
  );

  // Reset selected dataset when portal changes
  useEffect(() => {
    setSelectedDataset(datasetKeys[0] ?? "");
  }, [datasetKeys]);

  const datasets: { key: string; label: string }[] = useMemo(
    () =>
      portalDatasets
        ? datasetKeys.map((key) => ({
            key,
            label: portalDatasets[key]?.label ?? key,
          }))
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [portal, datasetKeys],
  );

  const config = portalDatasets[selectedDataset];
  const columns = config ? makeColumns(config.fields) : [];

  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { yearRange } = useYearFilter();

  const fetchData = useCallback(async () => {
    if (!config) {
      setData([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const results = await Promise.all(
        config.sources.map((src) => {
          let where = src.where ?? "1=1";
          if (src.yearFilterField) {
            const yw = yearWhere(
              yearRange,
              src.yearFilterField,
              src.yearQuoted ?? false,
            );
            where = where === "1=1" ? yw : `(${where}) AND ${yw}`;
          }
          return queryFeatureAttributes({
            url: src.url,
            where,
            outFields: src.outFields,
          });
        }),
      );
      setData(results.flat());
    } catch {
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [config, yearRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    columns,
    isLoading,
    refresh: fetchData,
    datasets,
    selectedDataset,
    setSelectedDataset,
    exportFilename: config?.exportFilename ?? "montgomery-data",
    filterPlaceholder: config?.filterPlaceholder ?? "Search…",
  };
}

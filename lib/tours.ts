import type { Tour } from "@/components/ui/tour";

export const tours: Tour[] = [
  {
    id: "resident-tour",
    steps: [
      {
        id: "resident-welcome",
        title: "Welcome to Your Civic Hub",
        content:
          "Your one-stop portal for Montgomery city services, safety data, and neighborhood info.",
        side: "bottom",
      },
      {
        id: "resident-map-view",
        title: "Map View",
        content:
          "See service requests and safety data plotted on an interactive map of Montgomery.",
        side: "bottom",
        clickTarget: true,
      },
      {
        id: "resident-table-view",
        title: "Table View",
        content: "Browse data in a sortable table for quick lookups.",
        side: "bottom",
        clickTarget: true,
      },
      {
        id: "resident-chart-view",
        title: "Chart View",
        content: "Visualize trends and patterns with interactive charts.",
        side: "bottom",
        clickTarget: true,
      },
      {
        id: "resident-chat-input",
        title: "Ask Claude Anything",
        content:
          "Type any civic question about flood zones, sanitation schedules, or emergency alerts.",
        side: "top",
      },
      {
        id: "resident-chat-example",
        title: "Try It Now",
        content:
          'Example ask: "What is the flood zone for 100 Dexter Ave?" or "When is my garbage pickup?"',
        side: "top",
        nextLabel: "Finish Tour",
      },
    ],
  },
  {
    id: "business-tour",
    steps: [
      {
        id: "business-welcome",
        title: "Business Intelligence Portal",
        content:
          "Live permit data, business licenses, and economic intelligence for Montgomery entrepreneurs.",
        side: "bottom",
      },
      {
        id: "business-map-view",
        title: "Map View",
        content:
          "View permits and business licenses plotted across Montgomery neighborhoods.",
        side: "bottom",
        clickTarget: true,
      },
      {
        id: "business-table-view",
        title: "Table View",
        content:
          "Browse permit and license records in a sortable, searchable table.",
        side: "bottom",
        clickTarget: true,
      },
      {
        id: "business-chart-view",
        title: "Chart View",
        content:
          "Track permit trends and economic patterns with interactive charts.",
        side: "bottom",
        clickTarget: true,
      },
      {
        id: "business-chat-input",
        title: "Ask About Your Business",
        content:
          "Ask about license requirements, permit status, local job market data, or competitive intel.",
        side: "top",
      },
      {
        id: "business-chat-example",
        title: "Try It Now",
        content:
          'Example ask: "What permits are active near downtown Montgomery?"',
        side: "top",
        nextLabel: "Finish Tour",
      },
    ],
  },
  {
    id: "citystaff-tour",
    steps: [
      {
        id: "citystaff-welcome",
        title: "Smart Cities Operations Center",
        content:
          "Infrastructure tracking, budget dashboards, and project oversight for city employees and planners.",
        side: "bottom",
      },
      {
        id: "citystaff-map-view",
        title: "Map View",
        content:
          "See infrastructure projects and work orders plotted on the city map.",
        side: "bottom",
        clickTarget: true,
      },
      {
        id: "citystaff-table-view",
        title: "Table View",
        content:
          "Browse project records and budget line items in a sortable table.",
        side: "bottom",
        clickTarget: true,
      },
      {
        id: "citystaff-chart-view",
        title: "Chart View",
        content:
          "Monitor budget allocation and project timelines with interactive charts.",
        side: "bottom",
        clickTarget: true,
      },
      {
        id: "citystaff-chat-input",
        title: "Operational Intelligence",
        content:
          "Ask about council agendas, budget line items, project status, or GIS layer details.",
        side: "top",
        nextLabel: "Finish Tour",
      },
    ],
  },
  {
    id: "researcher-tour",
    steps: [
      {
        id: "researcher-welcome",
        title: "Public Safety Analytics",
        content:
          "Longitudinal crime data, 911 call patterns, and local news correlation for journalists and researchers.",
        side: "bottom",
      },
      {
        id: "researcher-map-view",
        title: "Map View",
        content:
          "Explore crime hotspots and 911 call density on an interactive heat map.",
        side: "bottom",
        clickTarget: true,
      },
      {
        id: "researcher-table-view",
        title: "Table View",
        content:
          "Browse and filter raw datasets in a sortable table with CSV export.",
        side: "bottom",
        clickTarget: true,
      },
      {
        id: "researcher-chart-view",
        title: "Chart View",
        content:
          "Visualize longitudinal crime trends and demographic patterns.",
        side: "bottom",
        clickTarget: true,
      },
      {
        id: "researcher-chat-input",
        title: "Research Assistant",
        content:
          "Ask analytical questions. Claude correlates ArcGIS crime data with live local news and always cites dataset name and date range.",
        side: "top",
        nextLabel: "Finish Tour",
      },
    ],
  },
];

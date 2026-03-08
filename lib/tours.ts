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
        id: "resident-stats",
        title: "Live City Stats",
        content:
          "These cards show real-time data pulled directly from City of Montgomery ArcGIS datasets.",
        side: "bottom",
      },
      {
        id: "resident-map",
        title: "Neighborhood Safety Map",
        content:
          "Crime incidents and city service locations plotted live from ArcGIS. Clusters expand as you zoom in.",
        side: "left",
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
        id: "business-stats",
        title: "Permit & License Dashboard",
        content:
          "Active permits, business licenses, and recent filings sourced from Montgomery ArcGIS in real time.",
        side: "bottom",
      },
      {
        id: "business-map",
        title: "Economic Opportunity Map",
        content:
          "Permit density by zone and license locations identify active development corridors.",
        side: "left",
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
        id: "citystaff-stats",
        title: "Operations Overview",
        content:
          "Active construction orders, project counts, and department summaries from live city datasets.",
        side: "bottom",
      },
      {
        id: "citystaff-chart",
        title: "Budget by Department",
        content:
          "Master Operating Expenditures visualized by department, refreshed every 15 minutes.",
        side: "left",
      },
      {
        id: "citystaff-map",
        title: "Infrastructure Map",
        content: "Streets, parcels, zoning polygons, and active work orders.",
        side: "left",
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
        id: "researcher-stats",
        title: "Dataset Overview",
        content:
          "Crime statistics from 2018 to present, 911 call volume, and census demographics from official ArcGIS sources.",
        side: "bottom",
      },
      {
        id: "researcher-chart",
        title: "Crime Trend Explorer",
        content:
          "Time-series chart of crime incidents from 2018 to present, filterable by type.",
        side: "left",
      },
      {
        id: "researcher-map",
        title: "911 Call Heatmap",
        content: "Monthly emergency call volume clustered by geography.",
        side: "left",
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

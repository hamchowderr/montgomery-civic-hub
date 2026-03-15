import type { Tour } from "@/components/ui/tour";

export const tours: Tour[] = [
  {
    id: "resident-tour",
    steps: [
      {
        id: "resident-welcome",
        title: "Welcome to the Resident Portal",
        content:
          "This is your personal dashboard for everything happening in Montgomery — from safety alerts and service requests to flood zones and sanitation schedules. All data is pulled live from the city's ArcGIS system.",
        side: "bottom",
      },
      {
        id: "resident-portal-nav",
        title: "Switch Between Portals",
        content:
          "Montgomery Civic Hub has four portals tailored to different audiences: Resident, Business, City Staff, and Researcher. Click any tab to jump to a different portal without losing your place.",
        side: "bottom",
      },
      {
        id: "resident-map-view",
        title: "Interactive Map View",
        content:
          "Explore Montgomery neighborhoods on a live map. Service requests, safety incidents, and city infrastructure are plotted as interactive markers. Click any marker for details.",
        side: "bottom",
        clickTarget: true,
      },
      {
        id: "resident-layers",
        title: "Layers & Council Districts",
        content:
          "Use the Layers button to toggle different data layers on and off — 311 requests, code violations, fire incidents, and more. The Districts button overlays Montgomery's 9 council district boundaries so you can see which district any location falls in.",
        side: "bottom",
      },
      {
        id: "resident-table-view",
        title: "Searchable Data Table",
        content:
          "View the same data as a sortable, searchable table. Sort by any column, filter by keywords, and quickly find specific records. Great for looking up individual service requests or checking the status of a report.",
        side: "bottom",
        clickTarget: true,
      },
      {
        id: "resident-chart-view",
        title: "Charts & Trends",
        content:
          "See trends over time with interactive charts. Track how service requests, safety incidents, or other metrics change month-to-month or year-to-year. Hover over any data point for exact numbers.",
        side: "bottom",
        clickTarget: true,
      },
      {
        id: "resident-year-filter",
        title: "Filter by Year Range",
        content:
          "Use these dropdowns to narrow all data — maps, tables, and charts — to a specific time period. The filter applies across all views so you can compare different years easily.",
        side: "bottom",
      },
      {
        id: "resident-chat-input",
        title: "Your AI Civic Assistant",
        content:
          "Ask Claude any question about Montgomery in plain English. It searches live city data and local news to give you answers with sources. Try questions about flood zones, garbage schedules, street closures, or neighborhood safety.",
        side: "top",
      },
      {
        id: "resident-chat-example",
        title: "Try These Examples",
        content:
          '"What is the flood zone for 100 Dexter Ave?" • "When is my garbage pickup in Capitol Heights?" • "Are there any road closures this week?" • "Show me recent 311 requests near my area"',
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
        title: "Welcome to the Business Portal",
        content:
          "Your command center for Montgomery business intelligence — live permit data, business license records, zoning info, and economic development trends. Everything is sourced from the city's official ArcGIS datasets.",
        side: "bottom",
      },
      {
        id: "business-portal-nav",
        title: "Switch Between Portals",
        content:
          "Navigate between all four portals: Resident, Business, City Staff, and Researcher. Each portal focuses on different city data tailored to its audience. Click any tab to switch.",
        side: "bottom",
      },
      {
        id: "business-map-view",
        title: "Permits & Licenses Map",
        content:
          "See active permits and business licenses plotted across Montgomery. Color-coded markers show permit types — click any marker to see the full permit details, applicant info, and status.",
        side: "bottom",
        clickTarget: true,
      },
      {
        id: "business-layers",
        title: "Layers & Council Districts",
        content:
          "Toggle data layers to show or hide specific permit types — building permits, demolition permits, business licenses, and more. The Districts button overlays council district boundaries to see which district a business or permit falls under.",
        side: "bottom",
      },
      {
        id: "business-table-view",
        title: "Permit & License Records",
        content:
          "Browse all permit and license data in a sortable table. Search by address, business name, or permit type. Sort by date to see the newest filings, or filter to find specific records quickly.",
        side: "bottom",
        clickTarget: true,
      },
      {
        id: "business-chart-view",
        title: "Economic Trends & Patterns",
        content:
          "Track permit activity, new business filings, and economic development trends over time. Interactive charts let you spot seasonal patterns, compare neighborhoods, and identify growth areas in Montgomery.",
        side: "bottom",
        clickTarget: true,
      },
      {
        id: "business-year-filter",
        title: "Filter by Year Range",
        content:
          "Narrow all data to a specific time window. This filter applies across the map, table, and chart views simultaneously — useful for comparing permit activity across different years.",
        side: "bottom",
      },
      {
        id: "business-chat-input",
        title: "Your Business Intelligence Assistant",
        content:
          "Ask Claude anything about Montgomery's business landscape. It queries live permit data, license records, and local news to answer your questions with real sources and data.",
        side: "top",
      },
      {
        id: "business-chat-example",
        title: "Try These Examples",
        content:
          '"What permits are active near downtown?" • "How many new business licenses were issued this year?" • "What\'s the zoning for 500 Commerce St?" • "Show me restaurant permits in Cloverdale"',
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
        title: "Welcome to the City Staff Portal",
        content:
          "Your operational dashboard for infrastructure tracking, budget oversight, and project management. Designed for city employees and urban planners working with Montgomery's public systems.",
        side: "bottom",
      },
      {
        id: "citystaff-portal-nav",
        title: "Switch Between Portals",
        content:
          "Jump between all four portals — Resident, Business, City Staff, and Researcher. Each shows different datasets relevant to its audience. Your current position is highlighted.",
        side: "bottom",
      },
      {
        id: "citystaff-map-view",
        title: "Infrastructure & Work Orders Map",
        content:
          "View active infrastructure projects, work orders, and city assets on an interactive map. Markers are color-coded by project type and status. Click any marker for details including budgets, timelines, and assigned departments.",
        side: "bottom",
        clickTarget: true,
      },
      {
        id: "citystaff-layers",
        title: "Layers & Council Districts",
        content:
          "Control which data layers appear on the map — construction permits, code violations, infrastructure projects, and more. The Districts overlay shows all 9 council district boundaries, useful for tracking which districts have the most active projects.",
        side: "bottom",
      },
      {
        id: "citystaff-table-view",
        title: "Project Records & Budget Data",
        content:
          "Browse infrastructure projects, work orders, and budget line items in a sortable table. Filter by department, status, or budget range. Sort by date to track recent activity or prioritize upcoming deadlines.",
        side: "bottom",
        clickTarget: true,
      },
      {
        id: "citystaff-chart-view",
        title: "Budget & Timeline Analytics",
        content:
          "Monitor budget allocation, spending trends, and project timelines with interactive charts. Compare department spending, track completion rates, and identify bottlenecks in city operations.",
        side: "bottom",
        clickTarget: true,
      },
      {
        id: "citystaff-year-filter",
        title: "Filter by Year Range",
        content:
          "Set the date range for all data views. Useful for budget comparisons across fiscal years or tracking infrastructure project history over time.",
        side: "bottom",
      },
      {
        id: "citystaff-chat-input",
        title: "Operational Intelligence Assistant",
        content:
          "Ask Claude about city operations — council agendas, budget details, project status, GIS layers, or departmental data. It pulls live data from ArcGIS and correlates with local news coverage.",
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
        title: "Welcome to the Researcher Portal",
        content:
          "Your analytics workspace for public safety data, crime trends, and demographic patterns. Built for journalists, academics, and researchers who need longitudinal data with proper sourcing.",
        side: "bottom",
      },
      {
        id: "researcher-portal-nav",
        title: "Switch Between Portals",
        content:
          "Access all four portals from here — each focuses on different city datasets. The Researcher portal emphasizes raw data access, trend analysis, and source attribution for publishable research.",
        side: "bottom",
      },
      {
        id: "researcher-map-view",
        title: "Crime & Safety Heat Map",
        content:
          "Explore crime incident locations and 911 call density on an interactive heat map. Toggle between incident types, adjust the time range, and click individual markers for case-level details including offense codes and dates.",
        side: "bottom",
        clickTarget: true,
      },
      {
        id: "researcher-layers",
        title: "Layers & Council Districts",
        content:
          "Toggle data layers to isolate specific crime types, 911 call categories, or safety metrics. The Districts overlay adds council district boundaries — essential for geographic analysis and comparing public safety across different parts of the city.",
        side: "bottom",
      },
      {
        id: "researcher-table-view",
        title: "Raw Dataset Browser",
        content:
          "Access the underlying datasets in a full-featured table. Sort by any column, apply text filters, and export results. Every record includes its source dataset name and date range for citation purposes.",
        side: "bottom",
        clickTarget: true,
      },
      {
        id: "researcher-chart-view",
        title: "Longitudinal Trend Analysis",
        content:
          "Visualize crime trends, demographic shifts, and public safety patterns over multiple years. Interactive charts let you compare time periods, identify seasonal patterns, and track year-over-year changes.",
        side: "bottom",
        clickTarget: true,
      },
      {
        id: "researcher-year-filter",
        title: "Filter by Year Range",
        content:
          "Control the time window for all analysis views. Essential for longitudinal research — compare multi-year trends or drill into a specific period for detailed analysis.",
        side: "bottom",
      },
      {
        id: "researcher-chat-input",
        title: "AI Research Assistant",
        content:
          "Ask analytical questions in plain language. Claude queries ArcGIS crime and safety datasets, cross-references with live local news, and always cites the specific dataset name and date range in its responses.",
        side: "top",
      },
      {
        id: "researcher-chat-example",
        title: "Try These Examples",
        content:
          '"What are the crime trends in downtown Montgomery over the past 3 years?" • "Compare 911 call volumes between 2023 and 2024" • "Show me theft incidents near Alabama State University" • "What does local news say about public safety initiatives?"',
        side: "top",
        nextLabel: "Finish Tour",
      },
    ],
  },

  // ── Sub-page tours ──────────────────────────────────────────────────────────

  {
    id: "resident-emergency-tour",
    steps: [
      {
        id: "resident-welcome",
        title: "Emergency & Safety Resources",
        content:
          "This page is your one-stop reference for Montgomery emergency contacts, facility locations, service demand data, and community resources — all sourced from official city systems.",
        side: "bottom",
      },
      {
        id: "resident-emergency",
        title: "Emergency Contacts & Facilities",
        content:
          "Find critical phone numbers, locate the nearest police stations, fire stations, and medical facilities on an interactive map. Tornado siren locations are included for severe weather preparedness.",
        side: "bottom",
        nextLabel: "Finish Tour",
      },
    ],
  },
  {
    id: "resident-newsfeed-tour",
    steps: [
      {
        id: "resident-welcome",
        title: "Incident Newsfeed",
        content:
          "A real-time feed of 311 service requests across Montgomery. Filter by status, district, department, or request type to find exactly what you need.",
        side: "bottom",
      },
      {
        id: "resident-newsfeed",
        title: "Browse & Filter Incidents",
        content:
          "Each incident card shows the request type, address, status, and department. Use the filters above to narrow results by district, status, or origin. Charts show breakdowns by type and year-over-year trends.",
        side: "bottom",
        nextLabel: "Finish Tour",
      },
    ],
  },
  {
    id: "resident-city-pulse-tour",
    steps: [
      {
        id: "resident-welcome",
        title: "City Pulse Dashboard",
        content:
          "City Pulse aggregates local news and 311 data into a single view. See what's happening across Montgomery — government updates, safety alerts, events, and infrastructure news — all sourced from live web searches.",
        side: "bottom",
        nextLabel: "Finish Tour",
      },
    ],
  },
  {
    id: "business-vacant-land-tour",
    steps: [
      {
        id: "business-welcome",
        title: "Vacant Land Explorer",
        content:
          "Discover available vacant properties across Montgomery. Browse parcels by zoning type, neighborhood, and size — with nearby permit activity and analytics to help evaluate development potential.",
        side: "bottom",
        nextLabel: "Finish Tour",
      },
    ],
  },
  {
    id: "citystaff-staffing-tour",
    steps: [
      {
        id: "citystaff-welcome",
        title: "Staffing & Workforce Dashboard",
        content:
          "Monitor city staffing levels, service demand by district, paving operations, code violation trends, and recruiting actions. Designed for department managers and HR planners tracking workforce allocation.",
        side: "bottom",
        nextLabel: "Finish Tour",
      },
    ],
  },
  {
    id: "researcher-civil-rights-tour",
    steps: [
      {
        id: "researcher-welcome",
        title: "Civil Rights Timeline",
        content:
          "Explore Montgomery's civil rights history through an interactive timeline. Key events, landmarks, and figures are mapped chronologically — a research tool for historians, educators, and journalists.",
        side: "bottom",
      },
      {
        id: "researcher-civil-rights",
        title: "Interactive Timeline & Map",
        content:
          "Browse events chronologically or explore them on the map. Click any event for details including historical context, photos, and source citations suitable for academic use.",
        side: "bottom",
        nextLabel: "Finish Tour",
      },
    ],
  },
  {
    id: "researcher-demographics-tour",
    steps: [
      {
        id: "researcher-welcome",
        title: "Demographics Dashboard",
        content:
          "Analyze Montgomery's demographic data — population distribution, racial composition, income levels, and housing statistics across council districts. Built for researchers who need citable, district-level data.",
        side: "bottom",
        nextLabel: "Finish Tour",
      },
    ],
  },

  // ── Dashboard tours ─────────────────────────────────────────────────────────

  {
    id: "executive-tour",
    steps: [
      {
        id: "executive-welcome",
        title: "Executive Dashboard",
        content:
          "A city-wide command center for leadership. View KPIs, priority alerts, cross-portal trends, and service performance metrics — all aggregated from the four portal datasets into a single briefing view.",
        side: "bottom",
      },
      {
        id: "executive-map-view",
        title: "City Overview Map",
        content:
          "See all active city data plotted on a single map — service requests, permits, infrastructure projects, and safety incidents. Use layers to focus on specific categories.",
        side: "bottom",
        clickTarget: true,
      },
      {
        id: "executive-table-view",
        title: "Consolidated Data Table",
        content:
          "Browse aggregated records from all portals in one searchable table. Sort and filter across departments, districts, and time periods.",
        side: "bottom",
        clickTarget: true,
      },
      {
        id: "executive-chart-view",
        title: "Performance Analytics",
        content:
          "Track city-wide performance trends, budget utilization, and service delivery metrics with interactive charts.",
        side: "bottom",
        clickTarget: true,
      },
      {
        id: "executive-year-filter",
        title: "Filter by Year Range",
        content:
          "Adjust the time window to compare performance across fiscal years or drill into specific periods.",
        side: "bottom",
      },
      {
        id: "executive-chat-input",
        title: "Executive AI Assistant",
        content:
          "Ask for daily briefings, KPI summaries, cross-portal insights, or drill into any city metric. Claude can generate quick or detailed executive briefings on demand.",
        side: "top",
        nextLabel: "Finish Tour",
      },
    ],
  },
  {
    id: "insights-tour",
    steps: [
      {
        id: "insights-welcome",
        title: "Insights Lab",
        content:
          "A cross-district analytics workspace for deep data exploration. Compare equity metrics, analyze multi-year trends, spotlight individual districts, and generate data-driven narratives.",
        side: "bottom",
      },
      {
        id: "insights-map-view",
        title: "District Comparison Map",
        content:
          "Visualize metrics across Montgomery's 9 council districts. Toggle between data layers to compare service delivery, permit activity, and safety metrics geographically.",
        side: "bottom",
        clickTarget: true,
      },
      {
        id: "insights-table-view",
        title: "Cross-District Data Table",
        content:
          "Explore district-level metrics side by side. Sort by any column to quickly identify outliers and patterns across districts.",
        side: "bottom",
        clickTarget: true,
      },
      {
        id: "insights-chart-view",
        title: "Trend & Equity Charts",
        content:
          "Toggle individual metrics on and off to build custom trend comparisons. Equity analysis highlights disparities across districts.",
        side: "bottom",
        clickTarget: true,
      },
      {
        id: "insights-year-filter",
        title: "Filter by Year Range",
        content:
          "Control the analysis window for all views. Essential for spotting long-term trends and year-over-year changes.",
        side: "bottom",
      },
      {
        id: "insights-chat-input",
        title: "Data Analyst Assistant",
        content:
          "Ask Claude to switch tabs, select districts, toggle metrics, or generate full data stories. It can craft narratives with key findings and recommendations based on the cross-district data.",
        side: "top",
        nextLabel: "Finish Tour",
      },
    ],
  },
];

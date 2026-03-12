import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CopilotKit } from "@copilotkit/react-core";
import { YearFilterProvider } from "@/lib/contexts/year-filter";

// Mock maplibre-gl to avoid canvas issues in jsdom
vi.mock("maplibre-gl", () => ({
  default: { Map: vi.fn() },
  Map: vi.fn(),
}));

// ── Shared test wrapper ────────────────────────────────────────────────────────

function CopilotWrapper({
  children,
  agent = "test",
}: {
  children: React.ReactNode;
  agent?: string;
}) {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent={agent}>
      <YearFilterProvider>{children}</YearFilterProvider>
    </CopilotKit>
  );
}

// ── CopilotProvider ────────────────────────────────────────────────────────────

describe("CopilotProvider", () => {
  it("renders children within CopilotKit context", async () => {
    const { CopilotProvider } = await import("@/components/CopilotProvider");

    render(
      <CopilotProvider agent="resident">
        <div data-testid="child">Hello</div>
      </CopilotProvider>,
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("renders without agent prop (optional)", async () => {
    const { CopilotProvider } = await import("@/components/CopilotProvider");

    render(
      <CopilotProvider>
        <div data-testid="child">No agent</div>
      </CopilotProvider>,
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
  });
});

// ── Portal Chat Components ─────────────────────────────────────────────────────

describe("ResidentChat", () => {
  it("renders card title", async () => {
    const { ResidentChat } =
      await import("@/app/(resident)/resident/components/ResidentChat");

    render(<ResidentChat />, {
      wrapper: ({ children }) => (
        <CopilotWrapper agent="resident">{children}</CopilotWrapper>
      ),
    });

    expect(screen.getByText("Resident Assistant")).toBeInTheDocument();
  });
});

describe("BusinessChat", () => {
  it("renders card title", async () => {
    const { BusinessChat } =
      await import("@/app/(business)/business/components/BusinessChat");

    render(<BusinessChat />, {
      wrapper: ({ children }) => (
        <CopilotWrapper agent="business">{children}</CopilotWrapper>
      ),
    });

    expect(screen.getByText("Business Assistant")).toBeInTheDocument();
  });
});

describe("CityStaffChat", () => {
  it("renders card title", async () => {
    const { CityStaffChat } =
      await import("@/app/(citystaff)/citystaff/components/CityStaffChat");

    render(<CityStaffChat />, {
      wrapper: ({ children }) => (
        <CopilotWrapper agent="citystaff">{children}</CopilotWrapper>
      ),
    });

    expect(screen.getByText("City Staff Assistant")).toBeInTheDocument();
  });
});

describe("ResearcherChat", () => {
  it("renders card title", async () => {
    const { ResearcherChat } =
      await import("@/app/(researcher)/researcher/components/ResearcherChat");

    render(<ResearcherChat />, {
      wrapper: ({ children }) => (
        <CopilotWrapper agent="researcher">{children}</CopilotWrapper>
      ),
    });

    expect(screen.getByText("Research Assistant")).toBeInTheDocument();
  });
});

// ── ChatWidget ─────────────────────────────────────────────────────────────────

describe("ChatWidget", () => {
  it("renders the floating chat button when closed", async () => {
    const { ChatWidget } = await import("@/components/ChatWidget");

    render(
      <ChatWidget open={false} onToggle={() => {}}>
        <div>Chat content</div>
      </ChatWidget>,
      {
        wrapper: ({ children }) => (
          <CopilotWrapper agent="resident">{children}</CopilotWrapper>
        ),
      },
    );

    expect(screen.getByLabelText("Open chat")).toBeInTheDocument();
  });
});

// ── DataPanel with CopilotKit ──────────────────────────────────────────────────

function DataPanelWrapper({ children }: { children: React.ReactNode }) {
  return (
    <CopilotWrapper>
      <YearFilterProvider>{children}</YearFilterProvider>
    </CopilotWrapper>
  );
}

describe("DataPanel (CopilotKit integration)", () => {
  const mapContent = <div data-testid="map">Map Content</div>;
  const tableContent = <div data-testid="table">Table Content</div>;
  const chartContent = <div data-testid="chart">Chart Content</div>;

  it("renders all tab triggers with CopilotKit context", async () => {
    const { DataPanel } = await import("@/components/DataPanel");

    render(
      <DataPanel
        portalId="resident"
        mapContent={mapContent}
        tableContent={tableContent}
        chartContent={chartContent}
      />,
      { wrapper: DataPanelWrapper },
    );

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(3);
  });

  it("renders controlled tabs (value prop) for programmatic switching", async () => {
    const { DataPanel } = await import("@/components/DataPanel");

    render(
      <DataPanel
        portalId="resident"
        mapContent={mapContent}
        tableContent={tableContent}
        chartContent={chartContent}
        defaultTab="table"
      />,
      { wrapper: DataPanelWrapper },
    );

    const tableTab = screen.getByRole("tab", { name: /table/i });
    expect(tableTab).toHaveAttribute("data-state", "active");
  });

  it("force-mounts map and table panels (chart renders only when active)", async () => {
    const { DataPanel } = await import("@/components/DataPanel");

    render(
      <DataPanel
        portalId="resident"
        mapContent={mapContent}
        tableContent={tableContent}
        chartContent={chartContent}
      />,
      { wrapper: DataPanelWrapper },
    );

    expect(screen.getByTestId("map")).toBeInTheDocument();
    expect(screen.getByTestId("table")).toBeInTheDocument();
    expect(screen.queryByTestId("chart")).not.toBeInTheDocument();
  });

  it("renders tour step IDs for all portals", async () => {
    const { DataPanel } = await import("@/components/DataPanel");

    for (const portalId of [
      "resident",
      "business",
      "citystaff",
      "researcher",
    ]) {
      const { container, unmount } = render(
        <DataPanel
          portalId={portalId}
          mapContent={mapContent}
          tableContent={tableContent}
          chartContent={chartContent}
        />,
        { wrapper: DataPanelWrapper },
      );

      expect(
        container.querySelector(`[data-tour-step-id="${portalId}-map-view"]`),
      ).toBeInTheDocument();
      expect(
        container.querySelector(`[data-tour-step-id="${portalId}-table-view"]`),
      ).toBeInTheDocument();
      expect(
        container.querySelector(`[data-tour-step-id="${portalId}-chart-view"]`),
      ).toBeInTheDocument();

      unmount();
    }
  });
});

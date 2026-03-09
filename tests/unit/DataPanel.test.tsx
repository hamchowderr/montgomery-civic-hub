import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DataPanel } from "@/components/DataPanel";
import { CopilotKit } from "@copilotkit/react-core";

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent="test">
      {children}
    </CopilotKit>
  );
}

describe("DataPanel", () => {
  const mapContent = <div data-testid="map">Map Content</div>;
  const tableContent = <div data-testid="table">Table Content</div>;
  const chartContent = <div data-testid="chart">Chart Content</div>;

  it("renders all three tab triggers", () => {
    render(
      <DataPanel
        portalId="test"
        mapContent={mapContent}
        tableContent={tableContent}
        chartContent={chartContent}
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByText("Map")).toBeInTheDocument();
    expect(screen.getByText("Table")).toBeInTheDocument();
    expect(screen.getByText("Chart")).toBeInTheDocument();
  });

  it("renders three accessible tab triggers", () => {
    render(
      <DataPanel
        portalId="test"
        mapContent={mapContent}
        tableContent={tableContent}
        chartContent={chartContent}
      />,
      { wrapper: Wrapper },
    );
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(3);
  });

  it("force-mounts map and table panels (chart only when active)", () => {
    render(
      <DataPanel
        portalId="test"
        mapContent={mapContent}
        tableContent={tableContent}
        chartContent={chartContent}
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByTestId("map")).toBeInTheDocument();
    expect(screen.getByTestId("table")).toBeInTheDocument();
    expect(screen.queryByTestId("chart")).not.toBeInTheDocument();
  });

  it("renders two force-mounted tabpanel elements (map + table)", () => {
    render(
      <DataPanel
        portalId="test"
        mapContent={mapContent}
        tableContent={tableContent}
        chartContent={chartContent}
      />,
      { wrapper: Wrapper },
    );
    const panels = screen.getAllByRole("tabpanel");
    // Map and table are force-mounted; chart only renders when its tab is active
    expect(panels).toHaveLength(2);
  });

  it("sets data-tour-step-id on each tab trigger", () => {
    const { container } = render(
      <DataPanel
        portalId="resident"
        mapContent={mapContent}
        tableContent={tableContent}
        chartContent={chartContent}
      />,
      { wrapper: Wrapper },
    );
    expect(
      container.querySelector('[data-tour-step-id="resident-map-view"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-tour-step-id="resident-table-view"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-tour-step-id="resident-chart-view"]'),
    ).toBeInTheDocument();
  });

  it("accepts defaultTab prop without crashing", () => {
    render(
      <DataPanel
        portalId="test"
        mapContent={mapContent}
        tableContent={tableContent}
        chartContent={chartContent}
        defaultTab="table"
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByTestId("map")).toBeInTheDocument();
    expect(screen.getByTestId("table")).toBeInTheDocument();
  });
});

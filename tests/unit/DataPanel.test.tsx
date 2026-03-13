import { CopilotKit } from "@copilotkit/react-core";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DataPanel } from "@/components/DataPanel";
import { YearFilterProvider } from "@/lib/contexts/year-filter";

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent="test">
      <YearFilterProvider>{children}</YearFilterProvider>
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

  it("lazy-mounts only the default tab initially", () => {
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
    expect(screen.queryByTestId("table")).not.toBeInTheDocument();
    expect(screen.queryByTestId("chart")).not.toBeInTheDocument();
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
    expect(container.querySelector('[data-tour-step-id="resident-map-view"]')).toBeInTheDocument();
    expect(
      container.querySelector('[data-tour-step-id="resident-table-view"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-tour-step-id="resident-chart-view"]'),
    ).toBeInTheDocument();
  });

  it("accepts defaultTab prop and mounts that tab", () => {
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
    expect(screen.getByTestId("table")).toBeInTheDocument();
    expect(screen.queryByTestId("map")).not.toBeInTheDocument();
  });
});

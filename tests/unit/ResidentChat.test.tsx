import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResidentChat } from "@/app/(resident)/resident/components/ResidentChat";
import { CopilotKit } from "@copilotkit/react-core";

// Mock maplibre-gl to avoid canvas issues in jsdom
vi.mock("maplibre-gl", () => ({
  default: { Map: vi.fn() },
  Map: vi.fn(),
}));

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent="resident">
      {children}
    </CopilotKit>
  );
}

describe("ResidentChat", () => {
  it("renders the card title", () => {
    render(<ResidentChat />, { wrapper: Wrapper });
    expect(screen.getByText("Resident Assistant")).toBeInTheDocument();
  });

  it("renders the CopilotChat component", () => {
    const { container } = render(<ResidentChat />, { wrapper: Wrapper });
    expect(container.querySelector(".copilotKitChat")).toBeInTheDocument();
  });
});

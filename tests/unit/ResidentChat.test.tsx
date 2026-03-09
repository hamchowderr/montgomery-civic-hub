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
  it("renders a chat input field", () => {
    render(<ResidentChat />, { wrapper: Wrapper });
    const input = screen.getByPlaceholderText(/ask about/i);
    expect(input).toBeInTheDocument();
  });

  it("renders a submit button", () => {
    render(<ResidentChat />, { wrapper: Wrapper });
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });
});

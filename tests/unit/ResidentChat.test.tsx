import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResidentChat } from "@/app/(resident)/resident/components/ResidentChat";

// Mock maplibre-gl to avoid canvas issues in jsdom
vi.mock("maplibre-gl", () => ({
  default: { Map: vi.fn() },
  Map: vi.fn(),
}));

describe("ResidentChat", () => {
  it("renders a chat input field", () => {
    render(<ResidentChat />);
    const input = screen.getByPlaceholderText(/ask about/i);
    expect(input).toBeInTheDocument();
  });

  it("renders a submit button", () => {
    render(<ResidentChat />);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });
});

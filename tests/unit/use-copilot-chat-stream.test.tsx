import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { CopilotKit } from "@copilotkit/react-core";
import type { ReactNode } from "react";

// Mock the CopilotKit chat hook (the actual code uses useCopilotChatInternal)
const mockSendMessage = vi.fn();
const mockMessages: any[] = [];

vi.mock("@copilotkit/react-core", async (importOriginal) => {
  const actual = (await importOriginal()) as any;
  return {
    ...actual,
    useCopilotChatInternal: vi.fn(() => ({
      messages: mockMessages,
      sendMessage: mockSendMessage,
      isLoading: false,
      isAvailable: true,
    })),
  };
});

import { useCopilotChatStream } from "@/lib/hooks/use-copilot-chat-stream";

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent="test">
      {children}
    </CopilotKit>
  );
}

describe("useCopilotChatStream", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMessages.length = 0;
  });

  it("returns the expected interface shape", () => {
    const { result } = renderHook(
      () => useCopilotChatStream("resident", "Welcome!"),
      { wrapper: Wrapper },
    );

    expect(result.current).toHaveProperty("messages");
    expect(result.current).toHaveProperty("input");
    expect(result.current).toHaveProperty("setInput");
    expect(result.current).toHaveProperty("loading");
    expect(result.current).toHaveProperty("toolStatus");
    expect(result.current).toHaveProperty("handleSubmit");
    expect(result.current).toHaveProperty("scrollRef");
  });

  it("includes welcome message as first message", () => {
    const { result } = renderHook(
      () => useCopilotChatStream("resident", "Welcome to the portal!"),
      { wrapper: Wrapper },
    );

    expect(result.current.messages[0]).toEqual({
      role: "assistant",
      content: "Welcome to the portal!",
    });
  });

  it("starts with empty input", () => {
    const { result } = renderHook(
      () => useCopilotChatStream("resident", "Welcome!"),
      { wrapper: Wrapper },
    );

    expect(result.current.input).toBe("");
  });

  it("starts with null toolStatus", () => {
    const { result } = renderHook(
      () => useCopilotChatStream("resident", "Welcome!"),
      { wrapper: Wrapper },
    );

    expect(result.current.toolStatus).toBeNull();
  });

  it("updates input via setInput", () => {
    const { result } = renderHook(
      () => useCopilotChatStream("resident", "Welcome!"),
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.setInput("Hello world");
    });

    expect(result.current.input).toBe("Hello world");
  });

  it("handleSubmit prevents default and clears input", async () => {
    const { result } = renderHook(
      () => useCopilotChatStream("resident", "Welcome!"),
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.setInput("Test message");
    });

    const preventDefault = vi.fn();
    await act(async () => {
      await result.current.handleSubmit({
        preventDefault,
      } as any);
    });

    expect(preventDefault).toHaveBeenCalled();
    expect(result.current.input).toBe("");
  });

  it("handleSubmit calls appendMessage with TextMessage", async () => {
    const { result } = renderHook(
      () => useCopilotChatStream("resident", "Welcome!"),
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.setInput("Test message");
    });

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as any);
    });

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    const sentMsg = mockSendMessage.mock.calls[0][0];
    expect(sentMsg.content).toBe("Test message");
  });

  it("handleSubmit does nothing for empty/whitespace input", async () => {
    const { result } = renderHook(
      () => useCopilotChatStream("resident", "Welcome!"),
      { wrapper: Wrapper },
    );

    // Empty input
    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as any);
    });

    expect(mockSendMessage).not.toHaveBeenCalled();

    // Whitespace-only input
    act(() => {
      result.current.setInput("   ");
    });

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as any);
    });

    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it("handles undefined messages gracefully", async () => {
    // Re-mock useCopilotChatInternal to return undefined messages
    const mod = await import("@copilotkit/react-core");
    const spy = vi
      .spyOn(mod, "useCopilotChatInternal" as any)
      .mockReturnValueOnce({
        messages: undefined,
        sendMessage: mockSendMessage,
        isLoading: false,
        isAvailable: true,
      });

    const { result } = renderHook(
      () => useCopilotChatStream("resident", "Welcome!"),
      { wrapper: Wrapper },
    );

    // Should still have welcome message and not crash
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].content).toBe("Welcome!");

    spy.mockRestore();
  });

  it("provides scrollRef as a ref object", () => {
    const { result } = renderHook(
      () => useCopilotChatStream("resident", "Welcome!"),
      { wrapper: Wrapper },
    );

    expect(result.current.scrollRef).toBeDefined();
    expect(result.current.scrollRef).toHaveProperty("current");
  });

  it("works with all portal names", () => {
    for (const portal of ["resident", "business", "citystaff", "researcher"]) {
      const { result } = renderHook(
        () => useCopilotChatStream(portal, `Welcome to ${portal}!`),
        { wrapper: Wrapper },
      );

      expect(result.current.messages[0].content).toBe(`Welcome to ${portal}!`);
    }
  });
});

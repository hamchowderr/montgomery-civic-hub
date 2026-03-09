"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type FormEvent,
} from "react";
import { useCopilotChat } from "@copilotkit/react-core";
import { TextMessage, Role } from "@copilotkit/runtime-client-gql";

interface Message {
  role: "user" | "assistant";
  content: string;
}

/**
 * Drop-in replacement for useChatStream that uses CopilotKit + AG-UI.
 * Exposes the identical interface: messages, input, setInput, loading, toolStatus, handleSubmit, scrollRef.
 */
export function useCopilotChatStream(_portal: string, welcomeMessage: string) {
  const [input, setInput] = useState("");
  const [toolStatus, setToolStatus] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const chatReturn = useCopilotChat();
  const {
    visibleMessages,
    appendMessage,
    isLoading: loading,
    isAvailable,
  } = chatReturn;

  // DEBUG: log the raw return from useCopilotChat to see all keys and visibleMessages
  useEffect(() => {
    const keys = Object.keys(chatReturn);
    console.log("[CopilotChat] hook keys:", keys.join(", "));
    console.log("[CopilotChat] visibleMessages:", visibleMessages);
    console.log("[CopilotChat] isAvailable:", isAvailable);
    console.log("[CopilotChat] isLoading:", loading);
    // Check if there's a "messages" key (AG-UI format) we should use instead
    if ("messages" in chatReturn) {
      console.log(
        "[CopilotChat] messages (AG-UI):",
        (chatReturn as any).messages,
      );
    }
  }, [visibleMessages, loading, isAvailable]);

  // Map CopilotKit messages to our simple Message format
  const mappedMessages: Message[] = [
    { role: "assistant", content: welcomeMessage },
    ...(visibleMessages ?? [])
      .filter(
        (m): m is TextMessage =>
          typeof m.isTextMessage === "function" &&
          m.isTextMessage() &&
          (m.role === Role.User || m.role === Role.Assistant) &&
          !!m.content?.trim(),
      )
      .map((m) => ({
        role: (m.role === Role.User ? "user" : "assistant") as
          | "user"
          | "assistant",
        content: m.content ?? "",
      })),
  ];

  // Extract tool status from in-progress action execution messages
  useEffect(() => {
    if (!loading) {
      setToolStatus(null);
      return;
    }

    const msgs = visibleMessages ?? [];
    const lastMsg = msgs[msgs.length - 1];
    if (
      lastMsg &&
      typeof lastMsg.isActionExecutionMessage === "function" &&
      lastMsg.isActionExecutionMessage()
    ) {
      setToolStatus(
        `Using ${(lastMsg as { name?: string }).name ?? "tool"}...`,
      );
      return;
    }

    setToolStatus(null);
  }, [loading, visibleMessages]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mappedMessages.length, toolStatus]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const trimmed = input.trim();
      if (!trimmed || loading) return;

      setInput("");

      try {
        await appendMessage(
          new TextMessage({
            id: crypto.randomUUID(),
            role: Role.User,
            content: trimmed,
          }),
        );
      } catch (err) {
        console.error("[CopilotChat] appendMessage failed:", err);
      }
    },
    [input, loading, appendMessage],
  );

  return {
    messages: mappedMessages,
    input,
    setInput,
    loading,
    toolStatus,
    handleSubmit,
    scrollRef,
  };
}

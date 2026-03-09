"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type FormEvent,
} from "react";
// useCopilotChat has a bug in v1.53.0 where visibleMessages is always undefined
// (it destructures a key that doesn't exist on the internal return).
// useCopilotChatInternal returns the actual AG-UI `messages` array correctly.
import { useCopilotChatInternal } from "@copilotkit/react-core";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AGUIMessage {
  id: string;
  role: string;
  content?: string;
  type?: string;
  name?: string;
}

/**
 * Drop-in replacement for useChatStream that uses CopilotKit + AG-UI.
 * Exposes the identical interface: messages, input, setInput, loading, toolStatus, handleSubmit, scrollRef.
 */
export function useCopilotChatStream(_portal: string, welcomeMessage: string) {
  const [input, setInput] = useState("");
  const [toolStatus, setToolStatus] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    messages: agMessages,
    sendMessage,
    isLoading: loading,
    isAvailable,
  } = useCopilotChatInternal();

  const rawMessages = (agMessages ?? []) as AGUIMessage[];

  // Map AG-UI messages to our simple Message format
  const mappedMessages: Message[] = [
    { role: "assistant", content: welcomeMessage },
    ...rawMessages
      .filter(
        (m) =>
          (m.role === "user" || m.role === "assistant") && !!m.content?.trim(),
      )
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content ?? "",
      })),
  ];

  // Extract tool status from in-progress action/tool messages
  useEffect(() => {
    if (!loading) {
      setToolStatus(null);
      return;
    }

    // Show tool status from the most recent tool result or in-progress tool call
    const lastMsg = rawMessages[rawMessages.length - 1];
    if (lastMsg && lastMsg.role === "tool") {
      // Extract a meaningful status from tool result content
      const content =
        typeof lastMsg.content === "string"
          ? lastMsg.content
          : JSON.stringify(lastMsg.content ?? "");
      const toolName = lastMsg.name ?? "tool";
      if (content.includes("features")) {
        setToolStatus(`Queried ${toolName} — processing results...`);
      } else {
        setToolStatus(`Using ${toolName}...`);
      }
      return;
    }

    setToolStatus(null);
  }, [loading, rawMessages]);

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
        await sendMessage({
          id: crypto.randomUUID(),
          role: "user",
          content: trimmed,
        });
      } catch (err) {
        console.error("[CopilotChat] sendMessage failed:", err);
      }
    },
    [input, loading, sendMessage],
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

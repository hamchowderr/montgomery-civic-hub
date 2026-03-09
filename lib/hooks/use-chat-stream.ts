"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type FormEvent,
} from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function useChatStream(portal: string, welcomeMessage: string) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: welcomeMessage },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [toolStatus, setToolStatus] = useState<string | null>(null);
  const [sessionId] = useState(() => crypto.randomUUID());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, toolStatus]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const trimmed = input.trim();
      if (!trimmed || loading) return;

      setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
      setInput("");
      setLoading(true);
      setToolStatus(null);

      // Add empty assistant message that we'll stream into
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      try {
        const res = await fetch(`/api/chat/${portal}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed, sessionId }),
        });

        if (!res.ok || !res.body) {
          throw new Error("Stream failed");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Extract status events (delimited by \x00)
          while (true) {
            const startIdx = buffer.indexOf("\x00status:");
            if (startIdx === -1) break;

            const endIdx = buffer.indexOf("\x00", startIdx + 1);
            if (endIdx === -1) break; // incomplete, wait for more data

            // Text before the status event is content
            const textBefore = buffer.slice(0, startIdx);
            if (textBefore) {
              appendContent(textBefore);
            }

            // Extract status text
            const status = buffer.slice(startIdx + 8, endIdx);
            setToolStatus(status);

            buffer = buffer.slice(endIdx + 1);
          }

          // Any remaining buffer text is content
          if (buffer && !buffer.includes("\x00")) {
            appendContent(buffer);
            buffer = "";
          }
        }

        // Flush any remaining buffer
        if (buffer) {
          // Strip any partial status markers
          const cleaned = buffer.replace(/\x00status:[^\x00]*\x00?/g, "");
          if (cleaned) appendContent(cleaned);
        }

        setToolStatus(null);

        // If the streamed message ended up empty, show an error
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last.role === "assistant" && !last.content.trim()) {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...last,
              content: "Sorry, something went wrong.",
            };
            return updated;
          }
          return prev;
        });
      } catch {
        setToolStatus(null);
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: "Unable to reach the server. Please try again.",
          };
          return updated;
        });
      } finally {
        setLoading(false);
      }
    },
    [input, loading, portal, sessionId],
  );

  function appendContent(text: string) {
    setMessages((prev) => {
      const updated = [...prev];
      const last = updated[updated.length - 1];
      updated[updated.length - 1] = {
        ...last,
        content: last.content + text,
      };
      return updated;
    });
  }

  return {
    messages,
    input,
    setInput,
    loading,
    toolStatus,
    handleSubmit,
    scrollRef,
  };
}

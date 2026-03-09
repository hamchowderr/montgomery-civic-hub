"use client";

import { useCopilotChatStream } from "@/lib/hooks/use-copilot-chat-stream";
import { ChatMessage } from "@/components/ChatMessage";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sparkles } from "lucide-react";

interface ChatPanelProps {
  portal: string;
  title: string;
  welcomeMessage: string;
  placeholder: string;
}

export function ChatPanel({
  portal,
  title,
  welcomeMessage,
  placeholder,
}: ChatPanelProps) {
  const {
    messages,
    input,
    setInput,
    loading,
    toolStatus,
    handleSubmit,
    scrollRef,
  } = useCopilotChatStream(portal, welcomeMessage);

  return (
    <div
      className="flex w-[380px] shrink-0 flex-col rounded-lg border bg-card"
      data-tour-step-id={`${portal}-chat`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <div className="flex size-6 items-center justify-center rounded bg-accent/10">
          <Sparkles className="size-3.5 text-accent" />
        </div>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        <div className="flex flex-col gap-3 py-4">
          {messages.map((msg, i) => (
            <ChatMessage key={i} role={msg.role} content={msg.content} />
          ))}
          {toolStatus && (
            <div className="px-2 py-1">
              <Shimmer className="text-sm">{toolStatus}</Shimmer>
            </div>
          )}
          {loading &&
            !toolStatus &&
            messages[messages.length - 1]?.role !== "assistant" && (
              <ChatMessage role="assistant" content="Thinking..." />
            )}
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 border-t bg-card p-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          disabled={loading}
          className="flex-1 text-sm"
        />
        <Button
          type="submit"
          size="icon"
          disabled={loading || !input.trim()}
          className="shrink-0 bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}

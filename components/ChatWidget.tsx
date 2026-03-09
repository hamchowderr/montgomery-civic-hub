"use client";

import { useState } from "react";
import { useCopilotChatStream } from "@/lib/hooks/use-copilot-chat-stream";
import { ChatMessage } from "@/components/ChatMessage";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatWidgetProps {
  portal: string;
  title: string;
  welcomeMessage: string;
  placeholder: string;
}

export function ChatWidget({
  portal,
  title,
  welcomeMessage,
  placeholder,
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
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
    <>
      {/* Chat panel */}
      <div
        className={cn(
          "fixed bottom-20 right-4 z-50 flex w-[380px] flex-col overflow-hidden rounded-lg border bg-card shadow-2xl shadow-foreground/5 transition-all duration-200",
          isOpen
            ? "h-[520px] scale-100 opacity-100"
            : "pointer-events-none h-0 scale-95 opacity-0",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-card px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded bg-accent/10">
              <Sparkles className="size-3.5 text-accent" />
            </div>
            <h3 className="text-sm font-semibold">{title}</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => setIsOpen(false)}
          >
            <X className="size-4" />
          </Button>
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
        <form
          onSubmit={handleSubmit}
          className="flex gap-2 border-t bg-card p-3"
        >
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

      {/* Floating button */}
      <Button
        size="icon"
        onClick={() => setIsOpen((o) => !o)}
        className={cn(
          "fixed bottom-4 right-4 z-50 size-12 rounded-full bg-accent text-accent-foreground shadow-lg shadow-accent/20 transition-all hover:scale-105 hover:bg-accent/90 hover:shadow-xl hover:shadow-accent/30",
          isOpen && "rotate-0",
        )}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? (
          <X className="size-5" />
        ) : (
          <MessageCircle className="size-5" />
        )}
      </Button>
    </>
  );
}

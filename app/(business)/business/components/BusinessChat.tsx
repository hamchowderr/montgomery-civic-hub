"use client";

import { useCopilotChatStream } from "@/lib/hooks/use-copilot-chat-stream";
import { ChatMessage } from "@/components/ChatMessage";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send } from "lucide-react";

export function BusinessChat() {
  const {
    messages,
    input,
    setInput,
    loading,
    toolStatus,
    handleSubmit,
    scrollRef,
  } = useCopilotChatStream(
    "business",
    "Hello! I can help with business permits, licensing requirements, zoning information, and economic development resources. What do you need?",
  );

  return (
    <Card className="flex h-[500px] flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Business Assistant</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2 overflow-hidden p-4 pt-0">
        <ScrollArea
          className="flex-1 pr-2"
          ref={scrollRef}
          data-tour-step-id="business-chat-example"
        >
          <div className="flex flex-col gap-3 py-2">
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

        <form
          onSubmit={handleSubmit}
          className="flex gap-2"
          data-tour-step-id="business-chat-input"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about permits, licenses, zoning..."
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={loading || !input.trim()}>
            <Send className="size-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

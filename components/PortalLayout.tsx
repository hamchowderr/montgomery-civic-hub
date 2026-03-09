"use client";

import { useState, useEffect, type ReactNode } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { useCopilotChatStream } from "@/lib/hooks/use-copilot-chat-stream";
import { ChatMessage } from "@/components/ChatMessage";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  Send,
  Sparkles,
  PanelLeft,
  PanelRight,
  GripVertical,
  MessageCircle,
} from "lucide-react";

interface PortalLayoutProps {
  portal: string;
  chatTitle: string;
  welcomeMessage: string;
  chatPlaceholder: string;
  children: ReactNode;
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);
  return matches;
}

function Handle() {
  return (
    <Separator className="relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2">
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
        <GripVertical className="h-2.5 w-2.5" />
      </div>
    </Separator>
  );
}

export function PortalLayout({
  portal,
  chatTitle,
  welcomeMessage,
  chatPlaceholder,
  children,
}: PortalLayoutProps) {
  const [chatSide, setChatSide] = useState<"left" | "right">("right");
  const [chatOpen, setChatOpen] = useState(false);
  const {
    messages,
    input,
    setInput,
    loading,
    toolStatus,
    handleSubmit,
    scrollRef,
  } = useCopilotChatStream(portal, welcomeMessage);

  const isMobile = !useMediaQuery("(min-width: 768px)");
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const chatContent = (
    <div
      className="flex h-full flex-col overflow-hidden rounded-lg border bg-card"
      data-tour-step-id={`${portal}-chat`}
    >
      {/* Chat header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded bg-accent/10">
            <Sparkles className="size-3.5 text-accent" />
          </div>
          <h3 className="text-sm font-semibold">{chatTitle}</h3>
        </div>
        <div className="hidden lg:block">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() =>
                    setChatSide((s) => (s === "right" ? "left" : "right"))
                  }
                >
                  {chatSide === "right" ? (
                    <PanelLeft className="size-3.5" />
                  ) : (
                    <PanelRight className="size-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Move chat to {chatSide === "right" ? "left" : "right"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
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
          placeholder={chatPlaceholder}
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

  if (isMobile) {
    return (
      <div className="min-h-0 flex-1">
        {/* Full-height data panel */}
        <div className="h-full">{children}</div>

        {/* Floating chat button */}
        <Button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-4 right-4 z-50 size-14 rounded-full shadow-lg bg-accent text-accent-foreground hover:bg-accent/90 md:hidden"
        >
          <MessageCircle className="size-6" />
        </Button>

        {/* Bottom sheet with chat */}
        <Sheet open={chatOpen} onOpenChange={setChatOpen}>
          <SheetContent side="bottom" className="h-[90vh] p-0">
            <SheetTitle className="sr-only">{chatTitle}</SheetTitle>
            {chatContent}
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  if (isDesktop) {
    return (
      <div className="min-h-0 flex-1">
        <Group
          key={chatSide}
          orientation="horizontal"
          style={{ display: "flex", height: "100%", width: "100%" }}
        >
          {chatSide === "left" ? (
            <>
              <Panel
                defaultSize="28%"
                minSize="20%"
                maxSize="50%"
                className="overflow-hidden rounded-t-lg"
              >
                {chatContent}
              </Panel>
              <Handle />
              <Panel
                defaultSize="72%"
                minSize="40%"
                className="overflow-hidden rounded-t-lg"
              >
                <div className="h-full">{children}</div>
              </Panel>
            </>
          ) : (
            <>
              <Panel
                defaultSize="72%"
                minSize="40%"
                className="overflow-hidden rounded-t-lg"
              >
                <div className="h-full">{children}</div>
              </Panel>
              <Handle />
              <Panel
                defaultSize="28%"
                minSize="20%"
                maxSize="50%"
                className="overflow-hidden rounded-t-lg"
              >
                {chatContent}
              </Panel>
            </>
          )}
        </Group>
      </div>
    );
  }

  // Tablet: simple flex row, no resize
  return (
    <div className="min-h-0 flex-1">
      <div className="flex h-full w-full">
        <div className="min-w-0 flex-1">{children}</div>
        <div className="w-80 shrink-0">{chatContent}</div>
      </div>
    </div>
  );
}

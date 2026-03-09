"use client";

import { useState, useRef, useCallback, type ReactNode } from "react";
import { useCopilotChatStream } from "@/lib/hooks/use-copilot-chat-stream";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatWidget } from "@/components/ChatWidget";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send,
  Sparkles,
  GripVertical,
  PanelLeft,
  PanelRight,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PortalLayoutProps {
  portal: string;
  chatTitle: string;
  welcomeMessage: string;
  chatPlaceholder: string;
  children: ReactNode;
}

export function PortalLayout({
  portal,
  chatTitle,
  welcomeMessage,
  chatPlaceholder,
  children,
}: PortalLayoutProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatSide, setChatSide] = useState<"left" | "right">("right");
  const [sidebarWidth, setSidebarWidth] = useState<number | null>(null);
  const dragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    input,
    setInput,
    loading,
    toolStatus,
    handleSubmit,
    scrollRef,
  } = useCopilotChatStream(portal, welcomeMessage);

  /* ── Drag-to-resize handle ─────────────────────────────── */
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      dragging.current = true;
      const startX = e.clientX;
      const startW = sidebarWidth ?? 320;

      const onMove = (ev: PointerEvent) => {
        if (!dragging.current) return;
        const delta =
          chatSide === "right" ? startX - ev.clientX : ev.clientX - startX;
        const container = containerRef.current;
        if (!container) return;
        const maxW = container.offsetWidth * 0.5;
        const newW = Math.max(240, Math.min(maxW, startW + delta));
        setSidebarWidth(newW);
      };

      const onUp = () => {
        dragging.current = false;
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
      };

      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    },
    [sidebarWidth, chatSide],
  );

  const chatContent = (
    <div
      className="flex h-full flex-col overflow-hidden"
      data-tour-step-id={`${portal}-chat`}
    >
      {/* Chat header */}
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <div className="flex size-6 items-center justify-center rounded bg-accent/10">
          <Sparkles className="size-3.5 text-accent" />
        </div>
        <h3 className="flex-1 text-sm font-semibold">{chatTitle}</h3>
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hidden size-7 @[700px]/portal:inline-flex"
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

  return (
    <div ref={containerRef} className="@container/portal min-h-0 flex-1">
      <div
        className={`flex h-full gap-3 ${chatSide === "left" ? "flex-row-reverse" : ""}`}
      >
        {/* Data panel */}
        <div className="min-w-0 flex-1 overflow-hidden rounded-lg border bg-card">
          {children}
        </div>

        {/* Resize handle — only when sidebar is shown */}
        <div
          onPointerDown={onPointerDown}
          className="
            hidden @[700px]/portal:flex
            w-1 cursor-col-resize items-center justify-center
            rounded-full bg-border/40 hover:bg-accent/30 active:bg-accent/50
            select-none touch-none
          "
        >
          <GripVertical className="size-3 text-muted-foreground" />
        </div>

        {/* Chat sidebar — shown when container is wide enough */}
        <aside
          className="hidden @[700px]/portal:flex shrink-0 flex-col overflow-hidden rounded-lg border bg-card"
          style={{ width: sidebarWidth ?? "clamp(280px, 28%, 420px)" }}
        >
          {chatContent}
        </aside>
      </div>

      {/* Floating chat widget — visible only when sidebar is hidden (narrow) */}
      <div className="@[700px]/portal:hidden">
        <ChatWidget open={chatOpen} onToggle={() => setChatOpen((o) => !o)}>
          {chatContent}
        </ChatWidget>
      </div>
    </div>
  );
}

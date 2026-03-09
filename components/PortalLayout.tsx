"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import {
  useCopilotAction,
  useCopilotReadable,
  useCopilotChat,
} from "@copilotkit/react-core";
import { CopilotChat } from "@copilotkit/react-ui";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
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

  const isMobile = !useMediaQuery("(min-width: 768px)");
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  // AI-readable: layout state
  useCopilotReadable({
    description:
      "Portal layout state including chat panel position and visibility",
    value: {
      chatSide,
      chatOpen,
      isMobile,
      isDesktop,
      layout: isMobile
        ? "mobile-sheet"
        : isDesktop
          ? "desktop-resizable"
          : "tablet-fixed",
    },
  });

  // AI action: move chat panel
  useCopilotAction({
    name: "set_chat_position",
    description:
      "Move the chat panel to the left or right side of the layout (desktop only)",
    parameters: [
      {
        name: "side",
        type: "string",
        description: "Which side to place the chat panel",
        required: true,
        enum: ["left", "right"],
      },
    ],
    handler: ({ side }) => {
      setChatSide(side as "left" | "right");
      return `Chat moved to ${side} side`;
    },
  });

  // AI action: toggle chat panel (mobile)
  useCopilotAction({
    name: "toggle_chat_panel",
    description:
      "Open or close the chat panel (primarily for mobile bottom sheet)",
    parameters: [
      {
        name: "open",
        type: "boolean",
        description: "Whether to open (true) or close (false) the chat panel",
        required: true,
      },
    ],
    handler: ({ open }) => {
      setChatOpen(open);
      return open ? "Chat panel opened" : "Chat panel closed";
    },
  });

  const { stopGeneration } = useCopilotChat();

  const handleStopGeneration = useCallback(() => {
    stopGeneration?.();
  }, [stopGeneration]);

  const chatContent = (
    <div
      className="flex h-full flex-col overflow-hidden bg-card"
      data-tour-step-id={`${portal}-chat`}
    >
      {/* Chat header with side toggle */}
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

      {/* CopilotChat — the actual chat UI from CopilotKit */}
      <CopilotChat
        labels={{
          initial: welcomeMessage,
          title: chatTitle,
          placeholder: chatPlaceholder,
        }}
        onStopGeneration={handleStopGeneration}
        className="flex-1 [&_.copilotKitHeader]:hidden"
      />
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
      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border bg-card">
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
                className="overflow-hidden"
              >
                {chatContent}
              </Panel>
              <Handle />
              <Panel
                defaultSize="72%"
                minSize="40%"
                className="overflow-hidden"
              >
                <div className="h-full">{children}</div>
              </Panel>
            </>
          ) : (
            <>
              <Panel
                defaultSize="72%"
                minSize="40%"
                className="overflow-hidden"
              >
                <div className="h-full">{children}</div>
              </Panel>
              <Handle />
              <Panel
                defaultSize="28%"
                minSize="20%"
                maxSize="50%"
                className="overflow-hidden"
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
    <div className="min-h-0 flex-1 overflow-hidden rounded-lg border bg-card">
      <div className="flex h-full w-full">
        <div className="min-w-0 flex-1">{children}</div>
        <div className="w-80 shrink-0 border-l">{chatContent}</div>
      </div>
    </div>
  );
}

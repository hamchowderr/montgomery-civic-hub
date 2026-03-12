"use client";

import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import {
  Briefcase,
  Building2,
  FlaskConical,
  GripVertical,
  type LucideIcon,
  MessageCircle,
  PanelLeft,
  PanelRight,
  Shield,
  X,
} from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { PortalChat } from "@/components/PortalChat";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const portalIcons: Record<string, LucideIcon> = {
  resident: Shield,
  business: Briefcase,
  citystaff: Building2,
  researcher: FlaskConical,
};

interface PortalLayoutProps {
  portal: string;
  chatTitle: string;
  welcomeMessage: string;
  chatPlaceholder: string;
  children: ReactNode;
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });
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
    description: "Portal layout state including chat panel position and visibility",
    value: {
      chatSide,
      chatOpen,
      isMobile,
      isDesktop,
      layout: isMobile ? "mobile-sheet" : isDesktop ? "desktop-resizable" : "tablet-fixed",
    },
  });

  // AI action: move chat panel
  useCopilotAction({
    name: "set_chat_position",
    description: "Move the chat panel to the left or right side of the layout (desktop only)",
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
    description: "Open or close the chat panel (primarily for mobile bottom sheet)",
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

  const Icon = portalIcons[portal] ?? Shield;

  const chatContent = (
    <div
      className="flex h-full max-h-full flex-col overflow-hidden bg-card"
      data-tour-step-id={`${portal}-chat`}
    >
      {/* Chat header with portal-specific icon */}
      <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded bg-accent/10">
            <Icon className="size-3.5 text-accent" />
          </div>
          <h3 className="text-sm font-semibold">{chatTitle}</h3>
        </div>
        <div className="flex items-center gap-2">
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => setChatOpen(false)}
            >
              <X className="size-3.5" />
            </Button>
          )}
          <div className="hidden lg:block">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => setChatSide((s) => (s === "right" ? "left" : "right"))}
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
      </div>

      {/* CopilotKit chat — handles streaming, markdown, auto-scroll, tool calls */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <PortalChat
          portal={portal}
          welcomeMessage={welcomeMessage}
          chatPlaceholder={chatPlaceholder}
        />
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="min-h-0 flex-1">
        <div className="h-full">{children}</div>

        <Button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-4 right-4 z-50 size-14 rounded-full shadow-lg bg-accent text-accent-foreground hover:bg-accent/90 md:hidden"
        >
          <MessageCircle className="size-6" />
        </Button>

        <Sheet open={chatOpen} onOpenChange={setChatOpen}>
          <SheetContent
            side="bottom"
            className="h-[85dvh] max-h-[85dvh] p-0 [&>button.absolute]:hidden"
          >
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
              <Panel defaultSize="28%" minSize="20%" maxSize="50%" className="overflow-hidden">
                {chatContent}
              </Panel>
              <Handle />
              <Panel defaultSize="72%" minSize="40%" className="overflow-hidden">
                <div className="h-full">{children}</div>
              </Panel>
            </>
          ) : (
            <>
              <Panel defaultSize="72%" minSize="40%" className="overflow-hidden">
                <div className="h-full">{children}</div>
              </Panel>
              <Handle />
              <Panel defaultSize="28%" minSize="20%" maxSize="50%" className="overflow-hidden">
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
        <div className="w-[clamp(280px,30%,360px)] shrink-0 border-l">{chatContent}</div>
      </div>
    </div>
  );
}

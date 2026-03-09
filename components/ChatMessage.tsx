"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { User, Sparkles } from "lucide-react";

interface ToolCall {
  name: string;
  status: string;
}

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
}

export function ChatMessage({ role, content, toolCalls }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex w-full gap-2.5",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {/* Avatar for assistant */}
      {!isUser && (
        <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded bg-accent/10">
          <Sparkles className="size-3 text-accent" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[80%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground",
        )}
      >
        <p className="whitespace-pre-wrap">{content}</p>
        {toolCalls && toolCalls.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {toolCalls.map((tool, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="text-xs font-normal"
              >
                {tool.name}
                {tool.status && (
                  <span className="ml-1 opacity-70">({tool.status})</span>
                )}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Avatar for user */}
      {isUser && (
        <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded bg-primary/10">
          <User className="size-3 text-primary" />
        </div>
      )}
    </div>
  );
}

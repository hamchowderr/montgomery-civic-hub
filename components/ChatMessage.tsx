"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-2 text-sm",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-card text-card-foreground border",
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
    </div>
  );
}

"use client";

import { User } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ToolCall {
  name: string;
  status: string;
}

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
  isStreaming?: boolean;
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-0.5">
      <span className="size-1.5 animate-[bounce_1.2s_ease-in-out_infinite] rounded-full bg-current" />
      <span className="size-1.5 animate-[bounce_1.2s_ease-in-out_0.2s_infinite] rounded-full bg-current" />
      <span className="size-1.5 animate-[bounce_1.2s_ease-in-out_0.4s_infinite] rounded-full bg-current" />
    </span>
  );
}

export function ChatMessage({ role, content, toolCalls, isStreaming }: ChatMessageProps) {
  const isUser = role === "user";
  const isThinking = content === "Thinking...";

  return (
    <div
      className={cn(
        "flex w-full gap-2.5 animate-[chatFadeIn_0.3s_ease-out_both]",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {/* Avatar for assistant — Montgomery seal */}
      {!isUser && (
        <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center overflow-hidden rounded">
          <Image
            src="/montgomery-seal.png"
            alt="Montgomery"
            width={24}
            height={24}
            sizes="24px"
            className="size-6 object-cover"
          />
        </div>
      )}

      <div
        className={cn(
          "max-w-[80%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
        )}
      >
        {isThinking ? <TypingDots /> : <p className="whitespace-pre-wrap">{content}</p>}
        {isStreaming && !isThinking && (
          <span className="ml-0.5 inline-block h-4 w-0.5 animate-[blink_1s_step-end_infinite] bg-current align-text-bottom" />
        )}
        {toolCalls && toolCalls.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {toolCalls.map((tool, i) => (
              <Badge key={i} variant="secondary" className="text-xs font-normal">
                {tool.name}
                {tool.status && <span className="ml-1 opacity-70">({tool.status})</span>}
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

"use client";

import type { AssistantMessageProps } from "@copilotkit/react-ui";
import { CopilotChat, Markdown } from "@copilotkit/react-ui";
import Image from "next/image";
import "@copilotkit/react-ui/styles.css";

/**
 * Custom assistant message that uses the Montgomery seal as the avatar
 * and renders markdown with the CopilotKit built-in renderer.
 */
function MontgomeryAssistantMessage({
  message,
  isLoading,
  isGenerating,
  markdownTagRenderers,
}: AssistantMessageProps) {
  const content = message?.content || "";
  const hasToolCalls =
    !!(message as Record<string, unknown>)?.toolCalls &&
    Array.isArray((message as Record<string, unknown>).toolCalls) &&
    ((message as Record<string, unknown>).toolCalls as unknown[]).length > 0;

  // Hide empty tool-call messages (e.g. frontend action executions that
  // CopilotKit wraps with a default generativeUI producing empty bubbles)
  if (!content && hasToolCalls) {
    return null;
  }

  const subComponent = message?.generativeUI?.();

  // Hide empty messages with no sub-component and not loading
  if (!content && !subComponent && !isLoading) {
    return null;
  }

  return (
    <div className="flex gap-2.5">
      <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center overflow-hidden rounded">
        <Image
          src="/montgomery-seal.png"
          alt="Montgomery"
          width={24}
          height={24}
          className="size-6 object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        {subComponent && <div className="mb-2">{subComponent}</div>}
        {content ? (
          <div className="copilotKitMessage copilotKitAssistantMessage">
            <Markdown content={content} components={markdownTagRenderers} />
          </div>
        ) : isLoading ? (
          <div className="copilotKitMessage copilotKitAssistantMessage">
            <span className="inline-flex items-center gap-1 py-0.5">
              <span className="size-1.5 animate-[bounce_1.2s_ease-in-out_infinite] rounded-full bg-current" />
              <span className="size-1.5 animate-[bounce_1.2s_ease-in-out_0.2s_infinite] rounded-full bg-current" />
              <span className="size-1.5 animate-[bounce_1.2s_ease-in-out_0.4s_infinite] rounded-full bg-current" />
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

interface PortalChatProps {
  portal: string;
  welcomeMessage: string;
  chatPlaceholder: string;
}

export function PortalChat({ portal, welcomeMessage, chatPlaceholder }: PortalChatProps) {
  return (
    <CopilotChat
      className="copilot-portal-chat h-full"
      labels={
        {
          initial: welcomeMessage,
          placeholder: chatPlaceholder,
          title: "",
          poweredBy: "Powered by Otaku Solutions",
        } as Record<string, string>
      }
      AssistantMessage={MontgomeryAssistantMessage}
    />
  );
}

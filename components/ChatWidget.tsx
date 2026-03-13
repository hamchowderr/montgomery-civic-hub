"use client";

import { type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MessageCircle, X } from "@/components/icons";
import { Button } from "@/components/ui/button";

interface ChatWidgetProps {
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}

/**
 * Floating chat widget for narrow viewports.
 * Renders a FAB that expands into an overlay card with spring animation.
 * Chat content is passed as children so state is shared with the sidebar.
 */
export function ChatWidget({ open, onToggle, children }: ChatWidgetProps) {
  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Chat card overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="fixed bottom-20 right-3 left-3 z-50 mx-auto h-[70vh] max-h-[600px] max-w-[420px] overflow-hidden rounded-2xl border bg-card shadow-2xl sm:left-auto sm:right-4 sm:w-[380px]"
          >
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="absolute right-2 top-2 z-10 size-7 rounded-full"
            >
              <X size={14} />
            </Button>
            {children}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="fixed bottom-4 right-4 z-50"
          >
            <Button
              onClick={onToggle}
              className="size-14 rounded-full shadow-lg shadow-accent/20 bg-accent text-accent-foreground hover:bg-accent/90 hover:scale-105 hover:shadow-xl transition-transform"
              aria-label="Open chat"
            >
              <MessageCircle size={24} />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

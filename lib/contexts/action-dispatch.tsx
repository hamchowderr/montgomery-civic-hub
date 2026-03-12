"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef } from "react";

type ActionHandler = (args: Record<string, unknown>) => void;

interface ActionDispatchContextValue {
  register: (name: string, handler: ActionHandler) => () => void;
  dispatch: (name: string, args: Record<string, unknown>) => void;
}

const ActionDispatchContext = createContext<ActionDispatchContextValue | null>(null);

export function ActionDispatchProvider({ children }: { children: ReactNode }) {
  const handlers = useRef(new Map<string, ActionHandler>());

  const register = useCallback((name: string, handler: ActionHandler) => {
    handlers.current.set(name, handler);
    return () => {
      handlers.current.delete(name);
    };
  }, []);

  const dispatch = useCallback((name: string, args: Record<string, unknown>) => {
    const handler = handlers.current.get(name);
    if (handler) {
      handler(args);
    } else {
      console.warn(`[ActionDispatch] No handler registered for "${name}"`);
    }
  }, []);

  return (
    <ActionDispatchContext.Provider value={{ register, dispatch }}>
      {children}
    </ActionDispatchContext.Provider>
  );
}

/**
 * Register a frontend action handler that the AI agent can trigger.
 * Components call this alongside useCopilotAction to bridge the gap
 * between AG-UI tool call events and actual frontend execution.
 */
export function useRegisterAction(name: string, handler: ActionHandler) {
  const ctx = useContext(ActionDispatchContext);
  // Stable ref to avoid re-registering on every render
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!ctx) return;
    return ctx.register(name, (args) => handlerRef.current(args));
  }, [ctx, name]);
}

export function useActionDispatch() {
  const ctx = useContext(ActionDispatchContext);
  return ctx?.dispatch ?? null;
}

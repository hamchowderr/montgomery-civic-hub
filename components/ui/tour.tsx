"use client";

import Link from "next/link";
import * as React from "react";
import { createPortal } from "react-dom";
import { XIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TourContext = React.createContext<{
  start: (tourId: string) => void;
  close: () => void;
} | null>(null);

function useTour() {
  const context = React.useContext(TourContext);
  if (!context) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return context;
}

interface Step {
  id: string;
  title: React.ReactNode;
  content: React.ReactNode;
  clickTarget?: boolean;
  nextRoute?: string;
  previousRoute?: string;
  nextLabel?: React.ReactNode;
  previousLabel?: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  sideOffset?: number;
  align?: "start" | "center" | "end";
  alignOffset?: number;
  className?: string;
}

interface Tour {
  id: string;
  steps: Step[];
}

function TourProvider({ tours, children }: { tours: Tour[]; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeTourId, setActiveTourId] = React.useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);

  const activeTour = tours.find((tour) => tour.id === activeTourId);
  const steps = activeTour?.steps || [];

  function next() {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setIsOpen(false);
      setCurrentStepIndex(0);
      setActiveTourId(null);
      switchToMapTab();
    }
  }

  function previous() {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }

  function switchToMapTab() {
    const mapTab = document.querySelector('[data-tour-step-id$="-map-view"]') as HTMLElement | null;
    if (mapTab) {
      mapTab.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true }));
      mapTab.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
      mapTab.click();
      mapTab.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, cancelable: true }));
      mapTab.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true }));
    }
  }

  function close() {
    setIsOpen(false);
    setCurrentStepIndex(0);
    setActiveTourId(null);
    switchToMapTab();
  }

  function start(tourId: string) {
    const tour = tours.find((tour) => tour.id === tourId);
    if (tour) {
      if (tour.steps.length > 0) {
        setActiveTourId(tourId);
        setIsOpen(true);
        setCurrentStepIndex(0);
      } else {
        console.error(`Tour with id '${tourId}' has no steps.`);
      }
    } else {
      console.error(`Tour with id '${tourId}' not found.`);
    }
  }

  return (
    <TourContext.Provider
      value={{
        start,
        close,
      }}
    >
      {children}
      {isOpen && activeTour && steps.length > 0 && (
        <TourOverlay
          step={steps[currentStepIndex]}
          currentStepIndex={currentStepIndex}
          totalSteps={steps.length}
          onNext={next}
          onPrevious={previous}
          onClose={close}
        />
      )}
    </TourContext.Provider>
  );
}

// ── Viewport-clamped positioning ──────────────────────────────────────────────

const PADDING = 12; // min distance from viewport edge
const GAP = 10; // gap between target and card

interface CardPosition {
  top: number;
  left: number;
  maxWidth: number;
  maxHeight: number;
}

function computeCardPosition(
  targetRect: {
    top: number;
    left: number;
    width: number;
    height: number;
    bottom: number;
    right: number;
  } | null,
  cardWidth: number,
  cardHeight: number,
  side: Step["side"] = "bottom",
  sideOffset: number = 0,
): CardPosition {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const maxW = Math.min(360, vw - PADDING * 2);
  const maxH = vh - PADDING * 2;

  // No target: center on screen
  if (!targetRect) {
    return {
      top: Math.max(PADDING, (vh - Math.min(cardHeight, maxH)) / 2),
      left: Math.max(PADDING, (vw - Math.min(cardWidth, maxW)) / 2),
      maxWidth: maxW,
      maxHeight: maxH,
    };
  }

  const gap = GAP + sideOffset;
  let top = 0;
  let left = 0;

  // Try preferred side, then fallback
  const sides: Array<"bottom" | "top" | "left" | "right"> = [
    side || "bottom",
    ...(["bottom", "top", "left", "right"] as const).filter((s) => s !== side),
  ];

  for (const s of sides) {
    if (s === "bottom") {
      top = targetRect.bottom + gap;
      left = targetRect.left + targetRect.width / 2 - cardWidth / 2;
      if (top + cardHeight <= vh - PADDING) break;
    } else if (s === "top") {
      top = targetRect.top - gap - cardHeight;
      left = targetRect.left + targetRect.width / 2 - cardWidth / 2;
      if (top >= PADDING) break;
    } else if (s === "right") {
      top = targetRect.top + targetRect.height / 2 - cardHeight / 2;
      left = targetRect.right + gap;
      if (left + cardWidth <= vw - PADDING) break;
    } else if (s === "left") {
      top = targetRect.top + targetRect.height / 2 - cardHeight / 2;
      left = targetRect.left - gap - cardWidth;
      if (left >= PADDING) break;
    }
  }

  // Clamp within viewport
  left = Math.max(PADDING, Math.min(left, vw - cardWidth - PADDING));
  top = Math.max(PADDING, Math.min(top, vh - cardHeight - PADDING));

  return { top, left, maxWidth: maxW, maxHeight: maxH };
}

// ── Tour Overlay ──────────────────────────────────────────────────────────────

function TourOverlay({
  step,
  currentStepIndex,
  totalSteps,
  onNext,
  onPrevious,
  onClose,
}: {
  step: Step;
  currentStepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
}) {
  const [targets, setTargets] = React.useState<{ rect: DOMRect; radius: number }[]>([]);
  const [isMobile, setIsMobile] = React.useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [cardPos, setCardPos] = React.useState<CardPosition>({
    top: 0,
    left: 0,
    maxWidth: 360,
    maxHeight: 600,
  });
  const [cardReady, setCardReady] = React.useState(false);

  // Detect mobile
  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Find target elements
  React.useEffect(() => {
    let hasClicked = false;
    let clickTimer: ReturnType<typeof setTimeout> | null = null;
    setCardReady(false);

    function updatePosition() {
      const elements = document.querySelectorAll(`[data-tour-step-id*='${step.id}']`);

      const validElements: {
        rect: DOMRect;
        radius: number;
        element: Element;
      }[] = [];

      Array.from(elements).forEach((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return;

        const style = window.getComputedStyle(element);
        const radius = parseInt(style.borderRadius) || 4;

        validElements.push({ rect, radius, element });
      });

      setTargets(validElements.map(({ rect, radius }) => ({ rect, radius })));

      if (validElements.length > 0 && !hasClicked) {
        hasClicked = true;
        const el = validElements[0].element as HTMLElement;

        // Click the target (e.g. to switch tabs)
        // Radix UI uses pointerdown for activation, so dispatch that too
        if (step.clickTarget) {
          el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true }));
          el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
          el.click();
          el.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, cancelable: true }));
          el.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true }));
          // After click, wait for React to re-render then scroll and reposition
          clickTimer = setTimeout(() => {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            updatePosition();
          }, 150);
        } else {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }

    // Initial delay to let the step's DOM settle before querying
    const initTimer = setTimeout(() => {
      updatePosition();

      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true);

      observer.observe(document.body, {
        attributes: true,
        childList: true,
        subtree: true,
      });
      resizeObserver.observe(document.body);
    }, 50);

    const observer = new MutationObserver(() => updatePosition());
    const resizeObserver = new ResizeObserver(() => updatePosition());

    return () => {
      clearTimeout(initTimer);
      if (clickTimer) clearTimeout(clickTimer);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      observer.disconnect();
      resizeObserver.disconnect();
    };
  }, [step]);

  // Position the card after it renders
  React.useEffect(() => {
    if (isMobile) {
      setCardReady(true);
      return;
    }

    const card = cardRef.current;
    if (!card) return;

    // Use a small delay to let the card render and get its dimensions
    const raf = requestAnimationFrame(() => {
      const cardRect = card.getBoundingClientRect();
      const targetRect = targets.length > 0 ? targets[0].rect : null;
      const pos = computeCardPosition(
        targetRect,
        cardRect.width,
        cardRect.height,
        step.side,
        step.sideOffset,
      );
      setCardPos(pos);
      setCardReady(true);
    });

    return () => cancelAnimationFrame(raf);
  }, [targets, step.side, step.sideOffset, isMobile]);

  // Lock body scroll
  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (typeof document === "undefined") return null;

  const hasTarget = targets.length > 0;

  const progressDots = (
    <div className="flex items-center justify-center gap-1.5 pt-1">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "size-1.5 rounded-full transition-colors",
            i === currentStepIndex ? "bg-primary" : "bg-muted-foreground/30",
          )}
        />
      ))}
    </div>
  );

  const navButtons = (
    <div className="flex items-center gap-2">
      {currentStepIndex > 0 &&
        (step.previousRoute ? (
          <Button variant="outline" size="sm" onClick={onPrevious} asChild>
            <Link href={step.previousRoute}>{step.previousLabel ?? "Back"}</Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={onPrevious}>
            {step.previousLabel ?? "Back"}
          </Button>
        ))}
      {step.nextRoute ? (
        <Button size="sm" onClick={onNext} asChild>
          <Link href={step.nextRoute}>
            {step.nextLabel ?? (currentStepIndex === totalSteps - 1 ? "Done" : "Next")}
          </Link>
        </Button>
      ) : (
        <Button size="sm" onClick={onNext}>
          {step.nextLabel ?? (currentStepIndex === totalSteps - 1 ? "Done" : "Next")}
        </Button>
      )}
    </div>
  );

  // ── Mobile layout: fixed bottom card ──────────────────────────────────────

  if (isMobile) {
    return createPortal(
      <div className="fixed inset-0 z-[9999]">
        {/* Dimmed overlay with highlight cutouts */}
        {hasTarget && (
          <svg className="absolute inset-0 size-full">
            <defs>
              <mask id="tour-mask-mobile">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                {targets.map((target, i) => (
                  <rect
                    key={i}
                    x={target.rect.left - 4}
                    y={target.rect.top - 4}
                    width={target.rect.width + 8}
                    height={target.rect.height + 8}
                    rx={target.radius + 2}
                    fill="black"
                  />
                ))}
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              mask="url(#tour-mask-mobile)"
              className="fill-black/40"
            />
            {targets.map((target, i) => (
              <rect
                key={i}
                x={target.rect.left - 4}
                y={target.rect.top - 4}
                width={target.rect.width + 8}
                height={target.rect.height + 8}
                rx={target.radius + 2}
                className="fill-none stroke-primary stroke-2"
              />
            ))}
          </svg>
        )}

        {/* Dismiss overlay click */}
        {!hasTarget && <div className="absolute inset-0 bg-black/40" onClick={onClose} />}

        {/* Bottom card */}
        <div className="absolute inset-x-0 bottom-0 p-3 animate-in slide-in-from-bottom-4 duration-200">
          <div className={cn("rounded-2xl border bg-card p-4 shadow-2xl", step.className)}>
            {/* Header */}
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold leading-tight">{step.title}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Step {currentStepIndex + 1} of {totalSteps}
                </p>
              </div>
              <button
                onClick={onClose}
                className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <XIcon size={16} />
              </button>
            </div>

            {/* Content */}
            <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{step.content}</p>

            {/* Footer */}
            <div className="flex items-center justify-between">
              {progressDots}
              <div className="ml-auto">{navButtons}</div>
            </div>
          </div>
        </div>
      </div>,
      document.body,
    );
  }

  // ── Desktop layout: positioned card near target ───────────────────────────

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      {/* Dimmed overlay with highlight cutouts */}
      <svg className="absolute inset-0 size-full">
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targets.map((target, i) => (
              <rect
                key={i}
                x={target.rect.left - 4}
                y={target.rect.top - 4}
                width={target.rect.width + 8}
                height={target.rect.height + 8}
                rx={target.radius + 2}
                fill="black"
              />
            ))}
          </mask>
        </defs>
        <rect width="100%" height="100%" mask="url(#tour-mask)" className="fill-black/40" />
        {hasTarget &&
          targets.map((target, i) => (
            <rect
              key={i}
              x={target.rect.left - 4}
              y={target.rect.top - 4}
              width={target.rect.width + 8}
              height={target.rect.height + 8}
              rx={target.radius + 2}
              className="fill-none stroke-primary stroke-2"
            />
          ))}
      </svg>

      {/* Dismiss click on overlay (not on the card) */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Positioned card */}
      <div
        ref={cardRef}
        className={cn(
          "absolute w-[340px] animate-in fade-in-0 zoom-in-95 duration-200",
          !cardReady && "opacity-0",
          step.className,
        )}
        style={
          cardReady
            ? {
                top: cardPos.top,
                left: cardPos.left,
                maxWidth: cardPos.maxWidth,
                maxHeight: cardPos.maxHeight,
              }
            : {
                // Render off-screen to measure dimensions
                top: -9999,
                left: -9999,
              }
        }
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-xl border bg-card shadow-xl">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 p-4 pb-2">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold leading-tight">{step.title}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Step {currentStepIndex + 1} of {totalSteps}
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <XIcon size={14} />
            </button>
          </div>

          {/* Content */}
          <div className="px-4 pb-3">
            <p className="text-sm leading-relaxed text-muted-foreground">{step.content}</p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t px-4 py-3">
            {progressDots}
            <div className="ml-auto">{navButtons}</div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export { TourProvider, useTour, type Step, type Tour };

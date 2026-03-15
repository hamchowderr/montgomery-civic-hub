"use client";

import { useEffect, useState } from "react";

export interface FoldableState {
  /** Device is a foldable currently in unfolded/spanning mode */
  isFoldable: boolean;
  /** The fold runs vertically (left/right segments) — most common for landscape foldables */
  isVerticalFold: boolean;
  /** The fold runs horizontally (top/bottom segments) */
  isHorizontalFold: boolean;
  /** Viewport segments from the Viewport Segments API (if available) */
  segments: DOMRect[];
  /** Width of the fold/hinge area in pixels (0 if not detectable) */
  foldWidth: number;
}

const INITIAL_STATE: FoldableState = {
  isFoldable: false,
  isVerticalFold: false,
  isHorizontalFold: false,
  segments: [],
  foldWidth: 0,
};

/**
 * Detect foldable devices and their fold state using:
 * 1. CSS env() viewport segments (Chrome 111+ on foldables)
 * 2. Screen Spanning API (experimental)
 * 3. Device heuristics for known foldables (Pixel Fold, Galaxy Fold, etc.)
 *
 * Returns fold geometry so layouts can place content around the fold/hinge.
 */
export function useFoldableDevice(): FoldableState {
  const [state, setState] = useState<FoldableState>(INITIAL_STATE);

  useEffect(() => {
    function detect(): FoldableState {
      // Method 1: Viewport Segments API (Chrome 111+ on foldables)
      // visualViewport.segments returns an array of DOMRects for each segment
      const vv = window.visualViewport as VisualViewport & {
        segments?: DOMRect[];
      };
      if (vv?.segments && vv.segments.length > 1) {
        const segs = vv.segments;
        // Determine fold orientation from segment positions
        const isVertical = segs[0].x !== segs[1].x; // segments side by side = vertical fold
        const isHorizontal = segs[0].y !== segs[1].y; // segments top/bottom = horizontal fold
        const foldWidth = isVertical
          ? segs[1].x - (segs[0].x + segs[0].width)
          : isHorizontal
            ? segs[1].y - (segs[0].y + segs[0].height)
            : 0;

        return {
          isFoldable: true,
          isVerticalFold: isVertical,
          isHorizontalFold: isHorizontal,
          segments: Array.from(segs),
          foldWidth: Math.max(0, foldWidth),
        };
      }

      // Method 2: CSS environment variables for viewport segments
      // env(viewport-segment-width 0 0) etc. — test via computed style
      const testEl = document.createElement("div");
      testEl.style.cssText =
        "position:fixed;visibility:hidden;width:env(viewport-segment-width 0 0,0px)";
      document.body.appendChild(testEl);
      const segWidth = parseFloat(getComputedStyle(testEl).width);
      document.body.removeChild(testEl);
      if (segWidth > 0 && segWidth < window.innerWidth * 0.9) {
        const foldWidth = window.innerWidth - segWidth * 2;
        return {
          isFoldable: true,
          isVerticalFold: true,
          isHorizontalFold: false,
          segments: [
            new DOMRect(0, 0, segWidth, window.innerHeight),
            new DOMRect(
              segWidth + foldWidth,
              0,
              segWidth,
              window.innerHeight,
            ),
          ],
          foldWidth: Math.max(0, foldWidth),
        };
      }

      // Method 3: Device heuristics for known foldables
      // Pixel 9 Pro Fold unfolded: ~884dp wide inner display
      // Galaxy Z Fold: ~884dp wide inner display
      // These devices have an aspect ratio close to 1:1 when unfolded
      const ua = navigator.userAgent;
      const dpr = window.devicePixelRatio || 1;
      const screenW = window.screen.width;
      const screenH = window.screen.height;
      const aspectRatio = Math.max(screenW, screenH) / Math.min(screenW, screenH);

      const isFoldableUA =
        /Pixel.*Fold/i.test(ua) ||
        /SM-F9/i.test(ua) || // Galaxy Z Fold 5/6
        /SM-F7/i.test(ua) || // Galaxy Z Flip
        /Galaxy.*Fold/i.test(ua) ||
        /Surface.*Duo/i.test(ua);

      // Foldable unfolded heuristic: near-square aspect ratio on Android
      const isNearSquareAndroid =
        /Android/i.test(ua) && aspectRatio < 1.2 && Math.min(screenW, screenH) > 600;

      if (isFoldableUA || isNearSquareAndroid) {
        // Can't determine exact fold position without APIs, estimate center
        const halfW = Math.floor(window.innerWidth / 2);
        const estimatedFoldWidth = isFoldableUA ? 8 : 0; // physical hinge ~8px

        return {
          isFoldable: true,
          isVerticalFold: true,
          isHorizontalFold: false,
          segments: [
            new DOMRect(0, 0, halfW, window.innerHeight),
            new DOMRect(
              halfW + estimatedFoldWidth,
              0,
              halfW - estimatedFoldWidth,
              window.innerHeight,
            ),
          ],
          foldWidth: estimatedFoldWidth,
        };
      }

      return INITIAL_STATE;
    }

    setState(detect());

    // Re-detect on resize (fold/unfold changes viewport)
    const onResize = () => setState(detect());
    window.addEventListener("resize", onResize);

    // Screen Spanning API change event (if available)
    const screen = window.screen as Screen & {
      addEventListener?: (type: string, handler: () => void) => void;
      removeEventListener?: (type: string, handler: () => void) => void;
    };
    screen.addEventListener?.("change", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      screen.removeEventListener?.("change", onResize);
    };
  }, []);

  return state;
}

"use client";

import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";
import type { HTMLAttributes } from "react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

import { cn } from "@/lib/utils";

export interface HardHatIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface HardHatIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const HAT_VARIANTS: Variants = {
  normal: {
    y: 0,
    transition: { duration: 0.3 },
  },
  animate: {
    y: [0, -3, 0],
    transition: {
      duration: 0.5,
      times: [0, 0.4, 1],
      ease: "easeInOut",
    },
  },
};

const HardHatIcon = forwardRef<HardHatIconHandle, HardHatIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const controls = useAnimation();
    const isControlledRef = useRef(false);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;
      return {
        startAnimation: () => controls.start("animate"),
        stopAnimation: () => controls.start("normal"),
      };
    });

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (isControlledRef.current) {
          onMouseEnter?.(e);
        } else {
          controls.start("animate");
        }
      },
      [controls, onMouseEnter],
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (isControlledRef.current) {
          onMouseLeave?.(e);
        } else {
          controls.start("normal");
        }
      },
      [controls, onMouseLeave],
    );

    return (
      <div
        className={cn("inline-flex items-center justify-center", className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <svg
          fill="none"
          height={size}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          <motion.g animate={controls} initial="normal" variants={HAT_VARIANTS}>
            <path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z" />
            <path d="M10 15V6.5a3.5 3.5 0 0 1 7 0V15" />
            <path d="m4 15 2-6c.5-1.5 1.5-2 3-2" />
          </motion.g>
        </svg>
      </div>
    );
  },
);

HardHatIcon.displayName = "HardHatIcon";

export { HardHatIcon };

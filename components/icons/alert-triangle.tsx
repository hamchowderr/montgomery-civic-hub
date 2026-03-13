"use client";

import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";
import type { HTMLAttributes } from "react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

import { cn } from "@/lib/utils";

export interface AlertTriangleIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface AlertTriangleIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const TRIANGLE_VARIANTS: Variants = {
  normal: {
    scale: 1,
    transition: { duration: 0.3 },
  },
  animate: {
    scale: [1, 1.12, 1, 1.08, 1],
    transition: {
      duration: 0.6,
      times: [0, 0.25, 0.5, 0.75, 1],
      ease: "easeInOut",
    },
  },
};

const EXCLAMATION_VARIANTS: Variants = {
  normal: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
  animate: {
    opacity: [1, 0, 1, 0, 1],
    transition: {
      duration: 0.6,
      times: [0, 0.2, 0.4, 0.6, 1],
    },
  },
};

const AlertTriangleIcon = forwardRef<AlertTriangleIconHandle, AlertTriangleIconProps>(
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
          <motion.path
            animate={controls}
            d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"
            initial="normal"
            variants={TRIANGLE_VARIANTS}
          />
          <motion.g animate={controls} initial="normal" variants={EXCLAMATION_VARIANTS}>
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </motion.g>
        </svg>
      </div>
    );
  },
);

AlertTriangleIcon.displayName = "AlertTriangleIcon";

export { AlertTriangleIcon };

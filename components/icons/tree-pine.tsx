"use client";

import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";
import type { HTMLAttributes } from "react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

import { cn } from "@/lib/utils";

export interface TreePineIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface TreePineIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const TREE_VARIANTS: Variants = {
  normal: {
    rotate: 0,
    transition: { duration: 0.3 },
  },
  animate: {
    rotate: [0, -3, 3, -2, 2, 0],
    transition: {
      duration: 0.7,
      times: [0, 0.2, 0.4, 0.6, 0.8, 1],
      ease: "easeInOut",
    },
  },
};

const TreePineIcon = forwardRef<TreePineIconHandle, TreePineIconProps>(
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
        <motion.svg
          animate={controls}
          fill="none"
          height={size}
          initial="normal"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          variants={TREE_VARIANTS}
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14" />
          <path d="m17 10 3.3 3a1 1 0 0 1-.7 1.7H4.4a1 1 0 0 1-.7-1.7L7 10" />
          <path d="m17 6 2.6 2.4a1 1 0 0 1-.6 1.6H5a1 1 0 0 1-.6-1.6L7 6" />
          <path d="M12 2v20" />
        </motion.svg>
      </div>
    );
  },
);

TreePineIcon.displayName = "TreePineIcon";

export { TreePineIcon };

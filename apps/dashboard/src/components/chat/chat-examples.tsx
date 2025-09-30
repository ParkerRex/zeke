"use client";

import { motion } from "framer-motion";
import { useRef } from "react";
import { useDraggable } from "react-use-draggable-scroll";

const listVariant = {
  hidden: { y: 45, opacity: 0 },
  show: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.3,
      staggerChildren: 0.08,
    },
  },
};

const itemVariant = {
  hidden: { y: 45, opacity: 0 },
  show: { y: 0, opacity: 1 },
};

interface ChatExamplesProps {
  examples: string[];
  onExampleClick: (example: string) => void;
}

export function ChatExamples({ examples, onExampleClick }: ChatExamplesProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  // @ts-expect-error: react-use-draggable-scroll expects a MutableRefObject<HTMLElement>
  const { events } = useDraggable(ref);

  const totalLength = examples.reduce((accumulator, currentString) => {
    return accumulator + currentString.length * 8.2 + 20;
  }, 0);

  return (
    <div className="mt-8">
      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3 text-center">
        Try asking:
      </p>
      <div
        className="overflow-x-auto scrollbar-hide cursor-grabbing"
        {...events}
        ref={ref}
      >
        <motion.ul
          variants={listVariant}
          initial="hidden"
          animate="show"
          className="flex gap-3 items-center justify-center flex-wrap md:flex-nowrap"
          style={{ width: `${totalLength}px`, minWidth: "100%" }}
        >
          {examples.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => onExampleClick(example)}
              className="flex-shrink-0"
            >
              <motion.li
                variants={itemVariant}
                className="text-xs bg-secondary hover:bg-accent transition-colors px-3 py-2 rounded-full cursor-pointer"
              >
                {example}
              </motion.li>
            </button>
          ))}
        </motion.ul>
      </div>
    </div>
  );
}

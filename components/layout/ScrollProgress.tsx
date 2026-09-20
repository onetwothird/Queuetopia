"use client";

import { motion, useScroll, useSpring } from 'framer-motion';

/**
 * Thin reading-progress bar pinned to the top of the viewport.
 * Driven by the document scroll position and smoothed with a spring.
 */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 28,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 h-[3px] origin-left z-[60] bg-gradient-to-r from-white via-white/70 to-white/30"
      style={{ scaleX }}
    />
  );
}
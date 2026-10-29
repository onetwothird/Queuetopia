"use client";

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useSystemPrefs } from './SystemPrefs';

const INTERACTIVE = 'a, button, select, input, textarea, label, [role="button"]';
const IDLE_SIZE = 26;
const PAD = 6;

// A selection frame that trails the pointer and snaps around whatever control
// is under it, like a window manager focusing a target. Pointer-only: it never
// renders on touch screens or when the visitor prefers reduced motion. While it
// is active it replaces the native pointer, so there is only ever one cursor.
export default function CursorEffect() {
  const { cursor } = useSystemPrefs();
  const [supported, setSupported] = useState(false);
  const [visible, setVisible] = useState(false);
  const [locked, setLocked] = useState(false);
  const [pressed, setPressed] = useState(false);
  const targetRef = useRef<Element | null>(null);

  const spring = { stiffness: 520, damping: 38, mass: 0.6 };
  const dotX = useMotionValue(-100);
  const dotY = useMotionValue(-100);
  const x = useSpring(-100, spring);
  const y = useSpring(-100, spring);
  const w = useSpring(IDLE_SIZE, spring);
  const h = useSpring(IDLE_SIZE, spring);

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setSupported(fine.matches && !reduced.matches);
    update();
    fine.addEventListener('change', update);
    reduced.addEventListener('change', update);
    return () => {
      fine.removeEventListener('change', update);
      reduced.removeEventListener('change', update);
    };
  }, []);

  useEffect(() => {
    if (!supported || !cursor) return;
    const root = document.documentElement;
    root.classList.add('custom-cursor');

    const frameTo = (px: number, py: number) => {
      const target = targetRef.current;
      if (target) {
        const r = target.getBoundingClientRect();
        x.set(r.left - PAD);
        y.set(r.top - PAD);
        w.set(r.width + PAD * 2);
        h.set(r.height + PAD * 2);
      } else {
        x.set(px - IDLE_SIZE / 2);
        y.set(py - IDLE_SIZE / 2);
        w.set(IDLE_SIZE);
        h.set(IDLE_SIZE);
      }
    };

    let last = { x: -100, y: -100 };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      last = { x: e.clientX, y: e.clientY };
      dotX.set(e.clientX);
      dotY.set(e.clientY);
      const hit = e.target instanceof Element ? e.target.closest(INTERACTIVE) : null;
      const usable = hit && !(hit as HTMLButtonElement).disabled ? hit : null;
      targetRef.current = usable;
      setLocked(!!usable);
      setVisible(true);
      frameTo(e.clientX, e.clientY);
    };
    const onScroll = () => frameTo(last.x, last.y);
    const onLeave = () => setVisible(false);
    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    return () => {
      root.classList.remove('custom-cursor');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', onScroll);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
    };
  }, [supported, cursor, x, y, w, h, dotX, dotY]);

  if (!supported || !cursor) return null;

  const corner = 'absolute w-2 h-2 border-white';

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] mix-blend-difference" aria-hidden="true">
      <motion.div
        className="absolute top-0 left-0"
        style={{ x, y, width: w, height: h, opacity: visible ? 1 : 0 }}
        animate={{ scale: pressed ? 0.92 : 1 }}
        transition={{ duration: 0.12 }}
      >
        <span className={`${corner} top-0 left-0 border-t border-l`} />
        <span className={`${corner} top-0 right-0 border-t border-r`} />
        <span className={`${corner} bottom-0 left-0 border-b border-l`} />
        <span className={`${corner} bottom-0 right-0 border-b border-r`} />
        {locked && <span className="absolute inset-0 bg-white/[0.06]" />}
      </motion.div>
      <motion.div
        className="absolute top-0 left-0 w-1.5 h-1.5 -ml-[3px] -mt-[3px] bg-white"
        style={{ x: dotX, y: dotY, opacity: visible ? 1 : 0 }}
      />
    </div>
  );
}

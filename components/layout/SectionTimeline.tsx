"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { List, X } from 'lucide-react';

export interface TimelineEntry {
  id: string;
  label: string;
  short: string;
  group?: string;
  meta?: string;
}

export interface TimelineNode {
  id: string;
  index?: string;
  label: string;
  short: string;
  entries?: TimelineEntry[];
}

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/**
 * Pure geometry behind the scroll-spy: given every tracked element's top edge in
 * viewport coordinates, decide which one the reader is "inside" — the last one
 * whose top has crossed the activation line.
 *
 * `pinnedLast` forces the final entry once the page bottom is reached, because
 * short trailing sections can never reach the activation line on their own.
 * Exported so the rule can be unit-tested without a DOM.
 */
export function pickActiveId(
  entries: { id: string; top: number }[],
  activationLine: number,
  pinnedLast: boolean
): string {
  if (entries.length === 0) return '';
  let current = entries[0].id;
  for (const e of entries) {
    if (e.top <= activationLine) current = e.id;
  }
  if (pinnedLast) current = entries[entries.length - 1].id;
  return current;
}

/** Fraction of the first→last tracked range that has been scrolled past. */
export function computeProgress(firstTop: number, lastBottom: number, scrollY: number): number {
  const span = lastBottom - firstTop;
  if (span <= 0) return 0;
  return Math.min(1, Math.max(0, (scrollY - firstTop) / span));
}

/**
 * Tracks which tracked element the reader is currently inside, plus how far
 * through the first→last tracked range they have scrolled.
 *
 * A plain scroll listener is used rather than IntersectionObserver because the
 * activation rule is "the last heading above a line 30% down the viewport" —
 * that is a geometric test over the whole set, not a per-element event.
 */
export function useScrollSpy(ids: string[], activationRatio = 0.3) {
  const [activeId, setActiveId] = useState<string | null>(ids[0] ?? null);
  const [progress, setProgress] = useState(0);

  // Joined so callers can pass a fresh array without re-binding every render.
  const key = ids.join('|');

  useEffect(() => {
    const tracked = ids.filter(Boolean);
    if (tracked.length === 0) return;

    let frame = 0;
    let cancelled = false;

    const measure = () => {
      frame = 0;
      if (cancelled) return;

      const els = tracked
        .map((id) => document.getElementById(id))
        .filter((el): el is HTMLElement => el !== null);
      if (els.length === 0) return;

      const rects = els.map((el) => ({ id: el.id, top: el.getBoundingClientRect().top }));
      const doc = document.documentElement;
      const atBottom = window.innerHeight + window.scrollY >= doc.scrollHeight - 2;

      setActiveId(pickActiveId(rects, window.innerHeight * activationRatio, atBottom));

      const firstTop = rects[0].top + window.scrollY;
      const lastBottom = els[els.length - 1].getBoundingClientRect().bottom + window.scrollY;
      setProgress(computeProgress(firstTop, lastBottom, window.scrollY));
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelled = true;
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [key, activationRatio, ids]);

  return { activeId, progress };
}

function jumpTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  // Keep the URL shareable without triggering a second jump.
  window.history.replaceState(null, '', `#${id}`);
}

/* ------------------------------------------------------------------ */
/* Desktop rail                                                        */
/* ------------------------------------------------------------------ */

/**
 * Sticky vertical timeline for the resources page. Gives a long, dense
 * document a persistent answer to "where am I, and what comes next".
 */
export function SectionTimeline({ nodes }: { nodes: TimelineNode[] }) {
  const ids = useMemo(() => nodes.flatMap((n) => [n.id, ...(n.entries ?? []).map((e) => e.id)]), [nodes]);
  const { activeId, progress } = useScrollSpy(ids);

  const activeNode = nodes.find((n) => n.id === activeId);
  const activeEntry = nodes.flatMap((n) => n.entries ?? []).find((e) => e.id === activeId);
  const readPct = Math.round(progress * 100);

  return (
    <nav aria-label="Page contents" className="flex flex-col gap-6">
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40 mb-3">Contents</p>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 h-px bg-white/10">
            <motion.div
              className="absolute inset-y-0 left-0 bg-white/70"
              style={{ width: `${readPct}%` }}
              transition={{ duration: 0.2, ease: EASE }}
            />
          </div>
          <span className="font-mono text-[10px] text-white/50 tabular-nums">{readPct}%</span>
        </div>
        <p className="mt-3 text-[11px] leading-snug text-white/45 min-h-8">
          {activeEntry ? (
            <>
              <span className="text-white/30 font-mono">{activeEntry.short}</span>
              {activeEntry.meta ? <span className="text-white/25"> · {activeEntry.meta}</span> : null}
            </>
          ) : (
            activeNode && <span className="text-white/70">{activeNode.label}</span>
          )}
        </p>
      </div>

      <ol className="relative max-h-[calc(100vh-19rem)] overflow-y-auto pr-1">
        {nodes.map((node) => {
          const nodeActive = activeId === node.id;
          return (
            <li key={node.id}>
              <button
                type="button"
                onClick={() => jumpTo(node.id)}
                aria-current={nodeActive ? 'true' : undefined}
                className="group flex w-full items-baseline gap-3 py-1.5 text-left cursor-pointer"
              >
                <span
                  className={`relative mt-1.5 w-1.5 h-1.5 shrink-0 rounded-full transition-all duration-300 ${
                    nodeActive ? 'bg-white scale-150' : 'bg-white/25 group-hover:bg-white/60'
                  }`}
                />
                <span className="min-w-0">
                  <span
                    className={`block text-[10px] font-mono transition-colors ${
                      nodeActive ? 'text-white' : 'text-white/35 group-hover:text-white/70'
                    }`}
                  >
                    {node.index}
                  </span>
                  <span
                    className={`block text-[11px] font-bold uppercase tracking-[0.14em] transition-colors ${
                      nodeActive ? 'text-white' : 'text-white/45 group-hover:text-white/80'
                    }`}
                  >
                    {node.label}
                  </span>
                </span>
              </button>

              {node.entries && node.entries.length > 0 && (
                <ul className="ml-[0.3125rem] pl-4 border-l border-white/10 mt-1 mb-2">
                  {node.entries.map((entry, i) => {
                    const entryActive = activeId === entry.id;
                    const showGroup = i === 0 || node.entries![i - 1].group !== entry.group;
                    return (
                      <li key={entry.id}>
                        {showGroup && entry.group && (
                          <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-white/25 pt-2 pb-1">
                            {entry.group}
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() => jumpTo(entry.id)}
                          aria-current={entryActive ? 'true' : undefined}
                          title={`${entry.label}${entry.meta ? ` — ${entry.meta}` : ''}`}
                          className="group flex w-full items-center gap-2.5 py-1 text-left cursor-pointer"
                        >
                          <span
                            className={`w-1.5 h-px shrink-0 transition-all duration-300 ${
                              entryActive ? 'bg-white w-3' : 'bg-white/20 group-hover:bg-white/50'
                            }`}
                          />
                          <span
                            className={`font-mono text-[10px] tracking-wide truncate transition-colors ${
                              entryActive ? 'text-white' : 'text-white/35 group-hover:text-white/70'
                            }`}
                          >
                            {entry.short}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile bar                                                          */
/* ------------------------------------------------------------------ */

/**
 * Small screens have no room for a persistent rail, so this collapses the same
 * navigation into a sticky summary chip that expands into the full contents.
 */
export function SectionTimelineMobile({ nodes }: { nodes: TimelineNode[] }) {
  const ids = useMemo(() => nodes.flatMap((n) => [n.id, ...(n.entries ?? []).map((e) => e.id)]), [nodes]);
  const { activeId, progress } = useScrollSpy(ids);
  const [open, setOpen] = useState(false);

  const activeEntry = nodes.flatMap((n) => n.entries ?? []).find((e) => e.id === activeId);
  const activeNode = nodes.find((n) => n.id === activeId);
  const title = activeEntry ? `${activeEntry.short} — ${activeEntry.label}` : activeNode?.label ?? '';

  // Close the sheet after navigating so the reader sees the destination.
  const go = useCallback((id: string) => {
    setOpen(false);
    jumpTo(id);
  }, []);

  return (
    <>
      <div className="xl:hidden sticky top-20 z-40 -mx-6 md:-mx-12 px-6 md:px-12 py-3 bg-[#050505]/90 backdrop-blur-md border-y border-white/10">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="w-full flex items-center gap-3 text-left cursor-pointer"
        >
          <List className="w-3.5 h-3.5 text-white/40 shrink-0" strokeWidth={1.5} />
          <span className="min-w-0 flex-1">
            <span className="block text-[8px] font-bold uppercase tracking-[0.2em] text-white/30">
              {activeNode?.index ?? ''} · {Math.round(progress * 100)}% read
            </span>
            <span className="block text-[11px] font-medium text-white/80 truncate">{title}</span>
          </span>
          <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/40 shrink-0">
            {open ? 'Close' : 'Contents'}
          </span>
        </button>
        <div className="mt-2 h-px bg-white/10">
          <motion.div className="h-px bg-white/70" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="xl:hidden fixed inset-0 z-40 bg-black/70"
            />
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="xl:hidden fixed inset-x-0 top-0 z-50 max-h-[80vh] overflow-y-auto bg-[#0a0a0a] border-b border-white/15 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/50">Contents</p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close contents"
                  className="text-white/40 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
              <ol className="space-y-1">
                {nodes.map((node) => (
                  <li key={node.id}>
                    <button
                      type="button"
                      onClick={() => go(node.id)}
                      className={`w-full text-left py-2 text-[10px] font-bold uppercase tracking-[0.16em] cursor-pointer transition-colors ${
                        activeId === node.id ? 'text-white' : 'text-white/45'
                      }`}
                    >
                      <span className="font-mono mr-2 text-white/30">{node.index}</span>
                      {node.label}
                    </button>
                    {node.entries && (
                      <ul className="mb-2 ml-1 pl-3 border-l border-white/10">
                        {node.entries.map((entry) => (
                          <li key={entry.id}>
                            <button
                              type="button"
                              onClick={() => go(entry.id)}
                              className={`w-full text-left py-1 font-mono text-[11px] cursor-pointer transition-colors ${
                                activeId === entry.id ? 'text-white' : 'text-white/40'
                              }`}
                            >
                              {entry.short}
                              {entry.group && <span className="text-white/20"> · {entry.group}</span>}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ol>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

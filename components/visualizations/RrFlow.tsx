"use client";

import { motion } from 'framer-motion';
import { TimelineEvent } from '@/lib/types';
import { RefreshCw, Clock, ArrowRight } from 'lucide-react';

interface Props {
  timeline: TimelineEvent[];
  timeQuantum: number;
}

const PROCESS_COLORS = [
  'bg-white text-black',
  'bg-[#3b82f6] text-white',
  'bg-[#10b981] text-white',
  'bg-[#f43f5e] text-white',
  'bg-[#f59e0b] text-white',
  'bg-[#8b5cf6] text-white',
];

function badgeColorFor(process: number | 'idle'): string {
  if (process === 'idle') return 'bg-[#0a0a0a] text-white/40 border-white/10';
  return PROCESS_COLORS[(process as number) % PROCESS_COLORS.length];
}

interface QuantumSlice {
  start: number;
  end: number;
  duration: number;
  process: number | 'idle';
  nextProcess: number | 'idle' | null;
  status: 'quantum-switch' | 'quantum-same' | 'completed-or-short' | 'idle';
}

// Splits any merged timeline segments into manual time-quantum slices
function buildManualQuantumSlices(
  timeline: TimelineEvent[],
  timeQuantum: number
): QuantumSlice[] {
  const safeQuantum = Math.max(1, timeQuantum);
  const rawChunks: { start: number; end: number; process: number | 'idle' }[] = [];

  timeline.forEach((event) => {
    if (event.process === 'idle') {
      rawChunks.push({ start: event.start, end: event.end, process: 'idle' });
      return;
    }

    let cursor = event.start;
    while (cursor < event.end) {
      const sliceEnd = Math.min(cursor + safeQuantum, event.end);
      rawChunks.push({
        start: cursor,
        end: sliceEnd,
        process: event.process,
      });
      cursor = sliceEnd;
    }
  });

  return rawChunks.map((chunk, idx) => {
    const duration = chunk.end - chunk.start;
    const nextChunk = idx < rawChunks.length - 1 ? rawChunks[idx + 1] : null;
    const nextProcess = nextChunk ? nextChunk.process : null;

    if (chunk.process === 'idle') {
      return { ...chunk, duration, nextProcess, status: 'idle' };
    }

    if (duration === safeQuantum && nextProcess !== null && nextProcess !== chunk.process) {
      return { ...chunk, duration, nextProcess, status: 'quantum-switch' };
    }

    if (duration === safeQuantum && nextProcess === chunk.process) {
      return { ...chunk, duration, nextProcess, status: 'quantum-same' };
    }

    return { ...chunk, duration, nextProcess, status: 'completed-or-short' };
  });
}

export default function RrFlow({ timeline, timeQuantum }: Props) {
  if (!timeline || timeline.length === 0) return null;

  const quantumSlices = buildManualQuantumSlices(timeline, timeQuantum);
  const contextSwitches = quantumSlices.filter(
    (slice) => slice.status === 'quantum-switch'
  );

  return (
    <div className="bg-transparent p-4 sm:p-6 md:p-8 border border-white/10 mt-6 sm:mt-8 overflow-hidden">
      {/* Responsive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">
            Round Robin: Manual Quantum Worksheet &amp; Preemption Log
          </h2>
          <p className="text-[10px] sm:text-[11px] text-white/40 font-mono mt-1">
            Each slice runs up to Q = {timeQuantum}ms before rotating to the back of the FIFO ready queue
          </p>
        </div>

        <div className="inline-flex items-center self-start sm:self-auto gap-2 px-3 py-1.5 bg-white/3 border border-white/10 text-white/70">
          <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-[0.15em] whitespace-nowrap">
            Quantum: {timeQuantum}ms
          </span>
        </div>
      </div>

      {/* 1. Manual Quantum Slice Strip (Scrollable on Mobile) */}
      <div className="mb-6 sm:mb-8">
        <p className="text-[9px] font-bold text-white/40 uppercase tracking-[0.2em] mb-3">
          Quantum Slice Breakdown (Q = {timeQuantum}ms)
        </p>
        <div className="overflow-x-auto overscroll-x-contain pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="inline-flex items-stretch gap-2 min-w-full sm:min-w-0">
            {quantumSlices.map((slice, idx) => (
              <div
                key={`${slice.start}-${slice.end}-${idx}`}
                className="flex flex-col justify-between min-w-27.5 sm:min-w-31 p-2.5 bg-[#0a0a0a] border border-white/10 font-mono"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded-sm ${badgeColorFor(
                      slice.process
                    )}`}
                  >
                    {slice.process === 'idle' ? 'IDLE' : `P${slice.process}`}
                  </span>
                  <span className="text-[9px] text-white/40">
                    {slice.duration}/{timeQuantum}ms
                  </span>
                </div>

                <div className="text-[10px] text-white font-semibold mb-1.5">
                  {slice.start}ms → {slice.end}ms
                </div>

                <div className="text-[8px] sm:text-[9px] uppercase tracking-wider">
                  {slice.status === 'quantum-switch' && (
                    <span className="text-amber-400">⟳ Q-Limit → Queue</span>
                  )}
                  {slice.status === 'quantum-same' && (
                    <span className="text-sky-400">⟳ Q-Limit (Continues)</span>
                  )}
                  {slice.status === 'completed-or-short' && (
                    <span className="text-emerald-400">✓ Burst Finished</span>
                  )}
                  {slice.status === 'idle' && (
                    <span className="text-white/30">⋯ CPU Idle</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Cyclic Preemption Log Cards */}
      <div>
        <p className="text-[9px] font-bold text-white/40 uppercase tracking-[0.2em] mb-3">
          Cyclic Context Switches ({contextSwitches.length})
        </p>

        {contextSwitches.length === 0 ? (
          <div className="py-10 sm:py-12 px-4 flex flex-col items-center justify-center text-center border border-white/5 bg-[#0a0a0a]">
            <RefreshCw
              className="w-5 h-5 sm:w-6 sm:h-6 text-white/20 mb-3"
              strokeWidth={1}
            />
            <p className="text-[10px] tracking-[0.2em] text-white/40 uppercase font-medium">
              No quantum preemptions occurred — all slices completed within {timeQuantum}ms.
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {contextSwitches.map((event, idx) => (
              <motion.div
                key={`${event.start}-${event.end}-${idx}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.06 }}
                className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 p-3.5 sm:p-4 bg-[#0a0a0a] border border-white/10 hover:border-white/20 transition-colors"
              >
                {/* Timestamp block: horizontal top bar on mobile, left column on desktop */}
                <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center w-full sm:w-20 shrink-0 border-b sm:border-b-0 sm:border-r border-white/10 pb-2.5 sm:pb-0 sm:pr-5">
                  <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest sm:mb-1">
                    Time
                  </span>
                  <span className="text-xs sm:text-sm font-mono font-bold text-amber-400">
                    t = {event.end}ms
                  </span>
                </div>

                {/* Preemption details */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 w-full font-mono">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                    <span
                      className={`px-2 py-0.5 text-[10px] sm:text-xs font-bold rounded-sm ${badgeColorFor(
                        event.process
                      )}`}
                    >
                      P{event.process}
                    </span>
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    {event.nextProcess !== null && (
                      <>
                        <ArrowRight className="w-3.5 h-3.5 text-white/30 shrink-0" />
                        <span
                          className={`px-2 py-0.5 text-[10px] sm:text-xs font-bold rounded-sm ${badgeColorFor(
                            event.nextProcess
                          )}`}
                        >
                          {event.nextProcess === 'idle'
                            ? 'IDLE'
                            : `P${event.nextProcess}`}
                        </span>
                      </>
                    )}
                  </div>

                  <p className="text-white/60 text-[11px] sm:text-xs leading-relaxed">
                    Ran full <span className="text-white font-semibold">{timeQuantum}ms</span> quantum ({event.start}ms → {event.end}ms). Preempted and pushed to back of ready queue.
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
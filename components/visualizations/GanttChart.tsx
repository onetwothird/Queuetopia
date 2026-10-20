"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { SimulationResult, TimelineEvent, ScheduleStep, Process } from '@/lib/types';

const PROCESS_COLORS = [
  'bg-white text-black',
  'bg-[#3b82f6] text-white',
  'bg-[#10b981] text-white',
  'bg-[#f43f5e] text-white',
  'bg-[#f59e0b] text-white',
  'bg-[#8b5cf6] text-white',
];

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

function colorFor(process: number | 'idle'): string {
  if (process === 'idle') return 'bg-[#0a0a0a] text-white/30';
  return PROCESS_COLORS[(process as number) % PROCESS_COLORS.length];
}

function dotColorFor(process: number): string {
  return PROCESS_COLORS[process % PROCESS_COLORS.length].split(' ')[0];
}

function getSliceEndLabel(sliceEnd: ScheduleStep['sliceEnd']): string {
  switch (sliceEnd) {
    case 'completed':
      return '✓';
    case 'quantum':
      return '⟳';
    case 'awaiting-arrival':
      return '⋯';
    default:
      return '';
  }
}

function getSliceEndColor(sliceEnd: ScheduleStep['sliceEnd']): string {
  switch (sliceEnd) {
    case 'completed':
      return 'text-emerald-400';
    case 'quantum':
      return 'text-amber-400';
    case 'awaiting-arrival':
      return 'text-sky-400';
    default:
      return 'text-white/40';
  }
}

interface ManualSlice {
  start: number;
  end: number;
  process: number | 'idle';
  sliceEnd?: ScheduleStep['sliceEnd'];
  reason?: string;
}

interface ActiveQueueItem {
  id: number;
  arrival: number;
  remainingBefore: number;
  isNewArrival: boolean;
  isChosen: boolean;
}

// Reconstructs the hand-written BT slash-out history (e.g., [7, 4, 2, 0] for P4)
function getBurstProgression(
  process: Process,
  slices: ManualSlice[]
): number[] {
  const history: number[] = [process.burst];
  let current = process.burst;

  slices.forEach((slice) => {
    if (slice.process === process.id) {
      const consumed = slice.end - slice.start;
      current = Math.max(0, current - consumed);
      history.push(current);
    }
  });

  return history;
}

// Computes the vertical column of active processes in RAM at timestamp `t`
function getActiveProcessesAtTime(
  time: number,
  chosenProcess: number | 'idle',
  processes: Process[],
  slices: ManualSlice[]
): ActiveQueueItem[] {
  const consumedBefore = new Map<number, number>();
  processes.forEach((p) => consumedBefore.set(p.id, 0));

  slices.forEach((slice) => {
    if (slice.process !== 'idle' && slice.end <= time) {
      const prev = consumedBefore.get(slice.process) || 0;
      consumedBefore.set(slice.process, prev + (slice.end - slice.start));
    }
  });

  return processes
    .map((p) => {
      const used = consumedBefore.get(p.id) || 0;
      const remainingBefore = p.burst - used;
      return {
        id: p.id,
        arrival: p.arrival,
        remainingBefore,
        isNewArrival: p.arrival === time,
        isChosen: chosenProcess === p.id,
      };
    })
    .filter((item) => item.arrival <= time && item.remainingBefore > 0)
    .sort((a, b) => a.arrival - b.arrival || a.id - b.id);
}

export default function GanttChart({
  timeline,
  result,
}: {
  timeline: TimelineEvent[];
  result: SimulationResult;
}) {
  const [manualMode, setManualMode] = useState<boolean>(true);

  if (!timeline || timeline.length === 0) return null;

  const totalTime = timeline[timeline.length - 1].end;
  const processes = result.processes;
  const steps = result.steps || [];

  const unmergedSlices: ManualSlice[] =
    steps.length > 0
      ? steps.map((s) => ({
          start: s.time,
          end: s.endTime,
          process: s.running,
          sliceEnd: s.sliceEnd,
          reason: s.reason,
        }))
      : timeline.map((t) => ({
          start: t.start,
          end: t.end,
          process: t.process,
        }));

  const mergedSlices: ManualSlice[] = timeline.map((t) => ({
    start: t.start,
    end: t.end,
    process: t.process,
  }));

  const activeSlices = manualMode ? unmergedSlices : mergedSlices;

  const n = processes.length;
  const sumTurnaround = processes.reduce((acc, p) => acc + p.turnaround, 0);
  const sumWaiting = processes.reduce((acc, p) => acc + p.waiting, 0);
  const sumResponse = processes.reduce(
    (acc, p) => acc + (p.response >= 0 ? p.response : 0),
    0
  );
  const totalBurst = processes.reduce((acc, p) => acc + p.burst, 0);

  const avgTurnaround = n === 0 ? 0 : sumTurnaround / n;
  const avgWaiting = n === 0 ? 0 : sumWaiting / n;
  const avgResponse = n === 0 ? 0 : sumResponse / n;
  const cpuUtil = totalTime === 0 ? 0 : (totalBurst / totalTime) * 100;

  const preemptions = timeline.filter((e, i) => {
    if (i === timeline.length - 1 || e.process === 'idle') return false;
    return timeline[i + 1].process !== e.process;
  }).length;

  const idleTime = timeline
    .filter((e) => e.process === 'idle')
    .reduce((acc, e) => acc + (e.end - e.start), 0);

  return (
    <div className="bg-transparent border border-white/10 space-y-8 sm:space-y-12 overflow-hidden">
      {/* ============================ 04 TIMELINE ============================ */}
      <div className="p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h2 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">
              04. Timeline &amp; Manual Ready-Queue Worksheet
            </h2>
            <p className="text-[10px] sm:text-[11px] text-white/40 font-mono mt-1">
              {manualMode
                ? 'Unmerged decision slices with vertical RAM queue stacks under each timestamp'
                : 'Merged continuous execution blocks'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:inline-flex w-full sm:w-auto border border-white/15 bg-[#0a0a0a] p-0.5 font-mono text-[10px]">
            <button
              type="button"
              onClick={() => setManualMode(true)}
              className={`px-2.5 sm:px-3 py-1.5 text-center transition-colors uppercase tracking-wider ${
                manualMode
                  ? 'bg-white text-black font-bold'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Manual Solve
            </button>
            <button
              type="button"
              onClick={() => setManualMode(false)}
              className={`px-2.5 sm:px-3 py-1.5 text-center transition-colors uppercase tracking-wider ${
                !manualMode
                  ? 'bg-white text-black font-bold'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Merged Gantt
            </button>
          </div>
        </div>

        {/* Scrollable manual worksheet container for all screen sizes */}
        <div className="overflow-x-auto overscroll-x-contain pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div
            className="min-w-full"
            style={{
              minWidth: `${Math.max(activeSlices.length * 78, 520)}px`,
            }}
          >
            {/* 1. GANTT CHART BAR */}
            <div className="flex w-full h-14 sm:h-16 border border-white/20 bg-[#0a0a0a]">
              {activeSlices.map((slice, idx) => {
                const duration = slice.end - slice.start;
                const isIdle = slice.process === 'idle';

                return (
                  <motion.div
                    key={`${slice.start}-${slice.end}-${idx}`}
                    initial={{ opacity: 0, scaleX: 0.8 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{
                      duration: 0.45,
                      delay: idx * 0.05,
                      ease: EASE,
                    }}
                    style={{
                      flexGrow: Math.max(duration, 1),
                      flexBasis: '68px',
                    }}
                    title={
                      slice.reason ||
                      `${isIdle ? 'IDLE' : `P${slice.process}`} (${slice.start}ms → ${slice.end}ms)`
                    }
                    className={`relative flex flex-col items-center justify-center border-r border-[#050505] last:border-0 origin-left px-1 ${colorFor(
                      slice.process
                    )}`}
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] sm:text-xs font-bold tracking-wider font-mono whitespace-nowrap">
                        {isIdle ? 'IDLE' : `P${slice.process}`}
                      </span>
                      {slice.sliceEnd && (
                        <span
                          className={`text-[9px] sm:text-[10px] font-mono ${getSliceEndColor(
                            slice.sliceEnd
                          )}`}
                        >
                          {getSliceEndLabel(slice.sliceEnd)}
                        </span>
                      )}
                    </div>
                    <span className="text-[8px] sm:text-[9px] font-mono opacity-60 whitespace-nowrap">
                      +{duration}ms
                    </span>
                  </motion.div>
                );
              })}
            </div>

            {/* 2. TIMESTAMPS & VERTICAL READY-QUEUE COLUMNS */}
            <div className="flex w-full items-start pt-1">
              {activeSlices.map((slice, idx) => {
                const duration = slice.end - slice.start;
                const activeQueue = getActiveProcessesAtTime(
                  slice.start,
                  slice.process,
                  processes,
                  unmergedSlices
                );
                const isLast = idx === activeSlices.length - 1;

                return (
                  <div
                    key={`col-${slice.start}-${idx}`}
                    style={{
                      flexGrow: Math.max(duration, 1),
                      flexBasis: '68px',
                    }}
                    className="relative flex justify-between"
                  >
                    {/* Left boundary of this slice: Timestamp + Vertical Queue Stack */}
                    <div className="flex flex-col items-start">
                      <div className="w-px h-2.5 bg-white/40" />
                      <span className="text-[11px] sm:text-xs font-bold font-mono text-white mt-0.5">
                        {slice.start}
                      </span>

                      {/* Vertical column of active processes in RAM at t = slice.start */}
                      <div className="mt-2 flex flex-col gap-1 pr-1">
                        {activeQueue.map((item) => (
                          <div
                            key={`q-${slice.start}-${item.id}`}
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm font-mono text-[10px] sm:text-[11px] border transition-colors whitespace-nowrap ${
                              item.isChosen
                                ? 'bg-white/15 border-white/50 text-white font-bold'
                                : 'bg-white/3er-white/10 text-white/60'
                            }`}
                            title={`At t=${slice.start}ms: P${item.id} has ${item.remainingBefore}ms remaining burst (Arrival: ${item.arrival}ms)`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColorFor(
                                item.id
                              )}`}
                            />
                            <span>P{item.id}</span>
                            <span className="text-[8px] sm:text-[9px] text-white/40">
                              ({item.remainingBefore})
                            </span>
                            {item.isNewArrival && slice.start > 0 && (
                              <span
                                className="text-[7px] sm:text-[8px] text-sky-400 font-bold"
                                title={`Arrived at t=${slice.start}ms`}
                              >
                                NEW
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Final right-edge timestamp (Total End Time) */}
                    {isLast && (
                      <div className="flex flex-col items-end">
                        <div className="w-px h-2.5 bg-white/40" />
                        <span className="text-[11px] sm:text-xs font-bold font-mono text-emerald-400 mt-0.5">
                          {slice.end}
                        </span>
                        <span className="mt-2 text-[8px] sm:text-[9px] font-mono text-white/30 uppercase tracking-wider">
                          END
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Manual Solving Legend */}
        <div className="mt-3 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 sm:gap-6 text-[9px] sm:text-[10px] font-mono text-white/50">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-white/15 border border-white/50 text-white font-bold rounded-sm whitespace-nowrap">
              P4 (4)
            </span>
            <span>Selected for CPU (Remaining BT in parentheses)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-white/3 border border-white/10 text-white/60 rounded-sm whitespace-nowrap">
              P1 (4) <strong className="text-sky-400 text-[8px]">NEW</strong>
            </span>
            <span>Waiting in RAM / Newly arrived at timestamp</span>
          </div>
        </div>
      </div>

      {/* ============================ 05 METRICS ============================ */}
      <div className="px-4 sm:px-6 md:px-8">
        <h2 className="text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-4 sm:mb-6">
          05. Aggregate Metrics &amp; Manual Formulas
        </h2>
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
          {[
            {
              label: 'Avg Turnaround (ATT)',
              value: `${avgTurnaround.toFixed(2)}ms`,
              formula: `${sumTurnaround} / ${n} = ${avgTurnaround.toFixed(2)}`,
            },
            {
              label: 'Avg Waiting (AWT)',
              value: `${avgWaiting.toFixed(2)}ms`,
              formula: `${sumWaiting} / ${n} = ${avgWaiting.toFixed(2)}`,
            },
            {
              label: 'Avg Response',
              value: `${avgResponse.toFixed(2)}ms`,
              formula: `${sumResponse} / ${n} = ${avgResponse.toFixed(2)}`,
            },
            {
              label: 'CPU Utilization',
              value: `${cpuUtil.toFixed(1)}%`,
              formula: `(${totalBurst} / ${totalTime}) × 100`,
            },
            {
              label: 'Idle Gap',
              value: `${idleTime}ms`,
              formula: `Total Time: ${totalTime}ms`,
            },
            {
              label: 'Context Switches',
              value: `${preemptions}`,
              formula: `${unmergedSlices.length} decision slices`,
            },
          ].map((metric, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.05, ease: EASE }}
              className="border border-white/5 bg-white/1 p-3 sm:p-3.5"
            >
              <p className="text-[9px] font-bold text-white/40 uppercase tracking-[0.2em] mb-1">
                {metric.label}
              </p>
              <p className="text-lg sm:text-xl md:text-2xl font-light text-white font-mono">
                {metric.value}
              </p>
              <p className="text-[9px] sm:text-[10px] font-mono text-white/40 mt-1">
                {metric.formula}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* =========================== 06 PER-PROCESS =========================== */}
      <div className="px-4 sm:px-6 md:px-8 pb-4 sm:pb-6 md:pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 sm:mb-6">
          <h2 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">
            06. Per-Process Manual Computation Table (P, AT, BT, ET, TT, WT)
          </h2>
          <span className="text-[9px] sm:text-[10px] font-mono text-white/40">
            TT = ET - AT &nbsp;|&nbsp; WT = TT - BT
          </span>
        </div>

        <div className="overflow-x-auto overscroll-x-contain border border-white/10">
          <table className="w-full text-left font-mono text-xs sm:text-sm min-w-160">
            <thead>
              <tr className="border-b border-white/10 text-[8px] sm:text-[9px] uppercase tracking-[0.15em] sm:tracking-[0.2em] text-white/40 bg-white/2">
                <th className="sticky left-0 z-10 bg-[#0a0a0a] px-3 sm:px-4 py-3 font-medium border-r border-white/10">
                  Process (P)
                </th>
                <th className="px-3 sm:px-4 py-3 font-medium">Arrival (AT)</th>
                <th className="px-3 sm:px-4 py-3 font-medium">
                  Burst (BT) Slash-Out
                </th>
                <th className="px-3 sm:px-4 py-3 font-medium">Start</th>
                <th className="px-3 sm:px-4 py-3 font-medium">End (ET)</th>
                <th className="px-3 sm:px-4 py-3 font-medium">
                  Turnaround (ET - AT)
                </th>
                <th className="px-3 sm:px-4 py-3 font-medium">
                  Waiting (TT - BT)
                </th>
                <th className="px-3 sm:px-4 py-3 font-medium">Response</th>
              </tr>
            </thead>
            <tbody>
              {processes.map((p, idx) => {
                const btProgression = getBurstProgression(p, unmergedSlices);
                const isCompleted =
                  btProgression[btProgression.length - 1] === 0;

                return (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.45,
                      delay: 0.25 + idx * 0.05,
                      ease: EASE,
                    }}
                    className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
                  >
                    {/* Sticky Process ID column so mobile horizontal scrolling keeps context */}
                    <td className="sticky left-0 z-10 bg-[#0a0a0a] px-3 sm:px-4 py-3 sm:py-3.5 border-r border-white/10">
                      <span className="inline-flex items-center gap-2 sm:gap-2.5">
                        <span
                          className={`w-2 h-2 shrink-0 ${dotColorFor(p.id)}`}
                        />
                        <span
                          className={
                            isCompleted
                              ? 'line-through decoration-emerald-400/70 text-white/80 font-bold'
                              : 'text-white font-bold'
                          }
                          title={
                            isCompleted
                              ? `P${p.id} completed at t=${p.completion}ms`
                              : `P${p.id}`
                          }
                        >
                          P{p.id}
                        </span>
                      </span>
                    </td>

                    {/* AT */}
                    <td className="px-3 sm:px-4 py-3 sm:py-3.5 text-white/70 whitespace-nowrap">
                      {p.arrival}
                    </td>

                    {/* BT with step-by-step slash-out history */}
                    <td className="px-3 sm:px-4 py-3 sm:py-3.5">
                      <div className="flex flex-wrap items-center gap-1.5 min-w-22.5">
                        {btProgression.map((val, bIdx) => {
                          const isLastVal = bIdx === btProgression.length - 1;
                          return (
                            <span
                              key={bIdx}
                              className={
                                isLastVal
                                  ? 'text-emerald-400 font-bold'
                                  : 'line-through decoration-rose-500/80 text-white/35'
                              }
                            >
                              {val}
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    {/* Start Time */}
                    <td className="px-3 sm:px-4 py-3 sm:py-3.5 text-white/60 whitespace-nowrap">
                      {p.startTime >= 0 ? p.startTime : '—'}
                    </td>

                    {/* ET (Completion Time) */}
                    <td className="px-3 sm:px-4 py-3 sm:py-3.5 text-white font-semibold whitespace-nowrap">
                      {p.completion}
                    </td>

                    {/* TT = ET - AT */}
                    <td className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap">
                      <span className="text-white/40 text-[10px] sm:text-xs mr-1.5 sm:mr-2">
                        {p.completion} - {p.arrival} =
                      </span>
                      <span className="text-white font-semibold">
                        {p.turnaround}
                      </span>
                    </td>

                    {/* WT = TT - BT */}
                    <td className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap">
                      <span className="text-white/40 text-[10px] sm:text-xs mr-1.5 sm:mr-2">
                        {p.turnaround} - {p.burst} =
                      </span>
                      <span className="text-white font-semibold">
                        {p.waiting}
                      </span>
                    </td>

                    {/* Response Time */}
                    <td className="px-3 sm:px-4 py-3 sm:py-3.5 text-white/70 whitespace-nowrap">
                      {p.response >= 0 ? p.response : '—'}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-white/15 bg-white/2 text-[10px] sm:text-xs text-white/70">
                <td
                  className="sticky left-0 z-10 bg-[#0a0a0a] px-3 sm:px-4 py-3 font-bold text-white border-r border-white/10"
                  colSpan={2}
                >
                  TOTAL / AVG
                </td>
                <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                  ∑BT = <strong className="text-white">{totalBurst}</strong>
                </td>
                <td className="px-3 sm:px-4 py-3">—</td>
                <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                  End = <strong className="text-white">{totalTime}</strong>
                </td>
                <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                  ∑TT = <strong className="text-white">{sumTurnaround}</strong>{' '}
                  <span className="text-emerald-400">
                    ({avgTurnaround.toFixed(2)})
                  </span>
                </td>
                <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                  ∑WT = <strong className="text-white">{sumWaiting}</strong>{' '}
                  <span className="text-emerald-400">
                    ({avgWaiting.toFixed(2)})
                  </span>
                </td>
                <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                  Avg: {avgResponse.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
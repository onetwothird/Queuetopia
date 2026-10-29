"use client";

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, SkipBack, SkipForward, ListOrdered } from 'lucide-react';
import { SimulationResult } from '@/lib/types';
import { ALGORITHM_BY_KEY } from '@/lib/algorithms-meta';
import { buildRoundRobinQueue, buildWorksheet, GanttBlock } from '@/lib/worksheet';
import { processColor } from '@/lib/process-colors';
import { useSystemPrefs } from '@/components/system/SystemPrefs';

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const PRIORITY_ALGORITHMS = ['priority_np', 'priority_p'];
const UNIT_PX = 26;

const fmt = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(2));

function SectionHeading({ step, title, note }: { step: string; title: string; note?: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-5">
      <div>
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/35 mb-1.5">{step}</p>
        <h3 className="text-sm font-semibold tracking-tight text-white">{title}</h3>
      </div>
      {note && <p className="font-mono text-[10px] sm:text-[11px] text-white/40">{note}</p>}
    </div>
  );
}

function ProcessChip({ id, remaining, active = false }: { id: number; remaining?: number; active?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 font-mono text-[11px] border whitespace-nowrap ${
        active ? 'border-white/60 bg-white/10 text-white font-semibold' : 'border-white/10 bg-white/[0.02] text-white/70'
      }`}
    >
      <span className="w-2 h-2 shrink-0" style={{ backgroundColor: processColor(id) }} />
      P{id}
      {remaining !== undefined && <span className="text-white/45">({remaining})</span>}
    </span>
  );
}

function blockLabel(b: GanttBlock) {
  return b.process === 'idle' ? 'Idle' : `P${b.process}`;
}

export default function ManualSolution({ result, algorithm, timeQuantum }: { result: SimulationResult; algorithm: string; timeQuantum: number }) {
  const ws = useMemo(() => buildWorksheet(result), [result]);
  const rrQueue = useMemo(
    () => (algorithm === 'rr' ? buildRoundRobinQueue(result, ws.blocks) : null),
    [algorithm, result, ws.blocks]
  );
  const [cursor, setCursor] = useState(ws.events.length);
  const { play } = useSystemPrefs();

  if (ws.blocks.length === 0) return null;

  const meta = ALGORITHM_BY_KEY[algorithm];
  const processes = result.processes;
  const n = processes.length;
  const total = ws.totalTime;
  const showPriority = PRIORITY_ALGORITHMS.includes(algorithm);

  const solved = cursor >= ws.events.length;
  const current = solved ? null : ws.events[cursor];
  const drawnUntil = current ? current.until : total;
  const pct = (t: number) => (total === 0 ? 0 : (t / total) * 100);

  const arrivalGroups = new Map<number, number[]>();
  [...processes]
    .sort((a, b) => a.arrival - b.arrival || a.id - b.id)
    .forEach((p) => arrivalGroups.set(p.arrival, [...(arrivalGroups.get(p.arrival) ?? []), p.id]));

  const sumTAT = processes.reduce((a, p) => a + p.turnaround, 0);
  const sumWT = processes.reduce((a, p) => a + p.waiting, 0);
  const sumRT = processes.reduce((a, p) => a + Math.max(p.response, 0), 0);
  const busy = processes.reduce((a, p) => a + p.burst, 0);
  const idle = total - busy;

  const go = (i: number) => {
    const next = Math.min(Math.max(i, 0), ws.events.length);
    if (next === cursor) return;
    if (next === ws.events.length) play('solve');
    else if (next > cursor) play('step', next);
    else play('back');
    setCursor(next);
  };

  return (
    <div className="border border-white/10 bg-[#070707]">
      {/* ---------------------------- Header ---------------------------- */}
      <div className="px-4 sm:px-6 md:px-8 py-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/40 mb-1">Worked Solution</p>
          <h2 className="text-lg font-semibold tracking-tight text-white">
            {meta ? meta.name : algorithm.toUpperCase()}
            {meta && <span className="text-white/40 font-normal"> ({meta.short})</span>}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2 font-mono text-[10px] uppercase tracking-[0.15em]">
          {meta && <span className="px-2.5 py-1 border border-white/15 text-white/60">{meta.kind}</span>}
          {meta?.quantum && <span className="px-2.5 py-1 border border-amber-400/30 text-amber-300/90">q = {timeQuantum}</span>}
          <span className="px-2.5 py-1 border border-white/15 text-white/60">{n} processes</span>
        </div>
      </div>

      {/* ------------------------- Step 1: Gantt ------------------------- */}
      <section className="px-4 sm:px-6 md:px-8 py-6 sm:py-8 border-b border-white/10">
        <SectionHeading step="Step 1" title="Draw the Gantt chart" note="Time starts at t = 0 · ▲ marks arrivals" />

        {/* Step controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-1.5" data-sound="custom">
            {[
              { icon: SkipBack, label: 'Start over', onClick: () => go(0), disabled: cursor === 0 },
              { icon: ChevronLeft, label: 'Previous step', onClick: () => go(cursor - 1), disabled: cursor === 0 },
              { icon: ChevronRight, label: 'Next step', onClick: () => go(cursor + 1), disabled: solved },
              { icon: SkipForward, label: 'Show full answer', onClick: () => go(ws.events.length), disabled: solved },
            ].map(({ icon: Icon, label, onClick, disabled }) => (
              <button
                key={label}
                type="button"
                onClick={onClick}
                disabled={disabled}
                title={label}
                aria-label={label}
                className="w-9 h-9 inline-flex items-center justify-center border border-white/15 text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-25 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-default"
              >
                <Icon className="w-4 h-4" strokeWidth={1.5} />
              </button>
            ))}
            <span className="ml-2 font-mono text-[11px] text-white/50">
              {solved ? 'Full answer' : `Step ${cursor + 1} of ${ws.events.length}`}
            </span>
          </div>
          {solved && (
            <button
              type="button"
              onClick={() => go(0)}
              data-sound="custom"
              className="inline-flex items-center justify-center gap-2 border border-white/20 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white hover:bg-white hover:text-black transition-colors cursor-pointer"
            >
              <ListOrdered className="w-3.5 h-3.5" strokeWidth={1.5} />
              Solve step by step
            </button>
          )}
        </div>

        {/* Round Robin ready queue, written left to right as processes join it */}
        {rrQueue && (
          <div className="mb-5">
            <div className="flex items-baseline justify-between gap-3 mb-2">
              <p className="text-xs font-semibold text-white">Ready queue</p>
              <p className="font-mono text-[10px] text-white/40">
                remaining burst under each entry · crossed out once served
              </p>
            </div>
            <div className="overflow-x-auto overscroll-x-contain -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
              <div className="flex w-max min-w-full border border-white/15">
                {rrQueue.map((slot, i) => {
                  const now = current ? current.time : total;
                  const written = slot.enqueuedAt <= now;
                  const served = slot.servedAt !== null && slot.servedAt <= now;
                  const running = current !== null && slot.servedAt === current.time;
                  return (
                    <div
                      key={i}
                      title={
                        written
                          ? `P${slot.id} joined at t = ${slot.enqueuedAt} with ${slot.remaining} left${
                              slot.servedAt !== null ? `, served at t = ${slot.servedAt}` : ''
                            }`
                          : undefined
                      }
                      className={`relative w-14 shrink-0 border-r border-white/10 last:border-r-0 px-1 py-2 text-center font-mono transition-colors ${
                        running ? 'bg-amber-300/15' : ''
                      }`}
                    >
                      {written ? (
                        <>
                          <span className="block text-[9px] text-white/30">t={slot.enqueuedAt}</span>
                          <span
                            className={`block text-sm font-semibold ${
                              running ? 'text-amber-300' : served ? 'text-white/35 line-through decoration-white/50' : 'text-white'
                            }`}
                          >
                            P{slot.id}
                          </span>
                          <span className={`block text-[11px] ${served && !running ? 'text-white/25' : 'text-white/60'}`}>
                            {slot.remaining}
                          </span>
                          <span className="absolute left-0 right-0 bottom-0 h-0.5" style={{ backgroundColor: processColor(slot.id), opacity: served && !running ? 0.35 : 1 }} />
                        </>
                      ) : (
                        <span className="block py-3 text-white/10">·</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="overflow-x-auto overscroll-x-contain -mx-4 px-4 sm:mx-0 sm:px-0 pb-2">
          <div className="relative mx-3 pt-1" style={{ minWidth: `${Math.max(480, total * UNIT_PX)}px` }}>
            {/* Blocks */}
            <div className="relative h-14 border border-dashed border-white/15">
              {ws.blocks.map((b, i) => {
                const visibleEnd = Math.min(b.end, drawnUntil);
                if (visibleEnd <= b.start) return null;
                const isIdle = b.process === 'idle';
                const isCurrent = current !== null && b.start <= current.time && current.time < b.end;
                return (
                  <motion.div
                    key={`${b.start}-${i}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.35, ease: EASE }}
                    title={`${blockLabel(b)}: ${b.start} → ${b.end} (${b.end - b.start} units)`}
                    className={`absolute inset-y-0 flex items-center justify-center overflow-hidden border-r-2 border-[#070707] ${
                      isCurrent ? 'ring-2 ring-white ring-inset z-10' : ''
                    }`}
                    style={{
                      left: `${pct(b.start)}%`,
                      width: `${pct(visibleEnd) - pct(b.start)}%`,
                      background: isIdle
                        ? 'repeating-linear-gradient(135deg, rgba(255,255,255,0.06) 0 6px, transparent 6px 12px)'
                        : processColor(b.process as number),
                    }}
                  >
                    <span className={`font-mono text-xs font-semibold ${isIdle ? 'text-white/45' : 'text-[#0b0b0b]'}`}>
                      {blockLabel(b)}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            {/* Time ticks */}
            <div className="relative h-7">
              {ws.ticks.map((t) => (
                <div
                  key={t}
                  className={`absolute top-0 flex flex-col items-center -translate-x-1/2 transition-opacity ${
                    t <= drawnUntil ? 'opacity-100' : 'opacity-20'
                  }`}
                  style={{ left: `${pct(t)}%` }}
                >
                  <span className="w-px h-2 bg-white/40" />
                  <span
                    className={`font-mono text-[11px] mt-0.5 ${
                      current && t === current.time ? 'text-amber-300 font-semibold' : 'text-white/80'
                    }`}
                  >
                    {t}
                  </span>
                </div>
              ))}
            </div>

            {/* Arrival markers */}
            <div className="relative h-8 mt-1">
              {[...arrivalGroups.entries()].map(([t, ids]) => (
                <div
                  key={t}
                  className="absolute top-0 flex flex-col items-center -translate-x-1/2"
                  style={{ left: `${pct(t)}%` }}
                >
                  <span className="text-[9px] leading-none text-sky-300/80">▲</span>
                  <span className="font-mono text-[10px] text-sky-300/80 whitespace-nowrap mt-0.5">
                    {ids.map((id) => `P${id}`).join(' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Decision explanation */}
        <motion.div
          key={solved ? 'solved' : cursor}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="mt-5 border border-white/10 bg-white/[0.02]"
        >
          {current ? (
            <div className="grid grid-cols-1 md:grid-cols-5">
              <div className="md:col-span-3 p-4 sm:p-5 md:border-r border-b md:border-b-0 border-white/10">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="font-mono text-sm font-semibold text-black bg-amber-300 px-2 py-0.5">t = {current.time}</span>
                  {current.arrivals.map((id) => (
                    <span key={`a${id}`} className="font-mono text-[10px] uppercase tracking-wider px-2 py-1 border border-sky-400/30 text-sky-300">
                      P{id} arrives
                    </span>
                  ))}
                  {current.completions.map((id) => (
                    <span key={`c${id}`} className="font-mono text-[10px] uppercase tracking-wider px-2 py-1 border border-emerald-400/30 text-emerald-300">
                      P{id} completed
                    </span>
                  ))}
                  {current.preempted !== null && (
                    <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-1 border border-rose-400/30 text-rose-300">
                      P{current.preempted} {current.preemptedBy === 'quantum' ? 'quantum expired' : 'preempted'}
                    </span>
                  )}
                </div>
                <p className="text-sm text-white/75 leading-relaxed">{current.reason}</p>
                {current.candidates.length > 1 && (
                  <div className="mt-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/35 mb-2">Comparison</p>
                    <ul className="space-y-1 font-mono text-[11px]">
                      {current.candidates.map((c) => (
                        <li key={c.id} className={c.id === current.running ? 'text-white font-semibold' : 'text-white/50'}>
                          {c.id === current.running ? '▸' : '·'} P{c.id} — {c.detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="md:col-span-2 p-4 sm:p-5 space-y-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/35 mb-2">CPU</p>
                  {current.running === 'idle' ? (
                    <span className="font-mono text-[11px] text-white/45">Idle</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <ProcessChip id={current.running} remaining={current.runningRemaining} active />
                      <span className="font-mono text-[11px] text-white/45">
                        runs {current.time} → {current.until}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/35 mb-2">
                    Ready queue <span className="normal-case tracking-normal">(remaining burst)</span>
                  </p>
                  {current.waiting.length === 0 ? (
                    <span className="font-mono text-[11px] text-white/35">Empty</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {current.waiting.map((q) => (
                        <ProcessChip key={q.id} id={q.id} remaining={q.remaining} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="p-4 sm:p-5 text-sm text-white/70 leading-relaxed">
              All {n} processes finish by <span className="font-mono text-white">t = {total}</span>. Read each process&apos;s
              completion time (CT) from the right edge of its last block, then fill in the table below. Use{' '}
              <span className="text-white">Solve step by step</span> to replay every decision.
            </p>
          )}
        </motion.div>
      </section>

      {/* ------------------- Step 2: remaining burst trace ------------------- */}
      {ws.hasSplitBursts && (
        <section className="px-4 sm:px-6 md:px-8 py-6 sm:py-8 border-b border-white/10">
          <SectionHeading step="Step 2" title="Track the remaining burst at each check point" note="— not yet arrived · 0 finished" />
          <div className="overflow-x-auto overscroll-x-contain border border-white/10">
            <table className="w-full font-mono text-xs text-center">
              <thead>
                <tr className="border-b border-white/10 text-[10px] text-white/45">
                  <th className="sticky left-0 bg-[#0b0b0b] px-3 py-2.5 text-left font-medium border-r border-white/10">t =</th>
                  {ws.events.map((e, i) => (
                    <th
                      key={e.time}
                      className={`px-3 py-2.5 font-medium ${current && i === cursor ? 'text-amber-300 bg-amber-300/5' : ''}`}
                    >
                      {e.time}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {processes.map((p) => {
                  const row = ws.remaining.get(p.id)!;
                  return (
                    <tr key={p.id} className="border-b border-white/5 last:border-0">
                      <td className="sticky left-0 bg-[#0b0b0b] px-3 py-2 text-left border-r border-white/10">
                        <span className="inline-flex items-center gap-2 text-white">
                          <span className="w-2 h-2" style={{ backgroundColor: processColor(p.id) }} />P{p.id}
                        </span>
                      </td>
                      {row.map((v, i) => {
                        const hidden = ws.events[i].time > (current ? current.time : total);
                        const changed = i > 0 && row[i - 1] !== null && row[i - 1] !== v;
                        const isRunning = ws.events[i].running === p.id;
                        return (
                          <td
                            key={i}
                            className={`px-3 py-2 ${current && i === cursor ? 'bg-amber-300/5' : ''} ${
                              hidden
                                ? 'text-transparent'
                                : v === null
                                  ? 'text-white/20'
                                  : v === 0
                                    ? 'text-emerald-400/80'
                                    : isRunning
                                      ? 'text-white font-semibold'
                                      : changed
                                        ? 'text-white/80'
                                        : 'text-white/45'
                            }`}
                          >
                            {v === null ? '—' : v}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[11px] text-white/40">Bold values belong to the process that gets the CPU at that time.</p>
        </section>
      )}

      {/* ------------------- Step 3: per-process computation ------------------- */}
      <section className="px-4 sm:px-6 md:px-8 py-6 sm:py-8 border-b border-white/10">
        <SectionHeading
          step={ws.hasSplitBursts ? 'Step 3' : 'Step 2'}
          title="Compute CT, TAT, WT and RT for each process"
          note="TAT = CT − AT · WT = TAT − BT · RT = first run − AT"
        />
        <div className="overflow-x-auto overscroll-x-contain border border-white/10">
          <table className="w-full font-mono text-xs sm:text-[13px] min-w-[600px]">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-[0.12em] text-white/45 bg-white/[0.02]">
                <th className="px-3 sm:px-4 py-3 text-left font-medium">Process</th>
                <th className="px-3 sm:px-4 py-3 text-right font-medium">AT</th>
                <th className="px-3 sm:px-4 py-3 text-right font-medium">BT</th>
                {showPriority && <th className="px-3 sm:px-4 py-3 text-right font-medium">Priority</th>}
                <th className="px-3 sm:px-4 py-3 text-right font-medium">CT</th>
                <th className="px-3 sm:px-4 py-3 text-right font-medium">TAT</th>
                <th className="px-3 sm:px-4 py-3 text-right font-medium">WT</th>
                <th className="px-3 sm:px-4 py-3 text-right font-medium">RT</th>
              </tr>
            </thead>
            <tbody>
              {processes.map((p) => {
                const done = p.completion <= drawnUntil;
                const started = p.startTime >= 0 && p.startTime < drawnUntil;
                const blank = <span className="text-white/15">·</span>;
                return (
                  <tr key={p.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors">
                    <td className="px-3 sm:px-4 py-3">
                      <span className="inline-flex items-center gap-2 text-white font-semibold">
                        <span className="w-2 h-2" style={{ backgroundColor: processColor(p.id) }} />P{p.id}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-right text-white/70">{p.arrival}</td>
                    <td className="px-3 sm:px-4 py-3 text-right text-white/70">{p.burst}</td>
                    {showPriority && <td className="px-3 sm:px-4 py-3 text-right text-white/70">{p.priority}</td>}
                    <td className="px-3 sm:px-4 py-3 text-right text-white font-semibold">{done ? p.completion : blank}</td>
                    <td className="px-3 sm:px-4 py-3 text-right whitespace-nowrap">
                      {done ? (
                        <>
                          <span className="text-white/35">{p.completion} − {p.arrival} = </span>
                          <span className="text-white font-semibold">{p.turnaround}</span>
                        </>
                      ) : blank}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-right whitespace-nowrap">
                      {done ? (
                        <>
                          <span className="text-white/35">{p.turnaround} − {p.burst} = </span>
                          <span className="text-white font-semibold">{p.waiting}</span>
                        </>
                      ) : blank}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-right whitespace-nowrap">
                      {started ? (
                        <>
                          <span className="text-white/35">{p.startTime} − {p.arrival} = </span>
                          <span className="text-white font-semibold">{p.response}</span>
                        </>
                      ) : blank}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {solved && (
              <tfoot>
                <tr className="border-t border-white/15 bg-white/[0.02] text-white/60">
                  <td className="px-3 sm:px-4 py-3 text-[10px] uppercase tracking-[0.15em]" colSpan={showPriority ? 5 : 4}>
                    Total
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-right text-white font-semibold">{sumTAT}</td>
                  <td className="px-3 sm:px-4 py-3 text-right text-white font-semibold">{sumWT}</td>
                  <td className="px-3 sm:px-4 py-3 text-right text-white font-semibold">{sumRT}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>

      {/* ------------------------- Final: averages ------------------------- */}
      <section className="px-4 sm:px-6 md:px-8 py-6 sm:py-8">
        <SectionHeading step={ws.hasSplitBursts ? 'Step 4' : 'Step 3'} title="Compute the averages" />
        {solved ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-px bg-white/10 border border-white/10">
            {[
              {
                label: 'Average Turnaround Time',
                work: `(${processes.map((p) => p.turnaround).join(' + ')}) / ${n} = ${sumTAT} / ${n}`,
                value: sumTAT / n,
                unit: 'ms',
              },
              {
                label: 'Average Waiting Time',
                work: `(${processes.map((p) => p.waiting).join(' + ')}) / ${n} = ${sumWT} / ${n}`,
                value: sumWT / n,
                unit: 'ms',
              },
              {
                label: 'Average Response Time',
                work: `(${processes.map((p) => Math.max(p.response, 0)).join(' + ')}) / ${n} = ${sumRT} / ${n}`,
                value: sumRT / n,
                unit: 'ms',
              },
              {
                label: 'CPU Utilization',
                work: `busy / total = ${busy} / ${total} × 100`,
                value: total === 0 ? 0 : (busy / total) * 100,
                unit: '%',
              },
              {
                label: 'Throughput',
                work: `processes / total time = ${n} / ${total}`,
                value: total === 0 ? 0 : n / total,
                unit: 'per ms',
              },
              {
                label: 'Idle Time',
                work: `total − busy = ${total} − ${busy}`,
                value: idle,
                unit: 'ms',
              },
            ].map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.04, ease: EASE }}
                className="bg-[#070707] p-4 sm:p-5"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45 mb-3">{m.label}</p>
                <p className="font-mono text-[11px] text-white/45 break-words leading-relaxed">{m.work}</p>
                <p className="font-mono text-2xl font-light text-white mt-2">
                  {m.label === 'Throughput' ? m.value.toFixed(3) : m.unit === '%' ? m.value.toFixed(2) : fmt(Number(m.value.toFixed(2)))}
                  <span className="text-sm text-white/40 ml-1.5">{m.unit}</span>
                </p>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="border border-dashed border-white/15 px-4 py-6 text-center text-sm text-white/40">
            Finish the Gantt chart to compute the averages.
          </p>
        )}
      </section>
    </div>
  );
}

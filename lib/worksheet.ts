// Derives the hand-solved worksheet — Gantt blocks, decision points, ready
// queues, and remaining bursts — from a SimulationResult. Everything here is
// computed from the engine's own trace, so the worksheet cannot disagree with
// the schedule that was actually produced.

import { Process, ScheduleStep, SimulationResult, StepCandidate } from './types';

export type BlockEnd = 'completed' | 'quantum' | 'preempted' | 'idle';

export interface GanttBlock {
  process: number | 'idle';
  start: number;
  end: number;
  endedBy: BlockEnd;
}

export interface QueueEntry {
  id: number;
  remaining: number;
}

export interface WorksheetEvent {
  time: number;
  /** Next event time, i.e. how far the chart is drawn once this event is solved. */
  until: number;
  /** True when the CPU is (re)assigned here; false for an arrival mid-block. */
  isDispatch: boolean;
  running: number | 'idle';
  /** Remaining burst of the running process at `time`, before it runs. */
  runningRemaining: number;
  arrivals: number[];
  completions: number[];
  preempted: number | null;
  /** Why `preempted` lost the CPU: a better process, or its quantum ran out. */
  preemptedBy: 'priority' | 'quantum' | null;
  /** Processes waiting in the ready queue (excludes the one on the CPU). */
  waiting: QueueEntry[];
  candidates: StepCandidate[];
  reason: string;
}

export interface Worksheet {
  blocks: GanttBlock[];
  events: WorksheetEvent[];
  totalTime: number;
  /** Times shown under the Gantt chart: every block boundary. */
  ticks: number[];
  /** remaining[pid][i] = remaining burst at events[i].time (null before arrival). */
  remaining: Map<number, (number | null)[]>;
  /** True when some process runs in more than one block. */
  hasSplitBursts: boolean;
}

/**
 * Collapses the engine's dispatch trace into the boxes a student would draw.
 * Preemptive runners record one step per millisecond; consecutive steps of the
 * same process merge unless the earlier one ended on completion or a quantum.
 */
export function buildBlocks(result: SimulationResult): GanttBlock[] {
  const source: { running: number | 'idle'; time: number; endTime: number; sliceEnd?: ScheduleStep['sliceEnd'] }[] =
    result.steps.length > 0
      ? result.steps
      : result.timeline.map((t) => ({ running: t.process, time: t.start, endTime: t.end }));

  const blocks: GanttBlock[] = [];
  let lastSliceEnd: ScheduleStep['sliceEnd'] | undefined;

  for (const s of source) {
    const last = blocks[blocks.length - 1];
    const canMerge =
      last &&
      last.process === s.running &&
      last.end === s.time &&
      (s.running === 'idle' || lastSliceEnd === 'awaiting-arrival' || lastSliceEnd === undefined);
    if (canMerge) {
      last.end = s.endTime;
    } else {
      blocks.push({ process: s.running, start: s.time, end: s.endTime, endedBy: 'preempted' });
    }
    lastSliceEnd = s.sliceEnd;
    const current = blocks[blocks.length - 1];
    current.endedBy =
      s.running === 'idle'
        ? 'idle'
        : s.sliceEnd === 'completed'
          ? 'completed'
          : s.sliceEnd === 'quantum'
            ? 'quantum'
            : 'preempted';
  }

  // Without a trace, a block completes when it is the process's last block.
  if (result.steps.length === 0) {
    const lastBlockOf = new Map<number, GanttBlock>();
    blocks.forEach((b) => b.process !== 'idle' && lastBlockOf.set(b.process, b));
    lastBlockOf.forEach((b) => (b.endedBy = 'completed'));
  }

  return blocks;
}

function executedBefore(blocks: GanttBlock[], pid: number, t: number): number {
  let used = 0;
  for (const b of blocks) {
    if (b.process !== pid || b.start >= t) continue;
    used += Math.min(b.end, t) - b.start;
  }
  return used;
}

export function buildWorksheet(result: SimulationResult): Worksheet {
  const blocks = buildBlocks(result);
  const processes = result.processes;
  const totalTime = blocks.length ? blocks[blocks.length - 1].end : 0;
  const byId = new Map<number, Process>(processes.map((p) => [p.id, p]));
  const stepAt = new Map<number, ScheduleStep>();
  result.steps.forEach((s) => {
    if (!stepAt.has(s.time)) stepAt.set(s.time, s);
  });

  const blockStarts = new Set(blocks.map((b) => b.start));
  const times = [...new Set([...blockStarts, ...processes.map((p) => p.arrival).filter((a) => a < totalTime)])].sort(
    (a, b) => a - b
  );

  const remainingAt = (pid: number, t: number) => byId.get(pid)!.burst - executedBefore(blocks, pid, t);

  const events: WorksheetEvent[] = times.map((t, i) => {
    const block = blocks.find((b) => b.start <= t && t < b.end)!;
    const running = block.process;
    const isDispatch = blockStarts.has(t);
    const prevBlock = blocks.find((b) => b.end === t && b.process !== 'idle');

    const arrivals = processes.filter((p) => p.arrival === t).map((p) => p.id);
    const completions = blocks
      .filter((b) => b.end === t && b.endedBy === 'completed' && b.process !== 'idle')
      .map((b) => b.process as number);
    const preempted =
      isDispatch && prevBlock && prevBlock.endedBy !== 'completed' && prevBlock.process !== running
        ? (prevBlock.process as number)
        : null;
    const preemptedBy = preempted === null ? null : prevBlock!.endedBy === 'quantum' ? 'quantum' : 'priority';

    // Queue order: the engine's snapshot at the nearest decision at or before
    // `t`, then anyone who arrived after that decision, in arrival order.
    const anchor = [...result.steps].reverse().find((s) => s.time <= t);
    const order: number[] = anchor ? [...anchor.readyQueue] : [];
    processes
      .filter((p) => p.arrival <= t && (!anchor || p.arrival > anchor.time))
      .sort((a, b) => a.arrival - b.arrival || a.id - b.id)
      .forEach((p) => order.includes(p.id) || order.push(p.id));
    processes
      .filter((p) => p.arrival <= t)
      .sort((a, b) => a.arrival - b.arrival || a.id - b.id)
      .forEach((p) => order.includes(p.id) || order.push(p.id));

    const waiting = order
      .filter((id) => id !== running && remainingAt(id, t) > 0)
      .map((id) => ({ id, remaining: remainingAt(id, t) }));

    const step = stepAt.get(t);
    const runningRemaining = running === 'idle' ? 0 : remainingAt(running, t);

    let reason = step?.reason ?? '';
    if (!step || !isDispatch) {
      const plural = arrivals.length > 1;
      const who = arrivals.length ? `${arrivals.map((id) => `P${id}`).join(', ')} arrive${plural ? '' : 's'}` : 'The ready queue is checked';
      reason =
        running === 'idle'
          ? `${who}. The CPU stays idle.`
          : step
            ? `${who}, so the ready queue is re-checked. ${step.reason}`
            : `${who} and join${plural ? '' : 's'} the ready queue. P${running} keeps the CPU — it cannot be interrupted until its current ${
                block.endedBy === 'quantum' || block.endedBy === 'preempted' ? 'time slice' : 'burst'
              } ends at t = ${block.end}.`;
    }

    return {
      time: t,
      until: times[i + 1] ?? totalTime,
      isDispatch,
      running,
      runningRemaining,
      arrivals,
      completions,
      preempted,
      preemptedBy,
      waiting,
      candidates: step?.candidates ?? [],
      reason,
    };
  });

  const remaining = new Map<number, (number | null)[]>();
  processes.forEach((p) => {
    remaining.set(
      p.id,
      events.map((e) => (p.arrival > e.time ? null : remainingAt(p.id, e.time)))
    );
  });

  const ticks = [...new Set([0, ...blocks.flatMap((b) => [b.start, b.end])])].sort((a, b) => a - b);
  const blockCount = new Map<number, number>();
  blocks.forEach((b) => b.process !== 'idle' && blockCount.set(b.process, (blockCount.get(b.process) ?? 0) + 1));

  return {
    blocks,
    events,
    totalTime,
    ticks,
    remaining,
    hasSplitBursts: [...blockCount.values()].some((c) => c > 1),
  };
}

export interface QueueSlot {
  id: number;
  /** Remaining burst at the moment the process joined the queue. */
  remaining: number;
  enqueuedAt: number;
  /** When it reached the front and got the CPU; null if never served. */
  servedAt: number | null;
}

/**
 * The Round Robin ready queue as it is written by hand above the Gantt chart:
 * every time a process joins the queue (on arrival, or after its quantum
 * expires) it is appended, and each entry is crossed off when it is served.
 * Arrivals during a slice join before the preempted process is re-queued,
 * matching the engine. Returns null if the reconstruction ever disagrees with
 * the actual schedule, so the UI never shows a queue that is not true.
 */
export function buildRoundRobinQueue(result: SimulationResult, blocks: GanttBlock[]): QueueSlot[] | null {
  const byArrival = [...result.processes].sort((a, b) => a.arrival - b.arrival || a.id - b.id);
  const slots: QueueSlot[] = [];
  const remaining = new Map(result.processes.map((p) => [p.id, p.burst]));
  let admittedUpTo = -1;
  let front = 0;

  const admit = (t: number) => {
    byArrival
      .filter((p) => p.arrival > admittedUpTo && p.arrival <= t)
      .forEach((p) => slots.push({ id: p.id, remaining: p.burst, enqueuedAt: p.arrival, servedAt: null }));
    admittedUpTo = Math.max(admittedUpTo, t);
  };

  for (const b of blocks) {
    admit(b.start);
    if (b.process !== 'idle') {
      const slot = slots[front];
      if (!slot || slot.id !== b.process) return null;
      slot.servedAt = b.start;
      front++;
      const left = remaining.get(b.process)! - (b.end - b.start);
      remaining.set(b.process, left);
      admit(b.end);
      if (left > 0) slots.push({ id: b.process, remaining: left, enqueuedAt: b.end, servedAt: null });
    } else {
      admit(b.end);
    }
  }
  return front === slots.length ? slots : null;
}

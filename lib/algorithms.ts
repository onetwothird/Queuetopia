import { Process, SimulationResult, TimelineEvent, ScheduleStep, StepCandidate, Algorithm } from './types';

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

function cloneProcesses(processes: Process[]): Process[] {
  return processes
    .map((p) => ({
      ...p,
      remainingBurst: p.burst,
      completion: 0,
      turnaround: 0,
      waiting: 0,
      response: -1,
      startTime: -1,
    }))
    .sort((a, b) => a.arrival - b.arrival || a.id - b.id);
}

function finalizeIfDone(p: Process, currentTime: number) {
  if (p.remainingBurst === 0) {
    p.completion = currentTime;
    p.turnaround = p.completion - p.arrival;
    p.waiting = p.turnaround - p.burst;
  }
}

function mergeTimeline(timeline: TimelineEvent[]): TimelineEvent[] {
  const merged: TimelineEvent[] = [];
  for (const ev of timeline) {
    const last = merged[merged.length - 1];
    if (last && last.process === ev.process && last.end === ev.start) {
      last.end = ev.end;
    } else {
      merged.push({ ...ev });
    }
  }
  return merged;
}

function byIdAsc(processes: Process[]): Process[] {
  return [...processes].sort((a, b) => a.id - b.id);
}

/**
 * Accumulates the decision trace alongside the timeline. Every simulator in
 * this file routes its dispatches through `record`, which is what lets the
 * step-by-step walkthrough stay exactly in sync with the Gantt chart.
 */
class Tracer {
  steps: ScheduleStep[] = [];

  record(step: Omit<ScheduleStep, 'index'>) {
    this.steps.push({ ...step, index: this.steps.length });
  }
}

function buildResult(procs: Process[], timeline: TimelineEvent[], steps: ScheduleStep[]): SimulationResult {
  return { timeline: mergeTimeline(timeline), processes: byIdAsc(procs), steps };
}

/** Ready set: arrived, not yet finished. */
function readySet(procs: Process[], currentTime: number): Process[] {
  return procs.filter((p) => p.arrival <= currentTime && p.remainingBurst > 0);
}

function arrivedIds(procs: Process[], currentTime: number): number[] {
  return procs.filter((p) => p.arrival <= currentTime).map((p) => p.id);
}

function arrivalIdsAt(procs: Process[], currentTime: number, excludeFinished = true): number[] {
  return procs
    .filter((p) => p.arrival === currentTime && (!excludeFinished || p.remainingBurst > 0))
    .map((p) => p.id);
}

/** Earliest arrival strictly after `t` among unfinished processes. */
function nextArrivalAfter(procs: Process[], t: number): number | null {
  const upcoming = procs.filter((p) => p.remainingBurst > 0 && p.arrival > t).map((p) => p.arrival);
  return upcoming.length ? Math.min(...upcoming) : null;
}

/** Builds the per-candidate ranking shown in the walkthrough. */
function candidatesFrom(ready: Process[], key: (p: Process) => number, label: (p: Process, k: number) => string): StepCandidate[] {
  return ready.map((p) => {
    const k = key(p);
    return { id: p.id, key: k, detail: label(p, k) };
  });
}

const ms = (n: number) => `${n}ms`;
const list = (ids: number[]) => (ids.length ? ids.map((id) => `P${id}`).join(', ') : 'empty');

/* ------------------------------------------------------------------ */
/* Non-preemptive runners                                              */
/* ------------------------------------------------------------------ */

/**
 * Shared driver for the non-preemptive disciplines. `selector` returns the
 * chosen process plus the candidate ranking that justified it; the driver
 * owns idle handling, completion, and trace emission.
 */
function simulateNonPreemptive(
  processes: Process[],
  selector: (
    ready: Process[],
    currentTime: number
  ) => { chosen: Process; candidates: StepCandidate[]; reason: string }
): SimulationResult {
  const procs = cloneProcesses(processes);
  const finished = new Set<number>();
  const tracer = new Tracer();
  let currentTime = Math.min(...procs.map((p) => p.arrival));
  const timeline: TimelineEvent[] = [];

  while (finished.size < procs.length) {
    const ready = readySet(procs, currentTime).filter((p) => !finished.has(p.id));

    if (ready.length === 0) {
      const nextArrival = Math.min(...procs.filter((p) => !finished.has(p.id)).map((p) => p.arrival));
      timeline.push({ process: 'idle', start: currentTime, end: nextArrival });
      tracer.record({
        time: currentTime,
        duration: nextArrival - currentTime,
        running: 'idle',
        endTime: nextArrival,
        chosen: 'idle',
        readyQueue: [],
        arrived: arrivedIds(procs, currentTime),
        candidates: [],
        arrivals: [],
        reason: `No process is available, so the CPU idles. The next process (P${procs.find((p) => !finished.has(p.id))!.id}) has not arrived yet.`,
        preempted: null,
        sliceEnd: 'awaiting-arrival',
      });
      currentTime = nextArrival;
      continue;
    }

    const { chosen, candidates, reason } = selector(ready, currentTime);
    const isFirstRun = chosen.startTime === -1;
    if (isFirstRun) {
      chosen.startTime = currentTime;
      chosen.response = currentTime - chosen.arrival;
    }
    timeline.push({ process: chosen.id, start: currentTime, end: currentTime + chosen.burst });

    tracer.record({
      time: currentTime,
      duration: chosen.burst,
      running: chosen.id,
      endTime: currentTime + chosen.burst,
      chosen: chosen.id,
      readyQueue: ready.map((p) => p.id),
      arrived: arrivedIds(procs, currentTime),
      candidates,
      arrivals: arrivalIdsAt(procs, currentTime),
      reason,
      preempted: null,
      sliceEnd: 'completed',
    });

    currentTime += chosen.burst;
    chosen.remainingBurst = 0;
    chosen.completion = currentTime;
    chosen.turnaround = chosen.completion - chosen.arrival;
    chosen.waiting = chosen.turnaround - chosen.burst;
    finished.add(chosen.id);
  }

  return buildResult(procs, timeline, tracer.steps);
}

/* ------------------------------------------------------------------ */
/* Preemptive, priority-ordered runner                                 */
/* ------------------------------------------------------------------ */

/**
 * Shared driver for SRTF / priority-preemptive / EDF / RMS. These re-evaluate
 * the ready set after every dispatch, so a slice may end because a new arrival
 * outranks the running process.
 */
function simulatePreemptive(
  processes: Process[],
  comparator: (a: Process, b: Process) => number,
  describe: (ready: Process[], chosen: Process, currentTime: number) => { candidates: StepCandidate[]; reason: string }
): SimulationResult {
  const procs = cloneProcesses(processes);
  const n = procs.length;
  const tracer = new Tracer();
  let completed = 0;
  let currentTime = Math.min(...procs.map((p) => p.arrival));
  const timeline: TimelineEvent[] = [];

  while (completed < n) {
    const ready = readySet(procs, currentTime);

    if (ready.length === 0) {
      const nextArrival = Math.min(...procs.filter((p) => p.remainingBurst > 0).map((p) => p.arrival));
      timeline.push({ process: 'idle', start: currentTime, end: nextArrival });
      tracer.record({
        time: currentTime,
        duration: nextArrival - currentTime,
        running: 'idle',
        endTime: nextArrival,
        chosen: 'idle',
        readyQueue: [],
        arrived: arrivedIds(procs, currentTime),
        candidates: [],
        arrivals: [],
        reason: `The ready queue is empty, so the CPU idles until the next arrival.`,
        preempted: null,
        sliceEnd: 'awaiting-arrival',
      });
      currentTime = nextArrival;
      continue;
    }

    ready.sort(comparator);
    const running = ready[0];
    const isFirstRun = running.startTime === -1;
    if (isFirstRun) {
      running.startTime = currentTime;
      running.response = currentTime - running.arrival;
    }

    const { candidates, reason } = describe(ready, running, currentTime);
    const start = currentTime;
    currentTime += 1;
    running.remainingBurst -= 1;
    timeline.push({ process: running.id, start, end: currentTime });

    // Decide what ended this slice: finishing, or yielding to something better.
    const willFinish = running.remainingBurst === 0;
    let sliceEnd: ScheduleStep['sliceEnd'] = 'awaiting-arrival';
    let preempted: number | null = null;
    if (willFinish) {
      sliceEnd = 'completed';
    } else {
      const nextArrival = nextArrivalAfter(procs, currentTime);
      if (nextArrival === null || nextArrival > currentTime) {
        // Nothing new to preempt with; keep the same process if still best.
        const stillBest = readySet(procs, currentTime).sort(comparator)[0];
        if (stillBest && stillBest.id === running.id) {
          sliceEnd = 'awaiting-arrival';
          preempted = null;
        } else if (stillBest) {
          sliceEnd = 'awaiting-arrival';
          preempted = running.id;
        }
      } else {
        const after = readySet(procs, nextArrival).sort(comparator)[0];
        if (after && after.id !== running.id) {
          sliceEnd = 'awaiting-arrival';
          preempted = running.id;
        }
      }
    }

    tracer.record({
      time: start,
      duration: 1,
      running: running.id,
      endTime: currentTime,
      chosen: running.id,
      readyQueue: ready.map((p) => p.id),
      arrived: arrivedIds(procs, start),
      candidates,
      arrivals: arrivalIdsAt(procs, start),
      reason,
      preempted,
      sliceEnd,
    });

    if (running.remainingBurst === 0) {
      finalizeIfDone(running, currentTime);
      completed++;
    }
  }

  return buildResult(procs, timeline, tracer.steps);
}

/* ------------------------------------------------------------------ */
/* Quantum-based runner                                                */
/* ------------------------------------------------------------------ */

/**
 * Shared driver for every time-sliced discipline (RR, MLQ, MLFQ, lottery,
 * stride, guaranteed, fair share). `next` returns the process to dispatch and
 * how long it may run before control returns to the driver; `requeue` places
 * a partially-executed process back into the algorithm's own structures.
 */
function simulateQuantum(
  processes: Process[],
  quantum: number,
  strategy: {
    /** Ready processes in the order the algorithm would consider them. */
    ready: (procs: Process[], t: number) => Process[];
    /** Choose the next process and explain the choice. */
    select: (
      ready: Process[],
      t: number,
      procs: Process[]
    ) => { chosen: Process; candidates: StepCandidate[]; reason: string };
    /** How long the chosen process may run: bounded by the time quantum. */
    runFor: (chosen: Process) => number;
    /**
     * Called after *every* slice, with the time actually served. Proportional
     * schedulers bank their accounting here — stride pass values and
     * service ratios advance per slice, not per completion.
     */
    afterSlice?: (chosen: Process, served: number) => void;
  }
): SimulationResult {
  const procs = cloneProcesses(processes);
  const n = procs.length;
  const tracer = new Tracer();
  let currentTime = Math.min(...procs.map((p) => p.arrival));
  const timeline: TimelineEvent[] = [];
  let completed = 0;
  let previous: Process | null = null;

  while (completed < n) {
    const ready = strategy.ready(procs, currentTime);

    if (ready.length === 0) {
      const remaining = procs.filter((p) => p.remainingBurst > 0);
      if (remaining.length === 0) break;
      const nextArrival = Math.min(...remaining.map((p) => p.arrival));
      timeline.push({ process: 'idle', start: currentTime, end: nextArrival });
      tracer.record({
        time: currentTime,
        duration: nextArrival - currentTime,
        running: 'idle',
        endTime: nextArrival,
        chosen: 'idle',
        readyQueue: [],
        arrived: arrivedIds(procs, currentTime),
        candidates: [],
        arrivals: [],
        reason: `No process is ready, so the CPU idles until the next process arrives.`,
        preempted: null,
        sliceEnd: 'awaiting-arrival',
      });
      currentTime = nextArrival;
      previous = null;
      continue;
    }

    const { chosen, candidates, reason } = strategy.select(ready, currentTime, procs);
    const isFirstRun = chosen.startTime === -1;
    if (isFirstRun) {
      chosen.startTime = currentTime;
      chosen.response = currentTime - chosen.arrival;
    }

    const runFor = Math.min(strategy.runFor(chosen), chosen.remainingBurst);
    const start = currentTime;
    currentTime += runFor;
    chosen.remainingBurst -= runFor;
    timeline.push({ process: chosen.id, start, end: currentTime });

    const finishedNow = chosen.remainingBurst === 0;
    const preempted = !finishedNow && previous && previous.id !== chosen.id ? previous.id : null;

    tracer.record({
      time: start,
      duration: runFor,
      running: chosen.id,
      endTime: currentTime,
      chosen: chosen.id,
      readyQueue: ready.map((p) => p.id),
      arrived: arrivedIds(procs, start),
      candidates,
      arrivals: arrivalIdsAt(procs, start),
      reason,
      preempted,
      sliceEnd: finishedNow ? 'completed' : 'quantum',
    });

    strategy.afterSlice?.(chosen, runFor);

    if (finishedNow) {
      finalizeIfDone(chosen, currentTime);
      completed++;
    }
    previous = finishedNow ? null : chosen;
  }

  return buildResult(procs, timeline, tracer.steps);
}

/* ------------------------------------------------------------------ */
/* Classic algorithms                                                  */
/* ------------------------------------------------------------------ */

export function simulateFCFS(processes: Process[]): SimulationResult {
  const procs = cloneProcesses(processes);
  const tracer = new Tracer();
  const finished = new Set<number>();
  let currentTime = Math.min(...procs.map((p) => p.arrival));
  const timeline: TimelineEvent[] = [];

  // FCFS is the one non-preemptive discipline whose ready order is a stable
  // FIFO rather than a per-decision scan, so it keeps its own driver. Ordering
  // by arrival reproduces the original single-pass implementation exactly.
  const ordered = [...procs].sort((a, b) => a.arrival - b.arrival || a.id - b.id);

  for (const process of ordered) {
    if (currentTime < process.arrival) {
      timeline.push({ process: 'idle', start: currentTime, end: process.arrival });
      tracer.record({
        time: currentTime,
        duration: process.arrival - currentTime,
        running: 'idle',
        endTime: process.arrival,
        chosen: 'idle',
        readyQueue: [],
        arrived: arrivedIds(procs, currentTime),
        candidates: [],
        arrivals: [],
        reason: `The CPU is free and no process has arrived yet, so it idles.`,
        preempted: null,
        sliceEnd: 'awaiting-arrival',
      });
      currentTime = process.arrival;
    }

    const ready = readySet(procs, currentTime);
    const isFirstRun = process.startTime === -1;
    if (isFirstRun) {
      process.startTime = currentTime;
      process.response = currentTime - process.arrival;
    }

    tracer.record({
      time: currentTime,
      duration: process.burst,
      running: process.id,
      endTime: currentTime + process.burst,
      chosen: process.id,
      readyQueue: ready.map((p) => p.id),
      arrived: arrivedIds(procs, currentTime),
      candidates: ready.map((p) => ({ id: p.id, key: p.arrival, detail: `arrived ${ms(p.arrival)}` })),
      arrivals: arrivalIdsAt(procs, currentTime),
      reason:
        ready.length <= 1
          ? `P${process.id} is the only process in the ready queue, so it takes the CPU immediately.`
          : `P${process.id} is dispatched because it is the earliest arrival still waiting (arrived at ${ms(process.arrival)}). FCFS never looks past arrival order.`,
      preempted: null,
      sliceEnd: 'completed',
    });

    timeline.push({ process: process.id, start: currentTime, end: currentTime + process.burst });
    process.remainingBurst = 0;
    process.completion = currentTime + process.burst;
    process.turnaround = process.completion - process.arrival;
    process.waiting = process.turnaround - process.burst;
    currentTime = process.completion;
    finished.add(process.id);
  }

  return buildResult(procs, timeline, tracer.steps);
}

export function simulateSJF(processes: Process[]): SimulationResult {
  return simulateNonPreemptive(processes, (ready, t) => {
    const sorted = [...ready].sort((a, b) => a.burst - b.burst || a.arrival - b.arrival || a.id - b.id);
    const chosen = sorted[0];
    const candidates = candidatesFrom(ready, (p) => p.burst, (p, k) => `burst ${ms(k)}`);
    const beaten = sorted.slice(1);
    const reason =
      ready.length === 1
        ? `P${chosen.id} is the only ready process, so it runs.`
        : `P${chosen.id} has the shortest burst of everything waiting (${ms(chosen.burst)})${
            beaten.length ? `, ahead of ${list(beaten.map((p) => p.id))}` : ''
          }. SJF optimises average waiting time by finishing short jobs first.`;
    void t;
    return { chosen, candidates, reason };
  });
}

export function simulatePriorityNP(processes: Process[]): SimulationResult {
  return simulateNonPreemptive(processes, (ready) => {
    const sorted = [...ready].sort((a, b) => a.priority - b.priority || a.arrival - b.arrival || a.id - b.id);
    const chosen = sorted[0];
    const candidates = candidatesFrom(ready, (p) => p.priority, (p, k) => `priority ${k} (lower runs first)`);
    const reason =
      ready.length === 1
        ? `P${chosen.id} is the only ready process.`
        : `P${chosen.id} holds the highest priority of the ready set (priority ${chosen.priority}). Because this is the non-preemptive variant, it keeps the CPU for its entire burst regardless of who arrives next.`;
    return { chosen, candidates, reason };
  });
}

export function simulateHRRN(processes: Process[]): SimulationResult {
  return simulateNonPreemptive(processes, (ready, currentTime) => {
    const ratio = (p: Process) => (currentTime - p.arrival + p.burst) / p.burst;
    const sorted = [...ready].sort((a, b) => ratio(b) - ratio(a) || a.id - b.id);
    const chosen = sorted[0];
    const candidates = candidatesFrom(
      ready,
      ratio,
      (p, k) => `ratio ${k.toFixed(2)} = (wait ${ms(currentTime - p.arrival)} + burst ${ms(p.burst)}) / burst`
    );
    const reason =
      ready.length === 1
        ? `P${chosen.id} is the only ready process.`
        : `P${chosen.id} has the highest response ratio (${ratio(chosen).toFixed(2)}). Processes that have waited longer climb the queue, which is how HRRN avoids starving long jobs the way SJF does.`;
    return { chosen, candidates, reason };
  });
}

export function simulateSRTF(processes: Process[]): SimulationResult {
  return simulatePreemptive(
    processes,
    (a, b) => a.remainingBurst - b.remainingBurst || a.id - b.id,
    (ready, chosen) => {
      const candidates = candidatesFrom(ready, (p) => p.remainingBurst, (p, k) => `remaining ${ms(k)}`);
      const reason =
        ready.length === 1
          ? `P${chosen.id} is the only ready process, so it keeps the CPU.`
          : `P${chosen.id} has the least work remaining (${ms(chosen.remainingBurst)}). SRTF re-checks after every millisecond and preempts whenever a shorter remaining burst appears.`;
      return { candidates, reason };
    }
  );
}

export function simulatePriorityP(processes: Process[]): SimulationResult {
  return simulatePreemptive(
    processes,
    (a, b) => a.priority - b.priority || a.id - b.id,
    (ready, chosen) => {
      const candidates = candidatesFrom(ready, (p) => p.priority, (p, k) => `priority ${k} (lower runs first)`);
      const reason =
        ready.length === 1
          ? `P${chosen.id} is the only ready process, so it keeps the CPU.`
          : `P${chosen.id} has the highest priority of the ready set (priority ${chosen.priority}). A higher-priority arrival would preempt it immediately.`;
      return { candidates, reason };
    }
  );
}

export function simulateEDF(processes: Process[]): SimulationResult {
  return simulatePreemptive(
    processes,
    (a, b) => (a.deadline ?? Infinity) - (b.deadline ?? Infinity) || a.id - b.id,
    (ready, chosen) => {
      const candidates = candidatesFrom(ready, (p) => p.deadline ?? Infinity, (p, k) =>
        Number.isFinite(k) ? `deadline ${ms(k)}` : 'no deadline set'
      );
      const reason =
        ready.length === 1
          ? `P${chosen.id} is the only ready process, so it keeps the CPU.`
          : `P${chosen.id} has the earliest absolute deadline (${ms(chosen.deadline ?? 0)}). EDF is optimal for meeting deadlines on a single processor when nothing is over-constrained.`;
      return { candidates, reason };
    }
  );
}

export function simulateRMS(processes: Process[]): SimulationResult {
  return simulatePreemptive(
    processes,
    (a, b) => (a.period ?? Infinity) - (b.period ?? Infinity) || a.id - b.id,
    (ready, chosen) => {
      const candidates = candidatesFrom(ready, (p) => p.period ?? Infinity, (p, k) =>
        Number.isFinite(k) ? `period ${ms(k)}` : 'no period set'
      );
      const reason =
        ready.length === 1
          ? `P${chosen.id} is the only ready process, so it keeps the CPU.`
          : `P${chosen.id} has the shortest period (${ms(chosen.period ?? 0)}), which under rate-monotonic scheduling means the highest fixed priority. Priorities are assigned up front and never change.`;
      return { candidates, reason };
    }
  );
}

export function simulateRR(processes: Process[], quantum: number): SimulationResult {
  const procs = cloneProcesses(processes);
  const n = procs.length;
  const queue: Process[] = [];
  const tracer = new Tracer();
  let i = 0;
  let completed = 0;
  let currentTime = procs[0].arrival;
  const timeline: TimelineEvent[] = [];

  while (i < n && procs[i].arrival <= currentTime) queue.push(procs[i++]);

  while (completed < n) {
    if (queue.length === 0) {
      const nextArrival = procs[i].arrival;
      timeline.push({ process: 'idle', start: currentTime, end: nextArrival });
      tracer.record({
        time: currentTime,
        duration: nextArrival - currentTime,
        running: 'idle',
        endTime: nextArrival,
        chosen: 'idle',
        readyQueue: [],
        arrived: arrivedIds(procs, currentTime),
        candidates: [],
        arrivals: [],
        reason: `The ready queue is empty, so the CPU idles until P${procs[i].id} arrives.`,
        preempted: null,
        sliceEnd: 'awaiting-arrival',
      });
      currentTime = nextArrival;
      while (i < n && procs[i].arrival <= currentTime) queue.push(procs[i++]);
      continue;
    }

    const running = queue.shift()!;
    const isFirstRun = running.startTime === -1;
    if (isFirstRun) {
      running.startTime = currentTime;
      running.response = currentTime - running.arrival;
    }

    const runFor = Math.min(quantum, running.remainingBurst);
    const start = currentTime;
    currentTime += runFor;
    running.remainingBurst -= runFor;
    while (i < n && procs[i].arrival <= currentTime) queue.push(procs[i++]);
    timeline.push({ process: running.id, start, end: currentTime });

    const finishedNow = running.remainingBurst === 0;
    tracer.record({
      time: start,
      duration: runFor,
      running: running.id,
      endTime: currentTime,
      chosen: running.id,
      readyQueue: queue.map((p) => p.id),
      arrived: arrivedIds(procs, start),
      candidates: [candidatesFrom([running], (p) => p.remainingBurst + runFor, (p, k) => `ran ${ms(k)} this slice`)[0]],
      arrivals: arrivalIdsAt(procs, start),
      reason: `P${running.id} reaches the front of the circular ready queue and is granted up to ${ms(quantum)}. ${
        finishedNow
          ? `Its remaining burst fits inside the quantum, so it finishes.`
          : `Its burst exceeds the quantum, so it is preempted and sent to the back of the queue.`
      }`,
      preempted: null,
      sliceEnd: finishedNow ? 'completed' : 'quantum',
    });

    if (running.remainingBurst > 0) {
      queue.push(running);
    } else {
      finalizeIfDone(running, currentTime);
      completed++;
    }
  }

  return buildResult(procs, timeline, tracer.steps);
}

export function simulateMLQ(processes: Process[], quantum: number): SimulationResult {
  const procs = cloneProcesses(processes);
  const n = procs.length;
  const tracer = new Tracer();
  let currentTime = Math.min(...procs.map((p) => p.arrival));
  const timeline: TimelineEvent[] = [];
  let completed = 0;
  const q1: Process[] = [];
  const q2: Process[] = [];
  const arrived = new Set<number>();

  const admit = (time: number) => {
    procs.forEach((p) => {
      if (!arrived.has(p.id) && p.arrival <= time) {
        arrived.add(p.id);
        (p.queueLevel === 2 ? q2 : q1).push(p);
      }
    });
  };
  admit(currentTime);

  while (completed < n) {
    if (q1.length === 0 && q2.length === 0) {
      const nextArrival = Math.min(...procs.filter((p) => !arrived.has(p.id)).map((p) => p.arrival));
      timeline.push({ process: 'idle', start: currentTime, end: nextArrival });
      tracer.record({
        time: currentTime,
        duration: nextArrival - currentTime,
        running: 'idle',
        endTime: nextArrival,
        chosen: 'idle',
        readyQueue: [],
        arrived: arrivedIds(procs, currentTime),
        candidates: [],
        arrivals: [],
        reason: `Both queues are empty, so the CPU idles until the next arrival.`,
        preempted: null,
        sliceEnd: 'awaiting-arrival',
      });
      currentTime = nextArrival;
      admit(currentTime);
      continue;
    }

    if (q1.length > 0) {
      const running = q1.shift()!;
      const isFirstRun = running.startTime === -1;
      if (isFirstRun) {
        running.startTime = currentTime;
        running.response = currentTime - running.arrival;
      }
      const runFor = Math.min(quantum, running.remainingBurst);
      const start = currentTime;
      currentTime += runFor;
      running.remainingBurst -= runFor;
      admit(currentTime);
      timeline.push({ process: running.id, start, end: currentTime });
      const finishedNow = running.remainingBurst === 0;
      tracer.record({
        time: start,
        duration: runFor,
        running: running.id,
        endTime: currentTime,
        chosen: running.id,
        readyQueue: [...q1, ...q2].map((p) => p.id),
        arrived: arrivedIds(procs, start),
        candidates: [{ id: running.id, key: running.priority, detail: 'foreground queue (Q1)' }],
        arrivals: arrivalIdsAt(procs, start),
        reason: `P${running.id} is in the higher-priority queue, which is scheduled Round Robin with a ${ms(quantum)} quantum. It always outranks Queue 2 regardless of how long Queue 2 has been waiting.`,
        preempted: null,
        sliceEnd: finishedNow ? 'completed' : 'quantum',
      });
      if (running.remainingBurst > 0) q1.push(running);
      else {
        finalizeIfDone(running, currentTime);
        completed++;
      }
    } else {
      const running = q2[0];
      const isFirstRun = running.startTime === -1;
      if (isFirstRun) {
        running.startTime = currentTime;
        running.response = currentTime - running.arrival;
      }
      const start = currentTime;
      currentTime += 1;
      running.remainingBurst -= 1;
      admit(currentTime);
      timeline.push({ process: running.id, start, end: currentTime });
      const finishedNow = running.remainingBurst === 0;
      tracer.record({
        time: start,
        duration: 1,
        running: running.id,
        endTime: currentTime,
        chosen: running.id,
        readyQueue: [...q1, ...q2].map((p) => p.id),
        arrived: arrivedIds(procs, start),
        candidates: [{ id: running.id, key: running.priority, detail: 'background queue (Q2)' }],
        arrivals: arrivalIdsAt(procs, start),
        reason: `Only the lower-priority queue has work, so P${running.id} runs. Queue 2 uses FCFS, but any Queue 1 arrival preempts it.`,
        preempted: null,
        sliceEnd: finishedNow ? 'completed' : 'awaiting-arrival',
      });
      if (finishedNow) {
        q2.shift();
        finalizeIfDone(running, currentTime);
        completed++;
      }
    }
  }

  return buildResult(procs, timeline, tracer.steps);
}

export function simulateMLFQ(processes: Process[], baseQuantum: number): SimulationResult {
  const procs = cloneProcesses(processes);
  const n = procs.length;
  const quantums = [baseQuantum, baseQuantum * 2];
  const queues: Process[][] = [[], [], []];
  const arrived = new Set<number>();
  const usedInQuantum = new Map<number, number>();
  const tracer = new Tracer();
  let currentTime = Math.min(...procs.map((p) => p.arrival));
  const timeline: TimelineEvent[] = [];
  let completed = 0;

  const admit = (time: number) => {
    procs.forEach((p) => {
      if (!arrived.has(p.id) && p.arrival <= time) {
        arrived.add(p.id);
        queues[0].push(p);
        usedInQuantum.set(p.id, 0);
      }
    });
  };
  admit(currentTime);

  while (completed < n) {
    const levelIdx = queues.findIndex((q) => q.length > 0);
    if (levelIdx === -1) {
      const nextArrival = Math.min(...procs.filter((p) => !arrived.has(p.id)).map((p) => p.arrival));
      timeline.push({ process: 'idle', start: currentTime, end: nextArrival });
      tracer.record({
        time: currentTime,
        duration: nextArrival - currentTime,
        running: 'idle',
        endTime: nextArrival,
        chosen: 'idle',
        readyQueue: [],
        arrived: arrivedIds(procs, currentTime),
        candidates: [],
        arrivals: [],
        reason: `All feedback queues are empty, so the CPU idles until the next arrival.`,
        preempted: null,
        sliceEnd: 'awaiting-arrival',
      });
      currentTime = nextArrival;
      admit(currentTime);
      continue;
    }

    const running = queues[levelIdx][0];
    const isFirstRun = running.startTime === -1;
    if (isFirstRun) {
      running.startTime = currentTime;
      running.response = currentTime - running.arrival;
    }
    const levelQuantum = quantums[levelIdx];
    const start = currentTime;
    currentTime += 1;
    running.remainingBurst -= 1;
    usedInQuantum.set(running.id, (usedInQuantum.get(running.id) || 0) + 1);
    admit(currentTime);
    timeline.push({ process: running.id, start, end: currentTime });

    const finishedNow = running.remainingBurst === 0;
    let sliceEnd: ScheduleStep['sliceEnd'] = 'awaiting-arrival';
    let demoted = false;
    if (!finishedNow && levelQuantum !== undefined && (usedInQuantum.get(running.id) || 0) >= levelQuantum) {
      sliceEnd = 'quantum';
      demoted = true;
    }

    tracer.record({
      time: start,
      duration: 1,
      running: running.id,
      endTime: currentTime,
      chosen: running.id,
      readyQueue: queues.flat().map((p) => p.id),
      arrived: arrivedIds(procs, start),
      candidates: [
        {
          id: running.id,
          key: levelIdx,
          detail: `queue ${levelIdx}${levelQuantum ? `, ${ms(levelQuantum)} quantum` : ''}`,
        },
      ],
      arrivals: arrivalIdsAt(procs, start),
      reason: `P${running.id} is in the highest-priority feedback queue that has work. ${
        demoted
          ? `It has now used its full quantum at this level, so it is demoted to a lower queue with a longer slice — the signal that this process is CPU-bound.`
          : finishedNow
            ? `It completes here.`
            : `It keeps its place in this queue until its quantum is exhausted.`
      }`,
      preempted: null,
      sliceEnd,
    });

    if (finishedNow) {
      queues[levelIdx].shift();
      finalizeIfDone(running, currentTime);
      completed++;
      continue;
    }

    if (demoted) {
      queues[levelIdx].shift();
      usedInQuantum.set(running.id, 0);
      const nextLevel = Math.min(levelIdx + 1, queues.length - 1);
      queues[nextLevel].push(running);
    }
  }

  return buildResult(procs, timeline, tracer.steps);
}

export function simulateLottery(processes: Process[], quantum: number): SimulationResult {
  const procs = cloneProcesses(processes).map((p) => ({ ...p, tickets: p.tickets && p.tickets > 0 ? p.tickets : 10 }));
  // The PRNG state must persist across draws, so it lives outside `select`.
  // Seeded at 42 to keep runs reproducible for students comparing outcomes.
  let seed = 42;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  return simulateQuantum(procs, quantum, {
    ready: (ps, t) => readySet(ps, t),
    select: (ready) => {
      const totalTickets = ready.reduce((s, p) => s + (p.tickets || 10), 0);
      let draw = rand() * totalTickets;
      let chosen = ready[0];
      for (const p of ready) {
        draw -= p.tickets || 10;
        if (draw <= 0) {
          chosen = p;
          break;
        }
      }
      const candidates = candidatesFrom(ready, (p) => p.tickets || 10, (p, k) => `${k} of ${totalTickets} tickets (${((k / totalTickets) * 100).toFixed(0)}%)`);
      const reason = `A weighted lottery is drawn across the ready set: P${chosen.id} wins with ${chosen.tickets || 10} of ${totalTickets} tickets (${(((chosen.tickets || 10) / totalTickets) * 100).toFixed(0)}% chance). The draw is seeded, so this run is reproducible.`;
      return { chosen, candidates, reason };
    },
    runFor: (chosen) => Math.min(quantum, chosen.remainingBurst),
  });
}

export function simulateStride(processes: Process[], quantum: number): SimulationResult {
  const BIG_NUMBER = 10000;
  const procs = cloneProcesses(processes).map((p) => ({ ...p, tickets: p.tickets && p.tickets > 0 ? p.tickets : 10 }));
  const pass = new Map<number, number>(procs.map((p) => [p.id, 0]));
  return simulateQuantum(procs, quantum, {
    ready: (ps, t) => readySet(ps, t),
    select: (ready) => {
      const sorted = [...ready].sort((a, b) => pass.get(a.id)! - pass.get(b.id)! || a.id - b.id);
      const chosen = sorted[0];
      const candidates = candidatesFrom(ready, (p) => pass.get(p.id)!, (p, k) => `pass ${k.toFixed(0)} (lower runs first)`);
      const reason = `P${chosen.id} has the lowest pass value (${pass.get(chosen.id)!.toFixed(0)}). Each dispatch adds 10000/tickets to a process's pass, so shares stay proportional — but unlike a lottery the choice is fully deterministic.`;
      return { chosen, candidates, reason };
    },
    runFor: (chosen) => Math.min(quantum, chosen.remainingBurst),
    afterSlice: (chosen, served) => {
      pass.set(chosen.id, pass.get(chosen.id)! + (BIG_NUMBER / (chosen.tickets || 10)) * served);
    },
  });
}

export function simulateGuaranteed(processes: Process[], quantum: number): SimulationResult {
  const procs = cloneProcesses(processes);
  const serviceReceived = new Map<number, number>(procs.map((p) => [p.id, 0]));
  return simulateQuantum(procs, quantum, {
    ready: (ps, t) => readySet(ps, t),
    select: (ready, t) => {
      const N = ready.length;
      const ratio = (p: Process) => {
        const owed = (t - p.arrival) / N;
        return owed === 0 ? 0 : serviceReceived.get(p.id)! / owed;
      };
      const sorted = [...ready].sort((a, b) => ratio(a) - ratio(b) || a.id - b.id);
      const chosen = sorted[0];
      const candidates = candidatesFrom(ready, ratio, (p, k) =>
        k === 0 ? 'has received its full share' : `received ${(k * 100).toFixed(0)}% of its guaranteed share`
      );
      const reason = `P${chosen.id} has received the smallest fraction of its guaranteed share. With ${N} ready processes each is promised roughly 1/${N} of the CPU, and the most under-served process runs next.`;
      return { chosen, candidates, reason };
    },
    runFor: (chosen) => Math.min(quantum, chosen.remainingBurst),
    afterSlice: (chosen, served) => {
      serviceReceived.set(chosen.id, serviceReceived.get(chosen.id)! + served);
    },
  });
}

export function simulateFairShare(processes: Process[], quantum: number): SimulationResult {
  const procs = cloneProcesses(processes);
  const serviceReceived = new Map<number, number>(procs.map((p) => [p.id, 0]));
  return simulateQuantum(procs, quantum, {
    ready: (ps, t) => readySet(ps, t),
    select: (ready, t) => {
      const groups = Array.from(new Set(ready.map((p) => p.priority)));
      const G = groups.length;
      const ratio = (p: Process) => {
        const size = ready.filter((q) => q.priority === p.priority).length;
        const owed = (t - p.arrival) / G / size;
        return owed === 0 ? 0 : serviceReceived.get(p.id)! / owed;
      };
      const sorted = [...ready].sort((a, b) => ratio(a) - ratio(b) || a.id - b.id);
      const chosen = sorted[0];
      const candidates = candidatesFrom(ready, ratio, (p, k) =>
        k === 0
          ? `group ${p.priority}: has received its full share`
          : `group ${p.priority}: received ${(k * 100).toFixed(0)}% of its share`
      );
      const reason = `P${chosen.id} belongs to the group that has received the smallest share of CPU so far. With ${G} active group${G === 1 ? '' : 's'}, the CPU is divided between groups first and only then between members.`;
      return { chosen, candidates, reason };
    },
    runFor: (chosen) => Math.min(quantum, chosen.remainingBurst),
    afterSlice: (chosen, served) => {
      serviceReceived.set(chosen.id, serviceReceived.get(chosen.id)! + served);
    },
  });
}

/* ------------------------------------------------------------------ */
/* Entry point                                                         */
/* ------------------------------------------------------------------ */

export function runSimulation(algorithm: Algorithm | string, processes: Process[], quantum: number): SimulationResult {
  // Every runner below assumes at least one process; the UI already guards for
  // this, but the comparison view drives every algorithm, so fail safe here.
  if (!processes || processes.length === 0) {
    return { timeline: [], processes: [], steps: [] };
  }

  switch (algorithm) {
    case 'fcfs':
      return simulateFCFS(processes);
    case 'sjf':
      return simulateSJF(processes);
    case 'srtf':
      return simulateSRTF(processes);
    case 'priority_np':
      return simulatePriorityNP(processes);
    case 'priority_p':
      return simulatePriorityP(processes);
    case 'rr':
      return simulateRR(processes, quantum);
    case 'hrrn':
      return simulateHRRN(processes);
    case 'mlq':
      return simulateMLQ(processes, quantum);
    case 'mlfq':
      return simulateMLFQ(processes, quantum);
    case 'lottery':
      return simulateLottery(processes, quantum);
    case 'stride':
      return simulateStride(processes, quantum);
    case 'guaranteed':
      return simulateGuaranteed(processes, quantum);
    case 'fairshare':
      return simulateFairShare(processes, quantum);
    case 'edf':
      return simulateEDF(processes);
    case 'rms':
      return simulateRMS(processes);
    default:
      return simulateFCFS(processes);
  }
}

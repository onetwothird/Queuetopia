import { Process, SimulationResult, TimelineEvent, Algorithm } from './types';

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

export function simulateFCFS(processes: Process[]): SimulationResult {
  const procs = cloneProcesses(processes);
  let currentTime = 0;
  const timeline: TimelineEvent[] = [];

  procs.forEach((process) => {
    if (currentTime < process.arrival) currentTime = process.arrival;
    if (process.startTime === -1) {
      process.startTime = currentTime;
      process.response = currentTime - process.arrival;
    }

    timeline.push({ process: process.id, start: currentTime, end: currentTime + process.burst });

    process.remainingBurst = 0;
    process.completion = currentTime + process.burst;
    process.turnaround = process.completion - process.arrival;
    process.waiting = process.turnaround - process.burst;
    currentTime = process.completion;
  });

  return { timeline: mergeTimeline(timeline), processes: byIdAsc(procs) };
}

function simulateNonPreemptive(
  processes: Process[],
  selector: (ready: Process[], currentTime: number) => Process
): SimulationResult {
  const procs = cloneProcesses(processes);
  const finished = new Set<number>();
  let currentTime = Math.min(...procs.map((p) => p.arrival));
  const timeline: TimelineEvent[] = [];

  while (finished.size < procs.length) {
    const ready = procs.filter((p) => !finished.has(p.id) && p.arrival <= currentTime);

    if (ready.length === 0) {
      const nextArrival = Math.min(...procs.filter((p) => !finished.has(p.id)).map((p) => p.arrival));
      timeline.push({ process: 'idle', start: currentTime, end: nextArrival });
      currentTime = nextArrival;
      continue;
    }

    const chosen = selector(ready, currentTime);
    chosen.startTime = currentTime;
    chosen.response = currentTime - chosen.arrival;
    timeline.push({ process: chosen.id, start: currentTime, end: currentTime + chosen.burst });

    currentTime += chosen.burst;
    chosen.remainingBurst = 0;
    chosen.completion = currentTime;
    chosen.turnaround = chosen.completion - chosen.arrival;
    chosen.waiting = chosen.turnaround - chosen.burst;
    finished.add(chosen.id);
  }

  return { timeline: mergeTimeline(timeline), processes: byIdAsc(procs) };
}

export function simulateSJF(processes: Process[]): SimulationResult {
  return simulateNonPreemptive(processes, (ready) =>
    [...ready].sort((a, b) => a.burst - b.burst || a.arrival - b.arrival || a.id - b.id)[0]
  );
}

export function simulatePriorityNP(processes: Process[]): SimulationResult {
  return simulateNonPreemptive(processes, (ready) =>
    [...ready].sort((a, b) => a.priority - b.priority || a.arrival - b.arrival || a.id - b.id)[0]
  );
}

export function simulateHRRN(processes: Process[]): SimulationResult {
  return simulateNonPreemptive(processes, (ready, currentTime) =>
    [...ready].sort((a, b) => {
      const ratioA = (currentTime - a.arrival + a.burst) / a.burst;
      const ratioB = (currentTime - b.arrival + b.burst) / b.burst;
      return ratioB - ratioA || a.id - b.id;
    })[0]
  );
}

function simulatePreemptive(
  processes: Process[],
  comparator: (a: Process, b: Process) => number
): SimulationResult {
  const procs = cloneProcesses(processes);
  const n = procs.length;
  let completed = 0;
  let currentTime = Math.min(...procs.map((p) => p.arrival));
  const timeline: TimelineEvent[] = [];

  while (completed < n) {
    const ready = procs.filter((p) => p.arrival <= currentTime && p.remainingBurst > 0);

    if (ready.length === 0) {
      const nextArrival = Math.min(...procs.filter((p) => p.remainingBurst > 0).map((p) => p.arrival));
      timeline.push({ process: 'idle', start: currentTime, end: nextArrival });
      currentTime = nextArrival;
      continue;
    }

    ready.sort(comparator);
    const running = ready[0];

    if (running.startTime === -1) {
      running.startTime = currentTime;
      running.response = currentTime - running.arrival;
    }

    const start = currentTime;
    currentTime += 1;
    running.remainingBurst -= 1;
    timeline.push({ process: running.id, start, end: currentTime });

    if (running.remainingBurst === 0) {
      finalizeIfDone(running, currentTime);
      completed++;
    }
  }

  return { timeline: mergeTimeline(timeline), processes: byIdAsc(procs) };
}

export function simulateSRTF(processes: Process[]): SimulationResult {
  return simulatePreemptive(processes, (a, b) => a.remainingBurst - b.remainingBurst || a.id - b.id);
}

export function simulatePriorityP(processes: Process[]): SimulationResult {
  return simulatePreemptive(processes, (a, b) => a.priority - b.priority || a.id - b.id);
}

export function simulateEDF(processes: Process[]): SimulationResult {
  return simulatePreemptive(
    processes,
    (a, b) => (a.deadline ?? Infinity) - (b.deadline ?? Infinity) || a.id - b.id
  );
}

export function simulateRMS(processes: Process[]): SimulationResult {
  return simulatePreemptive(processes, (a, b) => (a.period ?? Infinity) - (b.period ?? Infinity) || a.id - b.id);
}

export function simulateRR(processes: Process[], quantum: number): SimulationResult {
  const procs = cloneProcesses(processes);
  const n = procs.length;
  const timeline: TimelineEvent[] = [];
  const queue: Process[] = [];
  let i = 0;
  let completed = 0;

  let currentTime = procs[0].arrival;
  while (i < n && procs[i].arrival <= currentTime) queue.push(procs[i++]);

  while (completed < n) {
    if (queue.length === 0) {
      const nextArrival = procs[i].arrival;
      timeline.push({ process: 'idle', start: currentTime, end: nextArrival });
      currentTime = nextArrival;
      while (i < n && procs[i].arrival <= currentTime) queue.push(procs[i++]);
      continue;
    }

    const running = queue.shift()!;
    if (running.startTime === -1) {
      running.startTime = currentTime;
      running.response = currentTime - running.arrival;
    }

    const runFor = Math.min(quantum, running.remainingBurst);
    const start = currentTime;
    currentTime += runFor;
    running.remainingBurst -= runFor;

    while (i < n && procs[i].arrival <= currentTime) queue.push(procs[i++]);
    timeline.push({ process: running.id, start, end: currentTime });

    if (running.remainingBurst > 0) {
      queue.push(running);
    } else {
      finalizeIfDone(running, currentTime);
      completed++;
    }
  }

  return { timeline: mergeTimeline(timeline), processes: byIdAsc(procs) };
}

export function simulateMLQ(processes: Process[], quantum: number): SimulationResult {
  const procs = cloneProcesses(processes);
  const n = procs.length;
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
      currentTime = nextArrival;
      admit(currentTime);
      continue;
    }

    if (q1.length > 0) {
      const running = q1.shift()!;
      if (running.startTime === -1) {
        running.startTime = currentTime;
        running.response = currentTime - running.arrival;
      }
      const runFor = Math.min(quantum, running.remainingBurst);
      const start = currentTime;
      currentTime += runFor;
      running.remainingBurst -= runFor;
      admit(currentTime);
      timeline.push({ process: running.id, start, end: currentTime });

      if (running.remainingBurst > 0) q1.push(running);
      else {
        finalizeIfDone(running, currentTime);
        completed++;
      }
    } else {
      const running = q2[0];
      if (running.startTime === -1) {
        running.startTime = currentTime;
        running.response = currentTime - running.arrival;
      }
      const start = currentTime;
      currentTime += 1;
      running.remainingBurst -= 1;
      admit(currentTime);
      timeline.push({ process: running.id, start, end: currentTime });

      if (running.remainingBurst === 0) {
        q2.shift();
        finalizeIfDone(running, currentTime);
        completed++;
      }
    }
  }

  return { timeline: mergeTimeline(timeline), processes: byIdAsc(procs) };
}

export function simulateMLFQ(processes: Process[], baseQuantum: number): SimulationResult {
  const procs = cloneProcesses(processes);
  const n = procs.length;
  const quantums = [baseQuantum, baseQuantum * 2]; 
  const queues: Process[][] = [[], [], []];
  const arrived = new Set<number>();
  const usedInQuantum = new Map<number, number>();

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
      currentTime = nextArrival;
      admit(currentTime);
      continue;
    }

    const running = queues[levelIdx][0];
    if (running.startTime === -1) {
      running.startTime = currentTime;
      running.response = currentTime - running.arrival;
    }

    const start = currentTime;
    currentTime += 1;
    running.remainingBurst -= 1;
    usedInQuantum.set(running.id, (usedInQuantum.get(running.id) || 0) + 1);
    admit(currentTime);
    timeline.push({ process: running.id, start, end: currentTime });

    if (running.remainingBurst === 0) {
      queues[levelIdx].shift();
      finalizeIfDone(running, currentTime);
      completed++;
      continue;
    }

    const quantumForLevel = quantums[levelIdx];
    if (quantumForLevel !== undefined && (usedInQuantum.get(running.id) || 0) >= quantumForLevel) {
      queues[levelIdx].shift();
      usedInQuantum.set(running.id, 0);
      const nextLevel = Math.min(levelIdx + 1, queues.length - 1);
      queues[nextLevel].push(running);
    }
  }

  return { timeline: mergeTimeline(timeline), processes: byIdAsc(procs) };
}

export function simulateLottery(processes: Process[], quantum: number): SimulationResult {
  const procs = cloneProcesses(processes).map((p) => ({ ...p, tickets: p.tickets && p.tickets > 0 ? p.tickets : 10 }));
  const n = procs.length;
  let currentTime = Math.min(...procs.map((p) => p.arrival));
  const timeline: TimelineEvent[] = [];
  let completed = 0;

  let seed = 42;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  while (completed < n) {
    const ready = procs.filter((p) => p.arrival <= currentTime && p.remainingBurst > 0);
    if (ready.length === 0) {
      const nextArrival = Math.min(...procs.filter((p) => p.remainingBurst > 0).map((p) => p.arrival));
      timeline.push({ process: 'idle', start: currentTime, end: nextArrival });
      currentTime = nextArrival;
      continue;
    }

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

    if (chosen.startTime === -1) {
      chosen.startTime = currentTime;
      chosen.response = currentTime - chosen.arrival;
    }
    const runFor = Math.min(quantum, chosen.remainingBurst);
    const start = currentTime;
    currentTime += runFor;
    chosen.remainingBurst -= runFor;
    timeline.push({ process: chosen.id, start, end: currentTime });

    if (chosen.remainingBurst === 0) {
      finalizeIfDone(chosen, currentTime);
      completed++;
    }
  }

  return { timeline: mergeTimeline(timeline), processes: byIdAsc(procs) };
}

export function simulateStride(processes: Process[], quantum: number): SimulationResult {
  const BIG_NUMBER = 10000;
  const procs = cloneProcesses(processes).map((p) => ({ ...p, tickets: p.tickets && p.tickets > 0 ? p.tickets : 10 }));
  const n = procs.length;
  const pass = new Map<number, number>(procs.map((p) => [p.id, 0]));
  let currentTime = Math.min(...procs.map((p) => p.arrival));
  const timeline: TimelineEvent[] = [];
  let completed = 0;

  while (completed < n) {
    const ready = procs.filter((p) => p.arrival <= currentTime && p.remainingBurst > 0);
    if (ready.length === 0) {
      const nextArrival = Math.min(...procs.filter((p) => p.remainingBurst > 0).map((p) => p.arrival));
      timeline.push({ process: 'idle', start: currentTime, end: nextArrival });
      currentTime = nextArrival;
      continue;
    }

    ready.sort((a, b) => pass.get(a.id)! - pass.get(b.id)! || a.id - b.id);
    const chosen = ready[0];

    if (chosen.startTime === -1) {
      chosen.startTime = currentTime;
      chosen.response = currentTime - chosen.arrival;
    }
    const runFor = Math.min(quantum, chosen.remainingBurst);
    const start = currentTime;
    currentTime += runFor;
    chosen.remainingBurst -= runFor;
    pass.set(chosen.id, pass.get(chosen.id)! + BIG_NUMBER / (chosen.tickets || 10));
    timeline.push({ process: chosen.id, start, end: currentTime });

    if (chosen.remainingBurst === 0) {
      finalizeIfDone(chosen, currentTime);
      completed++;
    }
  }

  return { timeline: mergeTimeline(timeline), processes: byIdAsc(procs) };
}

export function simulateGuaranteed(processes: Process[], quantum: number): SimulationResult {
  const procs = cloneProcesses(processes);
  const n = procs.length;
  const serviceReceived = new Map<number, number>(procs.map((p) => [p.id, 0]));
  let currentTime = Math.min(...procs.map((p) => p.arrival));
  const timeline: TimelineEvent[] = [];
  let completed = 0;

  while (completed < n) {
    const ready = procs.filter((p) => p.arrival <= currentTime && p.remainingBurst > 0);
    if (ready.length === 0) {
      const nextArrival = Math.min(...procs.filter((p) => p.remainingBurst > 0).map((p) => p.arrival));
      timeline.push({ process: 'idle', start: currentTime, end: nextArrival });
      currentTime = nextArrival;
      continue;
    }

    const N = ready.length;
    ready.sort((a, b) => {
      const owedA = (currentTime - a.arrival) / N;
      const owedB = (currentTime - b.arrival) / N;
      const ratioA = owedA === 0 ? 0 : serviceReceived.get(a.id)! / owedA;
      const ratioB = owedB === 0 ? 0 : serviceReceived.get(b.id)! / owedB;
      return ratioA - ratioB || a.id - b.id;
    });
    const chosen = ready[0];

    if (chosen.startTime === -1) {
      chosen.startTime = currentTime;
      chosen.response = currentTime - chosen.arrival;
    }
    const runFor = Math.min(quantum, chosen.remainingBurst);
    const start = currentTime;
    currentTime += runFor;
    chosen.remainingBurst -= runFor;
    serviceReceived.set(chosen.id, serviceReceived.get(chosen.id)! + runFor);
    timeline.push({ process: chosen.id, start, end: currentTime });

    if (chosen.remainingBurst === 0) {
      finalizeIfDone(chosen, currentTime);
      completed++;
    }
  }

  return { timeline: mergeTimeline(timeline), processes: byIdAsc(procs) };
}

export function simulateFairShare(processes: Process[], quantum: number): SimulationResult {
  const procs = cloneProcesses(processes);
  const n = procs.length;
  const serviceReceived = new Map<number, number>(procs.map((p) => [p.id, 0]));
  let currentTime = Math.min(...procs.map((p) => p.arrival));
  const timeline: TimelineEvent[] = [];
  let completed = 0;

  while (completed < n) {
    const ready = procs.filter((p) => p.arrival <= currentTime && p.remainingBurst > 0);
    if (ready.length === 0) {
      const nextArrival = Math.min(...procs.filter((p) => p.remainingBurst > 0).map((p) => p.arrival));
      timeline.push({ process: 'idle', start: currentTime, end: nextArrival });
      currentTime = nextArrival;
      continue;
    }

    const groups = Array.from(new Set(ready.map((p) => p.priority)));
    const G = groups.length;
    ready.sort((a, b) => {
      const sizeA = ready.filter((p) => p.priority === a.priority).length;
      const sizeB = ready.filter((p) => p.priority === b.priority).length;
      const owedA = (currentTime - a.arrival) / G / sizeA;
      const owedB = (currentTime - b.arrival) / G / sizeB;
      const ratioA = owedA === 0 ? 0 : serviceReceived.get(a.id)! / owedA;
      const ratioB = owedB === 0 ? 0 : serviceReceived.get(b.id)! / owedB;
      return ratioA - ratioB || a.id - b.id;
    });
    const chosen = ready[0];

    if (chosen.startTime === -1) {
      chosen.startTime = currentTime;
      chosen.response = currentTime - chosen.arrival;
    }
    const runFor = Math.min(quantum, chosen.remainingBurst);
    const start = currentTime;
    currentTime += runFor;
    chosen.remainingBurst -= runFor;
    serviceReceived.set(chosen.id, serviceReceived.get(chosen.id)! + runFor);
    timeline.push({ process: chosen.id, start, end: currentTime });

    if (chosen.remainingBurst === 0) {
      finalizeIfDone(chosen, currentTime);
      completed++;
    }
  }

  return { timeline: mergeTimeline(timeline), processes: byIdAsc(procs) };
}

export function runSimulation(algorithm: Algorithm | string, processes: Process[], quantum: number): SimulationResult {
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
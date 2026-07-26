export interface Process {
  id: number;
  arrival: number;
  burst: number;
  priority: number;      // also doubles as "Group ID" for Fair Share Scheduling
  queueLevel: number;    // used by MLQ: 1 = high-priority RR queue, 2 = low-priority FCFS queue
  remainingBurst: number;
  completion: number;
  turnaround: number;
  waiting: number;
  response: number;
  startTime: number;
  tickets?: number;      // Lottery / Stride Scheduling
  deadline?: number;     // Earliest Deadline First
  period?: number;       // Rate Monotonic Scheduling
}

export interface TimelineEvent {
  process: number | 'idle';
  start: number;
  end: number;
  remainingBefore?: number;
  remainingAfter?: number;
}

export interface SimulationResult {
  timeline: TimelineEvent[];
  processes: Process[];
}

export type Algorithm =
  | 'fcfs'
  | 'sjf'
  | 'srtf'
  | 'priority_np'
  | 'priority_p'
  | 'rr'
  | 'hrrn'
  | 'mlq'
  | 'mlfq'
  | 'lottery'
  | 'stride'
  | 'guaranteed'
  | 'fairshare'
  | 'edf'
  | 'rms';
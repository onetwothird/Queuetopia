export interface Process {
  id: number;
  arrival: number;
  burst: number;
  priority: number;     
  queueLevel: number;   
  remainingBurst: number;
  completion: number;
  turnaround: number;
  waiting: number;
  response: number;
  startTime: number;
  tickets?: number;     
  deadline?: number;    
  period?: number;       
}

export interface TimelineEvent {
  process: number | 'idle';
  start: number;
  end: number;
  remainingBefore?: number;
  remainingAfter?: number;
}

/**
 * A single scheduling decision, recorded by the engine at the moment the CPU
 * is dispatched. The engine — not the UI — is the source of truth for these,
 * so the step-by-step walkthrough can never drift from the timeline.
 */
export interface ScheduleStep {
  index: number;              // 0-based position in the walkthrough
  time: number;               // clock time the decision was made at
  duration: number;           // how long the dispatch actually ran
  running: number | 'idle';   // who held the CPU for [time, time + duration)
  endTime: number;            // time + duration
  chosen: number | 'idle';    // process selected by the scheduling rule
  readyQueue: number[];       // ready set at decision time, in queue order
  arrived: number[];          // every process that had arrived by `time`
  candidates: StepCandidate[]; // ready processes with the key that ranked them
  arrivals: number[];         // processes arriving exactly at `time`
  reason: string;             // why the rule picked `chosen`
  preempted: number | null;   // process displaced by this dispatch, if any
  sliceEnd: 'completed' | 'quantum' | 'awaiting-arrival';
}

export interface StepCandidate {
  id: number;
  /** The numeric quantity the rule ranked on (burst, priority, pass, ...). */
  key: number;
  /** Human-readable form of `key`, e.g. "burst 3ms". */
  detail: string;
}

export interface SimulationResult {
  timeline: TimelineEvent[];
  processes: Process[];
  /** Ordered decision trace backing the step-by-step walkthrough. */
  steps: ScheduleStep[];
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
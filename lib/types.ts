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
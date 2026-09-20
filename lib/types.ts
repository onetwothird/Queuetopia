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
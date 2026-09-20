// Presentation-level metadata for every scheduling algorithm.
// The simulation logic itself lives in lib/algorithms.ts — this file only
// describes each algorithm so the landing explorer, the simulator profile
// panel, and the resources comparison table all stay in sync.

export type AlgorithmKind = 'Non-Preemptive' | 'Preemptive' | 'Quantum';
export type AlgorithmFamily = 'classic' | 'quantum' | 'proportional' | 'realtime';

export interface AlgorithmMeta {
  key: string;
  short: string;      // abbreviated name, e.g. "FCFS"
  name: string;       // full name, e.g. "First Come First Served"
  kind: AlgorithmKind;
  family: AlgorithmFamily;
  structure: string;  // governing data structure / mechanism
  blurb: string;      // one-sentence summary
  quantum: boolean;   // driven by the user-supplied time quantum
}

export const ALGORITHM_META: AlgorithmMeta[] = [
  {
    key: 'fcfs',
    short: 'FCFS',
    name: 'First Come First Served',
    kind: 'Non-Preemptive',
    family: 'classic',
    structure: 'FIFO ready queue',
    blurb: 'Hands the CPU to the earliest arrival and keeps it there until the burst completes.',
    quantum: false,
  },
  {
    key: 'sjf',
    short: 'SJF',
    name: 'Shortest Job First',
    kind: 'Non-Preemptive',
    family: 'classic',
    structure: 'Burst-ordered selection',
    blurb: 'Runs the shortest ready job next — provably optimal for average waiting time.',
    quantum: false,
  },
  {
    key: 'srtf',
    short: 'SRTF',
    name: 'Shortest Remaining Time First',
    kind: 'Preemptive',
    family: 'classic',
    structure: 'Remaining-burst comparator',
    blurb: 'The preemptive twin of SJF — preempts whenever a shorter remaining burst arrives.',
    quantum: false,
  },
  {
    key: 'priority_np',
    short: 'PR-NP',
    name: 'Priority (Non-Preemptive)',
    kind: 'Non-Preemptive',
    family: 'classic',
    structure: 'Priority-ordered selection',
    blurb: 'Runs the highest-priority ready process to completion; lower numbers win.',
    quantum: false,
  },
  {
    key: 'priority_p',
    short: 'PR-P',
    name: 'Priority (Preemptive)',
    kind: 'Preemptive',
    family: 'classic',
    structure: 'Priority comparator',
    blurb: 'Yields the CPU immediately when a higher-priority process arrives.',
    quantum: false,
  },
  {
    key: 'hrrn',
    short: 'HRRN',
    name: 'Highest Response Ratio Next',
    kind: 'Non-Preemptive',
    family: 'classic',
    structure: 'Response-ratio() selection',
    blurb: 'Balances SJF efficiency with FCFS fairness via a climbing response ratio.',
    quantum: false,
  },
  {
    key: 'rr',
    short: 'RR',
    name: 'Round Robin',
    kind: 'Quantum',
    family: 'quantum',
    structure: 'Circular ready queue',
    blurb: 'Gives every process one time quantum in rotation; preempted jobs return to the tail.',
    quantum: true,
  },
  {
    key: 'mlq',
    short: 'MLQ',
    name: 'Multilevel Queue',
    kind: 'Quantum',
    family: 'quantum',
    structure: 'Tiered queues (RR + FCFS)',
    blurb: 'Partitions processes into fixed priority bands, each with its own discipline.',
    quantum: true,
  },
  {
    key: 'mlfq',
    short: 'MLFQ',
    name: 'Multilevel Feedback Queue',
    kind: 'Quantum',
    family: 'quantum',
    structure: 'Tiered queues with demotion',
    blurb: 'Moves processes between bands based on observed CPU behavior — adaptive and fair.',
    quantum: true,
  },
  {
    key: 'lottery',
    short: 'LOT',
    name: 'Lottery Scheduling',
    kind: 'Quantum',
    family: 'proportional',
    structure: 'Ticket pool + seeded PRNG',
    blurb: 'Allocates CPU by drawing winning tickets; shares are honored on average.',
    quantum: true,
  },
  {
    key: 'stride',
    short: 'STR',
    name: 'Stride Scheduling',
    kind: 'Quantum',
    family: 'proportional',
    structure: 'Pass / stride accounting',
    blurb: 'Deterministic proportional share — the lowest pass value always runs next.',
    quantum: true,
  },
  {
    key: 'guaranteed',
    short: 'GUA',
    name: 'Guaranteed Scheduling',
    kind: 'Quantum',
    family: 'proportional',
    structure: 'Service-ratio accounting',
    blurb: 'Promises each of n processes ~1/n of the CPU; the most under-served runs next.',
    quantum: true,
  },
  {
    key: 'fairshare',
    short: 'FSH',
    name: 'Fair Share Scheduling',
    kind: 'Quantum',
    family: 'proportional',
    structure: 'Per-group share accounting',
    blurb: 'Divides CPU among groups first, then among members — no group can starve the rest.',
    quantum: true,
  },
  {
    key: 'edf',
    short: 'EDF',
    name: 'Earliest Deadline First',
    kind: 'Preemptive',
    family: 'realtime',
    structure: 'Deadline comparator',
    blurb: 'Always runs the process whose absolute deadline is closest — optimal on a single core.',
    quantum: false,
  },
  {
    key: 'rms',
    short: 'RMS',
    name: 'Rate Monotonic Scheduling',
    kind: 'Preemptive',
    family: 'realtime',
    structure: 'Fixed period priorities',
    blurb: 'Static rate-based priorities for periodic tasks; schedulability is provable up front.',
    quantum: false,
  },
];

export const ALGORITHM_BY_KEY: Record<string, AlgorithmMeta> = Object.fromEntries(
  ALGORITHM_META.map((a) => [a.key, a])
);

export interface AlgorithmFamilyMeta {
  id: AlgorithmFamily;
  index: string;
  label: string;
  blurb: string;
}

export const ALGORITHM_FAMILIES: AlgorithmFamilyMeta[] = [
  {
    id: 'classic',
    index: '03.1',
    label: 'Classic Disciplines',
    blurb: 'FCFS, SJF, SRTF, HRRN and the priority variants — the textbook foundation of CPU scheduling.',
  },
  {
    id: 'quantum',
    index: '03.2',
    label: 'Time-Slicing & Multilevel',
    blurb: 'Round Robin and its queue-based descendants, where a fixed time quantum bounds each dispatch.',
  },
  {
    id: 'proportional',
    index: '03.3',
    label: 'Proportional Share',
    blurb: 'Lottery, Stride, Guaranteed and Fair Share — entitlements instead of strict priority.',
  },
  {
    id: 'realtime',
    index: '03.4',
    label: 'Real-Time Scheduling',
    blurb: 'EDF and RMS — predictability and deadline guarantees on a single core.',
  },
];
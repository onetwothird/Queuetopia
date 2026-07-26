import { ChevronDown } from 'lucide-react';

interface Props {
  algorithm: string;
  setAlgorithm: (alg: string) => void;
  timeQuantum: number;
  setTimeQuantum: (tq: number) => void;
}

// Algorithms whose scheduling decision is made every fixed time slice / quantum
const QUANTUM_ALGORITHMS = ['rr', 'mlq', 'mlfq', 'lottery', 'stride', 'guaranteed', 'fairshare'];

const ALGORITHM_OPTIONS = [
  { value: 'fcfs', label: 'First Come First Served (FCFS)' },
  { value: 'sjf', label: 'Shortest Job First (SJF)' },
  { value: 'srtf', label: 'Shortest Remaining Time First (SRTF)' },
  { value: 'priority_np', label: 'Priority Scheduling (Non-Preemptive)' },
  { value: 'priority_p', label: 'Priority Scheduling (Preemptive)' },
  { value: 'rr', label: 'Round Robin (RR)' },
  { value: 'hrrn', label: 'Highest Response Ratio Next (HRRN)' },
  { value: 'mlq', label: 'Multilevel Queue (MLQ)' },
  { value: 'mlfq', label: 'Multilevel Feedback Queue (MLFQ)' },
  { value: 'lottery', label: 'Lottery Scheduling' },
  { value: 'stride', label: 'Stride Scheduling' },
  { value: 'guaranteed', label: 'Guaranteed Scheduling' },
  { value: 'fairshare', label: 'Fair Share Scheduling' },
  { value: 'edf', label: 'Earliest Deadline First (EDF)' },
  { value: 'rms', label: 'Rate Monotonic Scheduling (RMS)' },
];

export default function AlgorithmSelect({ algorithm, setAlgorithm, timeQuantum, setTimeQuantum }: Props) {
  const showQuantum = QUANTUM_ALGORITHMS.includes(algorithm);

  return (
    <div className="bg-transparent p-6 border border-white/10">
      <h2 className="text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-6">01. Parameters</h2>
      <div className="space-y-6">
        <div>
          <label className="block text-[10px] font-medium text-white/50 uppercase tracking-widest mb-2">Algorithm</label>
          <div className="relative">
            <select
              className="w-full bg-transparent border-b border-white/20 text-white text-sm py-2 pl-0 pr-6 focus:outline-none focus:border-white hover:border-white/50 transition-all appearance-none rounded-none cursor-pointer"
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
            >
              {ALGORITHM_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#050505]">
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          </div>
        </div>
        {showQuantum && (
          <div>
            <label className="block text-[10px] font-medium text-white/50 uppercase tracking-widest mb-2">Time Quantum</label>
            <input
              type="number" min="1"
              className="w-full bg-transparent border-b border-white/20 text-white text-xl font-light py-2 px-0 focus:outline-none focus:border-white transition-all rounded-none"
              value={timeQuantum}
              onChange={(e) => setTimeQuantum(Number(e.target.value))}
            />
          </div>
        )}
      </div>
    </div>
  );
}
interface Props {
  algorithm: string;
  setAlgorithm: (alg: string) => void;
  timeQuantum: number;
  setTimeQuantum: (tq: number) => void;
}

export default function AlgorithmSelect({ algorithm, setAlgorithm, timeQuantum, setTimeQuantum }: Props) {
  return (
    <div className="bg-transparent p-6 border border-white/10">
      <h2 className="text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-6">01. Parameters</h2>
      <div className="space-y-6">
        <div>
          <label className="block text-[10px] font-medium text-white/50 uppercase tracking-widest mb-2">Algorithm</label>
          <select 
            className="w-full bg-transparent border-b border-white/20 text-white text-sm py-2 px-0 focus:outline-none focus:border-white transition-all appearance-none rounded-none cursor-pointer"
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value)}
          >
            <option value="fcfs" className="bg-[#050505]">First Come First Served (FCFS)</option>
            <option value="sjf" className="bg-[#050505]">Shortest Job First (SJF)</option>
            <option value="srtf" className="bg-[#050505]">Shortest Remaining Time (SRTF)</option>
            <option value="rr" className="bg-[#050505]">Round Robin (RR)</option>
            <option value="priority_np" className="bg-[#050505]">Non-Preemptive Priority</option>
            <option value="priority_p" className="bg-[#050505]">Preemptive Priority</option>
          </select>
        </div>
        {algorithm === 'rr' && (
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
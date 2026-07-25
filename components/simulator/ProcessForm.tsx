import { useState } from 'react';
import { Process } from '@/lib/types';

interface Props {
  algorithm: string;
  onAddProcess: (process: Omit<Process, 'id' | 'completion' | 'turnaround' | 'waiting' | 'response' | 'startTime'>) => void;
  onClear: () => void;
}

export default function ProcessForm({ algorithm, onAddProcess, onClear }: Props) {
  const [arrival, setArrival] = useState(0);
  const [burst, setBurst] = useState(1);
  const [priority, setPriority] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddProcess({ arrival: Number(arrival), burst: Number(burst), priority: Number(priority), queueLevel: 1, remainingBurst: Number(burst) });
    setArrival(0); 
  };

  return (
    <div className="bg-transparent p-6 border border-white/10">
      <h2 className="text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-6">02. Inject Data</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <label className="block text-[10px] font-medium text-white/50 uppercase tracking-widest mb-2">Arrival Time</label>
            <input type="number" min="0" required value={arrival} onChange={(e) => setArrival(Number(e.target.value))} 
              className="w-full bg-transparent border-b border-white/20 text-white text-xl font-light py-2 px-0 focus:outline-none focus:border-white transition-all rounded-none" />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-white/50 uppercase tracking-widest mb-2">Burst Time</label>
            <input type="number" min="1" required value={burst} onChange={(e) => setBurst(Number(e.target.value))} 
              className="w-full bg-transparent border-b border-white/20 text-white text-xl font-light py-2 px-0 focus:outline-none focus:border-white transition-all rounded-none" />
          </div>
        </div>

        {algorithm.includes('priority') && (
          <div>
            <label className="block text-[10px] font-medium text-white/50 uppercase tracking-widest mb-2">Priority Level</label>
            <input type="number" min="1" required value={priority} onChange={(e) => setPriority(Number(e.target.value))} 
              className="w-full bg-transparent border-b border-white/20 text-white text-xl font-light py-2 px-0 focus:outline-none focus:border-white transition-all rounded-none" />
          </div>
        )}

        <div className="pt-4 flex gap-4">
          <button type="submit" className="flex-1 border border-white text-white text-[10px] font-bold uppercase tracking-[0.2em] py-4 hover:bg-white hover:text-black transition-colors">
            Add
          </button>
          <button type="button" onClick={onClear} className="px-6 border border-white/20 text-white/50 text-[10px] font-bold uppercase tracking-[0.2em] py-4 hover:border-white/50 hover:text-white transition-colors">
            Clear
          </button>
        </div>
      </form>
    </div>
  );
}
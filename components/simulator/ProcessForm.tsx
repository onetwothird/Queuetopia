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
  const [queueLevel, setQueueLevel] = useState(1);
  const [tickets, setTickets] = useState(10);
  const [deadline, setDeadline] = useState(10);
  const [period, setPeriod] = useState(10);

  const showPriority = algorithm === 'priority_np' || algorithm === 'priority_p';
  const showGroup = algorithm === 'fairshare';
  const showQueueLevel = algorithm === 'mlq';
  const showTickets = algorithm === 'lottery' || algorithm === 'stride';
  const showDeadline = algorithm === 'edf';
  const showPeriod = algorithm === 'rms';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddProcess({
      arrival: Number(arrival),
      burst: Number(burst),
      priority: Number(priority),
      queueLevel: Number(queueLevel),
      remainingBurst: Number(burst),
      ...(showTickets ? { tickets: Number(tickets) } : {}),
      ...(showDeadline ? { deadline: Number(deadline) } : {}),
      ...(showPeriod ? { period: Number(period) } : {}),
    });
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

        {showPriority && (
          <div>
            <label className="block text-[10px] font-medium text-white/50 uppercase tracking-widest mb-2">Priority Level</label>
            <input type="number" min="1" required value={priority} onChange={(e) => setPriority(Number(e.target.value))}
              className="w-full bg-transparent border-b border-white/20 text-white text-xl font-light py-2 px-0 focus:outline-none focus:border-white transition-all rounded-none" />
            <p className="text-[9px] text-white/30 mt-2 tracking-wide">Lower number = higher priority</p>
          </div>
        )}

        {showGroup && (
          <div>
            <label className="block text-[10px] font-medium text-white/50 uppercase tracking-widest mb-2">Group ID</label>
            <input type="number" min="1" required value={priority} onChange={(e) => setPriority(Number(e.target.value))}
              className="w-full bg-transparent border-b border-white/20 text-white text-xl font-light py-2 px-0 focus:outline-none focus:border-white transition-all rounded-none" />
            <p className="text-[9px] text-white/30 mt-2 tracking-wide">Processes sharing a Group ID split that group&apos;s CPU share</p>
          </div>
        )}

        {showQueueLevel && (
          <div>
            <label className="block text-[10px] font-medium text-white/50 uppercase tracking-widest mb-2">Queue</label>
            <select
              className="w-full bg-transparent border-b border-white/20 text-white text-sm py-2 px-0 focus:outline-none focus:border-white transition-all appearance-none rounded-none cursor-pointer"
              value={queueLevel}
              onChange={(e) => setQueueLevel(Number(e.target.value))}
            >
              <option value={1} className="bg-[#050505]">Queue 1 — Round Robin (higher priority)</option>
              <option value={2} className="bg-[#050505]">Queue 2 — FCFS (lower priority)</option>
            </select>
          </div>
        )}

        {showTickets && (
          <div>
            <label className="block text-[10px] font-medium text-white/50 uppercase tracking-widest mb-2">Tickets</label>
            <input type="number" min="1" required value={tickets} onChange={(e) => setTickets(Number(e.target.value))}
              className="w-full bg-transparent border-b border-white/20 text-white text-xl font-light py-2 px-0 focus:outline-none focus:border-white transition-all rounded-none" />
          </div>
        )}

        {showDeadline && (
          <div>
            <label className="block text-[10px] font-medium text-white/50 uppercase tracking-widest mb-2">Deadline (absolute time)</label>
            <input type="number" min="1" required value={deadline} onChange={(e) => setDeadline(Number(e.target.value))}
              className="w-full bg-transparent border-b border-white/20 text-white text-xl font-light py-2 px-0 focus:outline-none focus:border-white transition-all rounded-none" />
          </div>
        )}

        {showPeriod && (
          <div>
            <label className="block text-[10px] font-medium text-white/50 uppercase tracking-widest mb-2">Period</label>
            <input type="number" min="1" required value={period} onChange={(e) => setPeriod(Number(e.target.value))}
              className="w-full bg-transparent border-b border-white/20 text-white text-xl font-light py-2 px-0 focus:outline-none focus:border-white transition-all rounded-none" />
            <p className="text-[9px] text-white/30 mt-2 tracking-wide">Shorter period = higher fixed priority</p>
          </div>
        )}

        <div className="pt-4 flex gap-4">
          <button type="submit" className="flex-1 border border-white text-white text-[10px] font-bold uppercase tracking-[0.2em] py-4 hover:bg-white hover:text-black transition-colors cursor-pointer">
            Add
          </button>
          <button type="button" onClick={onClear} className="px-6 border border-white/20 text-white/50 text-[10px] font-bold uppercase tracking-[0.2em] py-4 hover:border-white/50 hover:text-white transition-colors cursor-pointer">
            Clear
          </button>
        </div>
      </form>
    </div>
  );
}
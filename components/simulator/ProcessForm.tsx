import { useState } from 'react';
import { Process } from '@/lib/types';

interface Props {
  algorithm: string;
  onAddProcess: (process: Omit<Process, 'id' | 'completion' | 'turnaround' | 'waiting' | 'response' | 'startTime'>) => void;
  onClear: () => void;
}

const INPUT_CLASS =
  'w-full bg-transparent border-b border-white/20 text-white text-xl font-light py-2 px-0 focus:outline-none focus:border-white transition-all rounded-none';

const LABEL_CLASS = 'block text-[10px] font-medium text-white/50 uppercase tracking-widest mb-2';
const HINT_CLASS = 'text-[9px] text-white/30 mt-2 tracking-wide';

// Numeric fields are kept as raw strings while you type, and only parsed on
// submit. Coercing every keystroke with Number(value) turns an emptied field
// into 0, so a lone "0" snaps straight back and can never be backspaced away.
function NumberField({
  label,
  value,
  onChange,
  min,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  min: number;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className={LABEL_CLASS}>{label}</label>
      <input
        type="number"
        min={min}
        step={1}
        required
        value={value}
        placeholder={placeholder ?? String(min)}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT_CLASS}
      />
      {hint && <p className={HINT_CLASS}>{hint}</p>}
    </div>
  );
}

// Parsed only at submit time so a blank or half-typed field can never become
// NaN, and so out-of-range values are floored instead of reaching the engine.
function toInt(raw: string, min: number): number {
  const n = Math.trunc(Number(raw));
  return Number.isFinite(n) && n >= min ? n : min;
}

export default function ProcessForm({ algorithm, onAddProcess, onClear }: Props) {
  const [arrival, setArrival] = useState('0');
  const [burst, setBurst] = useState('1');
  const [priority, setPriority] = useState('1');
  const [queueLevel, setQueueLevel] = useState('1');
  const [tickets, setTickets] = useState('10');
  const [deadline, setDeadline] = useState('10');
  const [period, setPeriod] = useState('10');

  const showPriority = algorithm === 'priority_np' || algorithm === 'priority_p';
  const showGroup = algorithm === 'fairshare';
  const showQueueLevel = algorithm === 'mlq';
  const showTickets = algorithm === 'lottery' || algorithm === 'stride';
  const showDeadline = algorithm === 'edf';
  const showPeriod = algorithm === 'rms';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const burstValue = toInt(burst, 1);
    onAddProcess({
      arrival: toInt(arrival, 0),
      burst: burstValue,
      priority: toInt(priority, 1),
      queueLevel: showQueueLevel ? toInt(queueLevel, 1) : 1,
      remainingBurst: burstValue,
      ...(showTickets ? { tickets: toInt(tickets, 1) } : {}),
      ...(showDeadline ? { deadline: toInt(deadline, 1) } : {}),
      ...(showPeriod ? { period: toInt(period, 1) } : {}),
    });
    setArrival('0');
  };

  return (
    <div className="bg-transparent p-6 border border-white/10">
      <h2 className="text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-6">02. Inject Data</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-8">
          <NumberField label="Arrival Time" value={arrival} onChange={setArrival} min={0} placeholder="0" />
          <NumberField label="Burst Time" value={burst} onChange={setBurst} min={1} placeholder="1" />
        </div>

        {showPriority && (
          <NumberField
            label="Priority Level"
            value={priority}
            onChange={setPriority}
            min={1}
            hint="Lower number = higher priority"
          />
        )}

        {showGroup && (
          <NumberField
            label="Group ID"
            value={priority}
            onChange={setPriority}
            min={1}
            hint="Processes sharing a Group ID split that group's CPU share"
          />
        )}

        {showQueueLevel && (
          <div>
            <label className={LABEL_CLASS}>Queue</label>
            <select
              value={queueLevel}
              onChange={(e) => setQueueLevel(e.target.value)}
              className="w-full bg-transparent border-b border-white/20 text-white text-sm py-2 px-0 focus:outline-none focus:border-white transition-all appearance-none rounded-none cursor-pointer"
            >
              <option value={1} className="bg-[#050505]">Queue 1 — Round Robin (higher priority)</option>
              <option value={2} className="bg-[#050505]">Queue 2 — FCFS (lower priority)</option>
            </select>
          </div>
        )}

        {showTickets && (
          <NumberField label="Tickets" value={tickets} onChange={setTickets} min={1} placeholder="10" />
        )}

        {showDeadline && (
          <NumberField label="Deadline (absolute time)" value={deadline} onChange={setDeadline} min={1} placeholder="10" />
        )}

        {showPeriod && (
          <NumberField
            label="Period"
            value={period}
            onChange={setPeriod}
            min={1}
            hint="Shorter period = higher fixed priority"
          />
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

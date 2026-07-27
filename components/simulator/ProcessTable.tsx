import type { ReactNode } from 'react';
import { Process } from '@/lib/types';
import { X } from 'lucide-react';

interface Props {
  processes: Process[];
  algorithm: string;
  onDelete: (id: number) => void;
  onSimulate: () => void;
}

interface Column {
  key: string;
  label: string;
  width: string;
  align?: 'right';
  render: (p: Process) => ReactNode;
}

export default function ProcessTable({ processes, algorithm, onDelete, onSimulate }: Props) {
  const showPriority = algorithm === 'priority_np' || algorithm === 'priority_p';
  const showGroup = algorithm === 'fairshare';
  const showQueueLevel = algorithm === 'mlq';
  const showTickets = algorithm === 'lottery' || algorithm === 'stride';
  const showDeadline = algorithm === 'edf';
  const showPeriod = algorithm === 'rms';

  // Single source of truth for header + rows, so widths and cell content
  // can never drift out of sync with each other.
  const columns: Column[] = [
    { key: 'id', label: 'ID', width: 'minmax(2.75rem,0.6fr)', render: (p) => <span className="text-white">P{p.id}</span> },
    { key: 'arrival', label: 'Arrival', width: 'minmax(4.5rem,1fr)', render: (p) => <span className="text-white/60">{p.arrival}ms</span> },
    { key: 'burst', label: 'Burst', width: 'minmax(4.5rem,1fr)', render: (p) => <span className="text-white/60">{p.burst}ms</span> },
    ...(showPriority ? [{ key: 'priority', label: 'Priority', width: 'minmax(5rem,1fr)', render: (p: Process) => <span className="text-white/60">{p.priority}</span> }] : []),
    ...(showGroup ? [{ key: 'group', label: 'Group', width: 'minmax(5rem,1fr)', render: (p: Process) => <span className="text-white/60">{p.priority}</span> }] : []),
    ...(showQueueLevel ? [{ key: 'queue', label: 'Queue', width: 'minmax(5rem,1fr)', render: (p: Process) => <span className="text-white/60">Q{p.queueLevel}</span> }] : []),
    ...(showTickets ? [{ key: 'tickets', label: 'Tickets', width: 'minmax(4.5rem,0.9fr)', render: (p: Process) => <span className="text-white/60">{p.tickets ?? 10}</span> }] : []),
    ...(showDeadline ? [{ key: 'deadline', label: 'Deadline', width: 'minmax(4.5rem,0.9fr)', render: (p: Process) => <span className="text-white/60">{p.deadline ?? '—'}</span> }] : []),
    ...(showPeriod ? [{ key: 'period', label: 'Period', width: 'minmax(4.5rem,0.9fr)', render: (p: Process) => <span className="text-white/60">{p.period ?? '—'}</span> }] : []),
    {
      key: 'action',
      label: 'Action',
      width: 'minmax(3.25rem,0.6fr)',
      align: 'right',
      render: (p) => (
        <button
          type="button"
          onClick={() => onDelete(p.id)}
          title="Remove process"
          aria-label={`Remove P${p.id}`}
          className="inline-flex items-center justify-center w-7 h-7 text-white/30 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  const gridTemplateColumns = columns.map((c) => c.width).join(' ');

  return (
    <div className="bg-transparent p-6 border border-white/10">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <h2 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">03. Active Queue</h2>
        <button
          type="button"
          onClick={onSimulate}
          disabled={processes.length === 0}
          className="group flex items-center justify-center gap-3 bg-white text-black text-[10px] font-bold uppercase tracking-[0.2em] px-8 py-3 hover:bg-white/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          Execute Simulation
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          >
            <line x1="5" y1="19" x2="19" y2="5"></line>
            <polyline points="9 5 19 5 19 15"></polyline>
          </svg>
        </button>
      </div>

      {processes.length === 0 ? (
        <div className="border border-white/10 py-24 flex flex-col items-center justify-center text-center">
          <p className="text-[10px] tracking-[0.2em] text-white/30 uppercase font-medium">Queue is completely empty.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div role="table" className="min-w-full">
            {/* Header row */}
            <div
              role="row"
              className="grid gap-x-4 sm:gap-x-6 border-b border-white/10 pb-4"
              style={{ gridTemplateColumns }}
            >
              {columns.map((col) => (
                <div
                  key={col.key}
                  role="columnheader"
                  className={`text-[10px] font-medium uppercase tracking-[0.2em] text-white/40 ${col.align === 'right' ? 'text-right' : ''}`}
                >
                  {col.label}
                </div>
              ))}
            </div>

            <div role="rowgroup" className="font-mono text-sm">
              {processes.map((p) => (
                <div
                  key={p.id}
                  role="row"
                  className="grid gap-x-4 sm:gap-x-6 items-center border-b border-white/5 py-4 hover:bg-white/5 transition-colors group"
                  style={{ gridTemplateColumns }}
                >
                  {columns.map((col) => (
                    <div key={col.key} role="cell" className={col.align === 'right' ? 'text-right' : ''}>
                      {col.render(p)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
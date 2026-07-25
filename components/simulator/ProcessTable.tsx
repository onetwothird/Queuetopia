import { Process } from '@/lib/types';

interface Props {
  processes: Process[];
  algorithm: string;
  onDelete: (id: number) => void;
  onSimulate: () => void;
}

export default function ProcessTable({ processes, algorithm, onDelete, onSimulate }: Props) {
  return (
    <div className="bg-transparent p-6 border border-white/10">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <h2 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">03. Active Queue</h2>
        <button 
          onClick={onSimulate} 
          disabled={processes.length === 0} 
          className="group flex items-center justify-center gap-3 bg-white text-black text-[10px] font-bold uppercase tracking-[0.2em] px-8 py-3 hover:bg-white/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
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
          <table className="w-full text-left border-collapse min-w-125">
            <thead>
              <tr className="border-b border-white/10">
                <th className="pb-4 text-[10px] font-medium uppercase tracking-[0.2em] text-white/40">ID</th>
                <th className="pb-4 text-[10px] font-medium uppercase tracking-[0.2em] text-white/40">Arrival</th>
                <th className="pb-4 text-[10px] font-medium uppercase tracking-[0.2em] text-white/40">Burst</th>
                {algorithm.includes('priority') && <th className="pb-4 text-[10px] font-medium uppercase tracking-[0.2em] text-white/40">Priority</th>}
                <th className="pb-4 text-[10px] font-medium uppercase tracking-[0.2em] text-white/40 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="font-mono text-sm">
              {processes.map((p) => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                  <td className="py-4 text-white">P{p.id}</td>
                  <td className="py-4 text-white/60">{p.arrival}ms</td>
                  <td className="py-4 text-white/60">{p.burst}ms</td>
                  {algorithm.includes('priority') && (
                    <td className="py-4 text-white/60">{p.priority}</td>
                  )}
                  <td className="py-4 text-right">
                    <button onClick={() => onDelete(p.id)} className="text-[10px] font-sans tracking-widest uppercase text-white/30 hover:text-white transition-colors">
                      Drop
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
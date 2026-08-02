import { SimulationResult, TimelineEvent } from '@/lib/types';

const PROCESS_COLORS = [
  'bg-white text-black',       
  'bg-[#3b82f6] text-white',  
  'bg-[#10b981] text-white',     
  'bg-[#f43f5e] text-white',    
  'bg-[#f59e0b] text-white',    
  'bg-[#8b5cf6] text-white',    
];

export default function GanttChart({ timeline, result }: { timeline: TimelineEvent[], result: SimulationResult }) {
  if (!timeline || timeline.length === 0) return null;
  const totalTime = timeline[timeline.length - 1].end;
  const timeSteps = Array.from(new Set(timeline.flatMap(t => [t.start, t.end]))).sort((a, b) => a - b);

  return (
    <div className="bg-transparent p-6 border border-white/10 space-y-12">

      <div>
        <h2 className="text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-8">04. Timeline</h2>

        <div className="flex w-full h-16 overflow-hidden border border-white/20 bg-[#0a0a0a]">
          {timeline.map((event, idx) => {
            const widthPercent = ((event.end - event.start) / totalTime) * 100;
            const isIdle = event.process === 'idle';
            const colorClass = isIdle ? 'bg-transparent text-white/30' : PROCESS_COLORS[(event.process as number) % PROCESS_COLORS.length];

            return (
              <div
                key={idx}
                className={`flex items-center justify-center border-r border-[#050505] last:border-0 min-w-8 ${colorClass}`}
                style={{ width: `${Math.max(widthPercent, 2)}%` }}
              >
                <span className="text-xs font-bold tracking-wider font-mono">
                  {isIdle ? 'IDLE' : `P${event.process}`}
                </span>
              </div>
            );
          })}
        </div>

        <div className="relative h-12">
          {timeSteps.map((time) => {
            const positionPercent = (time / totalTime) * 100;
            const isEdge = time === 0 || time === totalTime;
            return (
              <div
                key={`step-${time}`}
                className="absolute top-0 flex flex-col items-center"
                style={{ left: `${positionPercent}%`, transform: 'translateX(-50%)' }}
              >
                <div className={`w-px ${isEdge ? 'h-3 bg-white/40' : 'h-2 bg-white/25'}`} />
                <span className="text-xs font-mono text-white/60 mt-1 whitespace-nowrap">{time}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-white/10">
        {[
          { label: 'Avg Turnaround', value: `${(result.processes.reduce((acc, p) => acc + p.turnaround, 0) / result.processes.length).toFixed(2)}ms` },
          { label: 'Avg Waiting', value: `${(result.processes.reduce((acc, p) => acc + p.waiting, 0) / result.processes.length).toFixed(2)}ms` },
          { label: 'Total Duration', value: `${totalTime}ms` },
          { label: 'CPU Utilization', value: `${((result.processes.reduce((acc, p) => acc + p.burst, 0) / totalTime) * 100).toFixed(1)}%` },
        ].map((metric, i) => (
          <div key={i}>
            <p className="text-[9px] font-bold text-white/40 uppercase tracking-[0.2em] mb-2">{metric.label}</p>
            <p className="text-2xl font-light text-white font-mono">{metric.value}</p>
          </div>
        ))}
      </div>

    </div>
  );
}
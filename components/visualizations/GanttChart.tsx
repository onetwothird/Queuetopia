import { SimulationResult, TimelineEvent } from '@/lib/types';

// Vibrant, contrasting colors that pop against the #050505 background
const PROCESS_COLORS = [
  'bg-white text-black',         // P0
  'bg-[#3b82f6] text-white',     // P1 - Blue
  'bg-[#10b981] text-white',     // P2 - Emerald
  'bg-[#f43f5e] text-white',     // P3 - Rose
  'bg-[#f59e0b] text-white',     // P4 - Amber
  'bg-[#8b5cf6] text-white',     // P5 - Violet
];

export default function GanttChart({ timeline, result }: { timeline: TimelineEvent[], result: SimulationResult }) {
  if (!timeline || timeline.length === 0) return null;
  const totalTime = timeline[timeline.length - 1].end;
  const timeSteps = Array.from(new Set(timeline.map(t => t.start).concat(totalTime))).sort((a, b) => a - b);

  return (
    <div className="bg-transparent p-6 border border-white/10 space-y-12">
      
      <div>
        <h2 className="text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-8">04. Timeline</h2>
        
        {/* Timeline Blocks */}
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

        {/* Time Markers */}
        <div className="relative h-12 border-t border-white/20 mt-2">
          {timeSteps.map((time) => {
            const positionPercent = (time / totalTime) * 100;
            return (
              <div key={`step-${time}`} className="absolute top-2 -ml-2" style={{ left: `${positionPercent}%` }}>
                <span className="text-xs font-mono text-white/60">{time}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Metrics Footer */}
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
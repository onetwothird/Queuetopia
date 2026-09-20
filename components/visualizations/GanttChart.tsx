import { motion } from 'framer-motion';
import { SimulationResult, TimelineEvent } from '@/lib/types';

const PROCESS_COLORS = [
  'bg-white text-black',
  'bg-[#3b82f6] text-white',
  'bg-[#10b981] text-white',
  'bg-[#f43f5e] text-white',
  'bg-[#f59e0b] text-white',
  'bg-[#8b5cf6] text-white',
];

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

function colorFor(process: number | 'idle'): string {
  if (process === 'idle') return 'bg-[#0a0a0a] text-white/30';
  return PROCESS_COLORS[(process as number) % PROCESS_COLORS.length];
}

export default function GanttChart({ timeline, result }: { timeline: TimelineEvent[]; result: SimulationResult }) {
  if (!timeline || timeline.length === 0) return null;
  const totalTime = timeline[timeline.length - 1].end;
  const timeSteps = Array.from(new Set(timeline.flatMap((t) => [t.start, t.end]))).sort((a, b) => a - b);

  const processes = result.processes;
  const n = processes.length;
  const avg = (fn: (p: (typeof processes)[number]) => number) =>
    n === 0 ? 0 : processes.reduce((acc, p) => acc + fn(p), 0) / n;

  const avgTurnaround = avg((p) => p.turnaround);
  const avgWaiting = avg((p) => p.waiting);
  const avgResponse = avg((p) => (p.response >= 0 ? p.response : 0));
  const cpuUtil = totalTime === 0 ? 0 : (processes.reduce((acc, p) => acc + p.burst, 0) / totalTime) * 100;
  const preemptions = timeline.filter((e, i) => {
    if (i === timeline.length - 1 || e.process === 'idle') return false;
    return timeline[i + 1].process !== e.process;
  }).length;
  const idleTime = timeline.filter((e) => e.process === 'idle').reduce((acc, e) => acc + (e.end - e.start), 0);

  return (
    <div className="bg-transparent border border-white/10 space-y-12">
      {/* ============================ 04 TIMELINE ============================ */}
      <div className="p-6 md:p-8">
        <h2 className="text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-8">04. Timeline</h2>

        <div className="flex w-full h-16 overflow-hidden border border-white/20 bg-[#0a0a0a]">
          {timeline.map((event, idx) => {
            const widthPercent = ((event.end - event.start) / totalTime) * 100;
            const isIdle = event.process === 'idle';

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scaleX: 0.5 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.7, delay: idx * 0.12, ease: EASE }}
                className={`flex items-center justify-center border-r border-[#050505] last:border-0 min-w-8 origin-left ${colorFor(event.process)}`}
                style={{ width: `${Math.max(widthPercent, 2)}%` }}
              >
                <span className="text-xs font-bold tracking-wider font-mono whitespace-nowrap">
                  {isIdle ? 'IDLE' : `P${event.process}`}
                </span>
              </motion.div>
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

      {/* ============================ 05 METRICS ============================ */}
      <div className="px-6 md:px-8">
        <h2 className="text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-6">05. Aggregate Metrics</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {[
            { label: 'Avg Turnaround', value: `${avgTurnaround.toFixed(2)}ms` },
            { label: 'Avg Waiting', value: `${avgWaiting.toFixed(2)}ms` },
            { label: 'Avg Response', value: `${avgResponse.toFixed(2)}ms` },
            { label: 'CPU Utilization', value: `${cpuUtil.toFixed(1)}%` },
            { label: 'Idle Gap', value: `${idleTime}ms` },
            { label: 'Context Switches', value: `${preemptions}` },
          ].map((metric, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.08, ease: EASE }}
            >
              <p className="text-[9px] font-bold text-white/40 uppercase tracking-[0.2em] mb-2">{metric.label}</p>
              <p className="text-xl md:text-2xl font-light text-white font-mono">{metric.value}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* =========================== 06 PER-PROCESS =========================== */}
      <div className="px-6 md:px-8 pb-6 md:pb-8">
        <h2 className="text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-6">06. Per-Process Analysis</h2>
        <div className="overflow-x-auto border border-white/10">
          <table className="w-full text-left font-mono text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[9px] uppercase tracking-[0.2em] text-white/40">
                <th className="px-4 py-3 font-medium">Process</th>
                <th className="px-4 py-3 font-medium">Arrival</th>
                <th className="px-4 py-3 font-medium">Burst</th>
                <th className="px-4 py-3 font-medium">Start</th>
                <th className="px-4 py-3 font-medium">Completion</th>
                <th className="px-4 py-3 font-medium">Turnaround</th>
                <th className="px-4 py-3 font-medium">Waiting</th>
                <th className="px-4 py-3 font-medium">Response</th>
              </tr>
            </thead>
            <tbody>
              {processes.map((p, idx) => (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.45, delay: 0.4 + idx * 0.07, ease: EASE }}
                  className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-3">
                      <span className={`w-2 h-2 ${PROCESS_COLORS[(p.id - 1) % PROCESS_COLORS.length].split(' ')[0]}`} />
                      P{p.id}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-white/60">{p.arrival}ms</td>
                  <td className="px-4 py-3.5 text-white/60">{p.burst}ms</td>
                  <td className="px-4 py-3.5 text-white/80">{p.startTime >= 0 ? `${p.startTime}ms` : '—'}</td>
                  <td className="px-4 py-3.5 text-white/80">{p.completion}ms</td>
                  <td className="px-4 py-3.5 text-white">{p.turnaround}ms</td>
                  <td className="px-4 py-3.5 text-white">{p.waiting}ms</td>
                  <td className="px-4 py-3.5 text-white/80">{p.response >= 0 ? `${p.response}ms` : '—'}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
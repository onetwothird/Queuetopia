import { motion } from 'framer-motion';
import { TimelineEvent } from '@/lib/types';
import { RefreshCw, Clock } from 'lucide-react';

interface Props {
  timeline: TimelineEvent[];
  timeQuantum: number;
}

export default function RrFlow({ timeline, timeQuantum }: Props) {
  if (!timeline || timeline.length === 0) return null;

  const contextSwitches = timeline.filter((event, index) => {
    if (index === timeline.length - 1) return false;
    const duration = event.end - event.start;
    return duration === timeQuantum && timeline[index + 1].process !== event.process;
  });

  return (
    <div className="bg-transparent p-6 border border-white/10 mt-6">
      <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
        <h2 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">Round Robin: Cyclic Preemption Log</h2>
        <div className="flex items-center gap-2 text-white/50">
          <Clock className="w-3 h-3" />
          <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Quantum: {timeQuantum}ms</span>
        </div>
      </div>

      {contextSwitches.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <RefreshCw className="w-6 h-6 text-white/20 mb-4" strokeWidth={1} />
          <p className="text-[10px] tracking-[0.2em] text-white/40 uppercase font-medium">No preemptions occurred.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {contextSwitches.map((event, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex items-center gap-6 p-4 bg-[#0a0a0a] border border-white/5"
            >
              <div className="flex flex-col items-center justify-center w-12 shrink-0 border-r border-white/10 pr-6">
                <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1">Time</span>
                <span className="text-sm font-mono text-white">{event.end}</span>
              </div>
              
              <div className="flex items-center gap-4 text-sm font-mono">
                <span className="text-white/60">P{event.process}</span>
                <RefreshCw className="w-3 h-3 text-white/40" />
                <span className="text-white/60 text-xs">Forced context switch. Sent to back of ready queue.</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
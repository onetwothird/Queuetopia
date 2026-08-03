import { motion } from 'framer-motion';
import { SimulationResult } from '@/lib/types';

interface Props {
  result: SimulationResult;
  totalTime: number;
}

export default function MetricsDisplay({ result, totalTime }: Props) {
  if (!result || result.processes.length === 0) return null;

  const n = result.processes.length;
  
  const avgTurnaround = (result.processes.reduce((acc, p) => acc + p.turnaround, 0) / n).toFixed(2);
  const avgWaiting = (result.processes.reduce((acc, p) => acc + p.waiting, 0) / n).toFixed(2);
  const cpuUtilization = ((result.processes.reduce((acc, p) => acc + p.burst, 0) / totalTime) * 100).toFixed(1);

  const metrics = [
    { label: 'Avg Turnaround', value: `${avgTurnaround}ms` },
    { label: 'Avg Waiting', value: `${avgWaiting}ms` },
    { label: 'Total Duration', value: `${totalTime}ms` },
    { label: 'CPU Utilization', value: `${cpuUtilization}%` },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-white/10"
    >
      {metrics.map((metric, i) => (
        <div key={i} className="flex flex-col justify-center">
          <p className="text-[9px] font-bold text-white/40 uppercase tracking-[0.2em] mb-2">
            {metric.label}
          </p>
          <p className="text-2xl font-light text-white font-mono">
            {metric.value}
          </p>
        </div>
      ))}
    </motion.div>
  );
}
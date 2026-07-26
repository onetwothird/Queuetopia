"use client";

import { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { Process, SimulationResult } from '@/lib/types';
import { runSimulation } from '@/lib/algorithms';
import AlgorithmSelect from '@/components/simulator/AlgorithmSelect';
import ProcessForm from '@/components/simulator/ProcessForm';
import ProcessTable from '@/components/simulator/ProcessTable';
import GanttChart from '@/components/visualizations/GanttChart';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

export default function SimulatorPage() {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [algorithm, setAlgorithm] = useState<string>('fcfs');
  const [timeQuantum, setTimeQuantum] = useState<number>(2);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const handleAddProcess = (data: Omit<Process, 'id' | 'completion' | 'turnaround' | 'waiting' | 'response' | 'startTime'>) => {
    const newId = processes.length > 0 ? Math.max(...processes.map((p) => p.id)) + 1 : 1;
    setProcesses([...processes, { ...data, id: newId, completion: 0, turnaround: 0, waiting: 0, response: -1, startTime: -1 }]);
  };

  const handleClear = () => {
    setProcesses([]);
    setResult(null);
  };

  const handleDelete = (id: number) => {
    setProcesses(processes.filter((p) => p.id !== id));
  };

  const handleSimulate = () => {
    if (processes.length === 0) return;
    setResult(runSimulation(algorithm, processes, timeQuantum));
  };

  return (
    <main className="min-h-screen pt-32 pb-24 bg-[#050505] selection:bg-white selection:text-black">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
      >
        <motion.div variants={itemVariants} className="lg:col-span-12 mb-4 border-b border-white/10 pb-8">
          <p className="text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase mb-4">Workspace</p>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-white">
            CONFIGURE & EXECUTE
          </h1>
        </motion.div>

        <motion.div variants={itemVariants} className="lg:col-span-4 space-y-6 lg:sticky lg:top-32">
          <AlgorithmSelect algorithm={algorithm} setAlgorithm={setAlgorithm} timeQuantum={timeQuantum} setTimeQuantum={setTimeQuantum} />
          <ProcessForm algorithm={algorithm} onAddProcess={handleAddProcess} onClear={handleClear} />
        </motion.div>

        <motion.div variants={itemVariants} className="lg:col-span-8 space-y-6">
          <ProcessTable processes={processes} algorithm={algorithm} onDelete={handleDelete} onSimulate={handleSimulate} />
          {result && (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
              <GanttChart timeline={result.timeline} result={result} />
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </main>
  );
}
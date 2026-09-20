"use client";

import { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Process, SimulationResult } from '@/lib/types';
import { runSimulation } from '@/lib/algorithms';
import { ALGORITHM_BY_KEY } from '@/lib/algorithms-meta';
import AlgorithmSelect from '@/components/simulator/AlgorithmSelect';
import ProcessForm from '@/components/simulator/ProcessForm';
import ProcessTable from '@/components/simulator/ProcessTable';
import GanttChart from '@/components/visualizations/GanttChart';
import RrFlow from '@/components/visualizations/RrFlow';
import { FlaskConical, ArrowRight } from 'lucide-react';

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

// Algorithms whose scheduling decisions are made on fixed time slices; these
// surface the Round Robin-style cyclic preemption log after a run.
const QUANTUM_ALGORITHMS = ['rr', 'mlq', 'mlfq', 'lottery', 'stride', 'guaranteed', 'fairshare'];

export default function SimulatorPage() {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [algorithm, setAlgorithm] = useState<string>('fcfs');
  const [timeQuantum, setTimeQuantum] = useState<number>(2);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const meta = ALGORITHM_BY_KEY[algorithm];
  const showPreemptionLog = QUANTUM_ALGORITHMS.includes(algorithm);

  // Deep links like /simulator?algorithm=rr (used by the resources pages) are
  // applied by adjusting state during render — a legal React pattern that
  // avoids effects and hydration mismatches. Applied at most once.
  const [urlAlgorithm] = useState<string | null>(() =>
    typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('algorithm')
  );
  const [urlApplied, setUrlApplied] = useState(false);
  if (!urlApplied && urlAlgorithm && ALGORITHM_BY_KEY[urlAlgorithm]) {
    setAlgorithm(urlAlgorithm);
    setUrlApplied(true);
  }

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

  const handleDeleteAndInvalidate = (id: number) => {
    handleDelete(id);
    setResult(null);
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
            CONFIGURE &amp; EXECUTE
          </h1>
        </motion.div>

        <motion.div variants={itemVariants} className="lg:col-span-4 space-y-6 lg:sticky lg:top-32">
          <AlgorithmSelect algorithm={algorithm} setAlgorithm={setAlgorithm} timeQuantum={timeQuantum} setTimeQuantum={setTimeQuantum} />

          {/* Algorithm profile — what this discipline is and how it decides */}
          {meta && (
            <div className="bg-transparent border border-white/10 p-6">
              <div className="flex items-center gap-2 mb-5">
                <FlaskConical className="w-3.5 h-3.5 text-white/40" strokeWidth={1.5} />
                <h2 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">Active Discipline</h2>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <span className="font-mono text-2xl font-light text-white">{meta.short}</span>
                <span
                  className={`text-[9px] font-bold uppercase tracking-[0.18em] px-2.5 py-1 border ${
                    meta.kind === 'Quantum'
                      ? 'border-emerald-400/30 text-emerald-300/80'
                      : meta.kind === 'Preemptive'
                        ? 'border-sky-400/30 text-sky-300/80'
                        : 'border-white/20 text-white/50'
                  }`}
                >
                  {meta.kind}
                </span>
              </div>
              <p className="text-base font-medium text-white tracking-tight mb-3">{meta.name}</p>
              <p className="text-xs text-white/50 leading-relaxed mb-5">{meta.blurb}</p>
              <dl className="border-t border-white/10 pt-4 space-y-2 text-[11px]">
                <div className="flex items-center justify-between gap-4">
                  <dt className="font-mono text-white/35 uppercase tracking-widest text-[9px]">Mechanism</dt>
                  <dd className="text-white/70 text-right">{meta.structure}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="font-mono text-white/35 uppercase tracking-widest text-[9px]">Quantum</dt>
                  <dd className="text-white/70">{meta.quantum ? 'Required' : 'Not used'}</dd>
                </div>
              </dl>
            </div>
          )}

          <ProcessForm algorithm={algorithm} onAddProcess={handleAddProcess} onClear={handleClear} />
        </motion.div>

        <motion.div variants={itemVariants} className="lg:col-span-8 space-y-6">
          <ProcessTable
            processes={processes}
            algorithm={algorithm}
            onDelete={handleDeleteAndInvalidate}
            onSimulate={handleSimulate}
          />

          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.5, ease: EASE }}
                className="space-y-6"
              >
                <GanttChart timeline={result.timeline} result={result} />
                {showPreemptionLog && result.timeline.some((e) => e.process !== 'idle') && (
                  <RrFlow timeline={result.timeline} timeQuantum={timeQuantum} />
                )}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="border border-dashed border-white/15 py-20 px-6 flex flex-col items-center justify-center text-center"
              >
                <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/25 mb-4">
                  Awaiting Execution
                </p>
                <p className="text-sm text-white/40 max-w-sm leading-relaxed">
                  Add at least one process, select a discipline, then press{' '}
                  <span className="text-white/70">Execute Simulation</span> to render the Gantt
                  timeline, per-process metrics, and CPU utilization.
                </p>
                <ArrowRight className="w-4 h-4 text-white/20 mt-8 animate-pulse" strokeWidth={1.5} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </main>
  );
}
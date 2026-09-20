"use client";

import { useEffect, useRef, useState } from 'react';
import { motion, animate, useInView, Variants } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowDown,
  ArrowRight,
  Cpu,
  Activity,
  FastForward,
  Layers,
  GitCommit,
  Clock,
  Sigma,
  Gauge,
  Timer,
  BookOpen,
  FlaskConical,
  Rows3,
  TrendingUp,
} from 'lucide-react';
import { ALGORITHM_META, ALGORITHM_FAMILIES, AlgorithmMeta } from '@/lib/algorithms-meta';

/* ------------------------------------------------------------------ */
/* Shared easing + variants                                            */
/* ------------------------------------------------------------------ */

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } },
};

const stagger: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.14, delayChildren: 0.1 } },
};

/* ------------------------------------------------------------------ */
/* Animated counter                                                    */
/* ------------------------------------------------------------------ */

function Counter({
  to,
  suffix = '',
  decimals = 0,
}: {
  to: number;
  suffix?: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [value, setValue] = useState('0');

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration: 1.8,
      ease: EASE,
      onUpdate: (v) => setValue(v.toFixed(decimals)),
    });
    return () => controls.stop();
  }, [inView, to, decimals]);

  return (
    <span ref={ref} className="font-mono">
      {value}
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Mini Gantt animation used in the hero                               */
/* ------------------------------------------------------------------ */

const HERO_SEGMENTS: { label: string; color: string; width: string }[] = [
  { label: 'P1', color: 'bg-white text-black', width: 'w-[22%]' },
  { label: 'P3', color: 'bg-[#3b82f6] text-white', width: 'w-[16%]' },
  { label: 'P2', color: 'bg-[#10b981] text-white', width: 'w-[14%]' },
  { label: 'IDLE', color: 'bg-transparent text-white/30', width: 'w-[8%]' },
  { label: 'P4', color: 'bg-[#f59e0b] text-white', width: 'w-[20%]' },
  { label: 'P1', color: 'bg-white text-black', width: 'w-[20%]' },
];

const HERO_TICKS = [
  { pct: 0, label: '0' },
  { pct: 22, label: 't=3' },
  { pct: 38, label: 't=6' },
  { pct: 52, label: 't=9' },
  { pct: 60, label: 't=12' },
  { pct: 80, label: 't=16' },
  { pct: 100, label: 't=21' },
];

// Column counts are chosen per family so the gapped grid never leaves a
// vacant cell on any breakpoint (classic 6 → 3×2, quantum 3 → 1 row of 3,
// proportional 4 → 2×2, realtime 2 → 1 row of 2).
const FAMILY_GRID: Record<string, string> = {
  classic: 'sm:grid-cols-2 lg:grid-cols-3',
  quantum: 'sm:grid-cols-3 lg:grid-cols-3',
  proportional: 'sm:grid-cols-2 lg:grid-cols-2',
  realtime: 'sm:grid-cols-2 lg:grid-cols-2',
};

function HeroGantt() {
  return (
    <div className="relative" aria-hidden="true">
      {/* Frame */}
      <div className="border border-white/15 bg-[#0a0a0a] p-2">
        <div className="flex w-full h-12 overflow-hidden border border-white/10">
          {HERO_SEGMENTS.map((seg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scaleX: 0.4 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.9, delay: 0.9 + i * 0.18, ease: EASE }}
              className={`${seg.width} ${seg.color} flex items-center justify-center border-r border-[#0a0a0a] last:border-0`}
            >
              <span className="text-[10px] font-bold tracking-wider font-mono">{seg.label}</span>
            </motion.div>
          ))}
        </div>
        {/* Ruled time markers */}
        <div className="relative h-9">
          {HERO_TICKS.map((t) => (
            <div
              key={t.label}
              className="absolute top-0 flex flex-col items-center"
              style={{ left: `${t.pct}%`, transform: 'translateX(-50%)' }}
            >
              <div className="w-px h-2 bg-white/20" />
              <span className="text-[9px] font-mono text-white/40 mt-1">{t.label}</span>
            </div>
          ))}
          {/* Scanning indicator */}
          <motion.div
            initial={{ left: '0%' }}
            animate={{ left: '100%' }}
            transition={{ duration: 3.2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
            className="absolute top-0 bottom-0 w-px bg-white/80"
          />
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[10px] text-white/40">
        <span className="flex items-center gap-2"><span className="w-3 h-3 bg-white inline-block" /> CPU-bound</span>
        <span className="flex items-center gap-2"><span className="w-3 h-3 bg-[#3b82f6] inline-block" /> SRTF preemption</span>
        <span className="flex items-center gap-2"><span className="w-3 h-3 bg-[#10b981] inline-block" /> Round Robin</span>
        <span className="flex items-center gap-2"><span className="w-3 h-3 border border-dashed border-white/40 inline-block" /> Idle</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Marquee strip                                                       */
/* ------------------------------------------------------------------ */

const MARQUEE = [
  'FCFS', 'SJF', 'SRTF', 'PRIORITY', 'ROUND ROBIN', 'HRRN', 'MLQ', 'MLFQ',
  'LOTTERY', 'STRIDE', 'GUARANTEED', 'FAIR SHARE', 'EDF', 'RMS',
];

function AlgorithmMarquee() {
  return (
    <div className="relative overflow-hidden border-y border-white/10 py-6 select-none">
      <div className="animate-marquee flex w-max items-center gap-10 whitespace-nowrap">
        {[...MARQUEE, ...MARQUEE].map((algo, i) => (
          <span key={i} className="flex items-center gap-10 font-mono text-sm tracking-[0.3em] text-white/35">
            {algo}
            <span className="text-white/15">·</span>
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#050505] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#050505] to-transparent" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function HomePage() {
  return (
    <main className="min-h-screen text-white selection:bg-white selection:text-black">
      {/* ============================ HERO ============================ */}
      <section className="relative h-svh min-h-[680px] flex flex-col justify-center px-6 md:px-12 overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="relative z-10 mt-16 md:mt-24 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-20 items-center"
        >
          <div className="lg:col-span-7">
            <motion.p variants={fadeUp} className="inline-flex items-center gap-3 text-[10px] md:text-xs font-bold tracking-[0.2em] text-white/50 uppercase mb-8 border-b border-white/10 pb-2">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Computational Systems Lab
            </motion.p>

            <motion.h1
              variants={fadeUp}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-[6.5rem] leading-[0.92] font-light tracking-tighter uppercase"
            >
              Deterministic
              <br />
              Scheduling
              <br />
              <span className="text-white/40">Analysis.</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="mt-8 md:mt-10 max-w-xl text-sm font-medium tracking-wide text-white/60 leading-relaxed">
              Queue up processes, run them through <span className="text-white">fifteen scheduling algorithms</span>,
              and inspect the resulting execution timeline, per-process metrics, and CPU utilization — computed by
              a pure, dependency-free simulation engine.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-10 md:mt-12 flex flex-wrap items-center gap-4">
              <Link
                href="/simulator"
                className="group inline-flex items-center gap-3 bg-white text-black text-[10px] font-bold tracking-[0.25em] uppercase px-10 py-5 hover:bg-white/90 transition-colors"
              >
                Open Simulator
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={2} />
              </Link>
              <Link
                href="/resources"
                className="inline-flex items-center gap-3 border border-white/20 text-white/80 text-[10px] font-bold tracking-[0.25em] uppercase px-10 py-5 hover:bg-white hover:text-black transition-all"
              >
                Algorithm Reference
              </Link>
            </motion.div>
          </div>

          <motion.div
            variants={fadeUp}
            transition={{ delay: 0.6 }}
            className="lg:col-span-5"
          >
            <HeroGantt />
          </motion.div>
        </motion.div>

        <motion.a
          href="#stats"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 w-12 h-12 md:w-16 md:h-16 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-colors"
          aria-label="Scroll to statistics"
        >
          <ArrowDown className="w-4 h-4 md:w-5 md:h-5" strokeWidth={1.5} />
        </motion.a>
      </section>

      {/* ============================ STATS ============================ */}
      <section id="stats" className="border-t border-white/10 px-6 md:px-12 py-16 md:py-20">
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-y-12">
          {[
            { icon: Rows3, to: 15, suffix: '', label: 'Scheduling Algorithms', sub: 'Non-preemptive → real-time' },
            { icon: FlaskConical, to: 4, suffix: '', label: 'Shared Simulation Runners', sub: 'From a single engine' },
            { icon: Gauge, to: 6, suffix: '', label: 'Evaluative Metrics', sub: 'Turnaround · waiting · response' },
            { icon: Timer, to: 100, suffix: '%', label: 'Deterministic Execution', sub: 'Seeded PRNG, no surprises' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: EASE }}
              className="flex flex-col gap-3 border-l border-white/10 pl-6"
            >
              <stat.icon className="w-5 h-5 text-white/30 mb-2" strokeWidth={1.2} />
              <p className="text-4xl md:text-5xl font-light tracking-tight text-white">
                <Counter to={stat.to} suffix={stat.suffix} /> 
              </p>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">{stat.label}</p>
              <p className="text-[10px] font-mono text-white/35">{stat.sub}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <AlgorithmMarquee />

      {/* ====================== 01 SYSTEM ARCHITECTURE ====================== */}
      <section id="architecture" className="py-24 md:py-32 px-6 md:px-12 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase mb-16"
          >
            01. System Architecture
          </motion.p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
            {[
              { icon: Cpu, title: 'Multi-Heuristic Engine', desc: 'Run comparative analysis across all fifteen scheduling models — FCFS through RMS — from a single pure, framework-independent simulation core.' },
              { icon: Activity, title: 'Empirical Metrics', desc: 'Every run resolves per-process completion, turnaround, waiting, and response — plus aggregate CPU saturation and makespan.' },
              { icon: FastForward, title: 'Tick-Accurate Timeline', desc: 'Discrete, tick-by-tick Gantt visualization that makes context-switch overhead, idle gaps, and starvation vectors visible.' },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.8, delay: idx * 0.15, ease: EASE }}
                className="group border-l border-white/15 pl-6 hover:border-white/60 transition-colors duration-500"
              >
                <feature.icon className="w-6 h-6 mb-6 text-white/40 transition-transform duration-500 group-hover:scale-110" strokeWidth={1.2} />
                <h3 className="text-lg md:text-xl font-medium tracking-tight mb-4">{feature.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================== 02 METHODOLOGY =========================== */}
      <section className="py-24 md:py-32 px-6 md:px-12 bg-[#0a0a0a] border-y border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: EASE }}
              className="lg:sticky lg:top-32"
            >
              <p className="text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase mb-6">02. Methodology</p>
              <h2 className="text-4xl md:text-5xl font-light tracking-tight leading-tight mb-8">
                COMPUTATIONAL
                <br />
                EXECUTION.
              </h2>
              <p className="text-white/60 leading-relaxed text-sm max-w-md">
                The simulator constructs a strictly governed single-core ready-queue environment. By introducing
                arbitrary arrival matrices and CPU burst requirements, researchers can empirically validate
                theoretical scheduling constraints — and compare algorithm trade-offs side by side.
              </p>
              <div className="mt-10 font-mono text-[11px] text-white/40 space-y-2">
                <p className="flex items-center gap-3"><span className="w-2 h-2 bg-white/40 inline-block" /> arrival · burst · priority matrix</p>
                <p className="flex items-center gap-3"><span className="w-2 h-2 bg-white/40 inline-block" /> 1ms preemption resolution</p>
                <p className="flex items-center gap-3"><span className="w-2 h-2 bg-white/40 inline-block" /> merged timeline → Gantt render</p>
              </div>
            </motion.div>

            <div className="relative">
              <div className="absolute left-5 top-2 bottom-2 w-px bg-white/10" aria-hidden="true" />
              <div className="space-y-10">
                {[
                  { icon: Layers, title: 'Define Global Constraints', desc: 'Initialize the algorithmic model and establish global preemption variables, such as the requisite time quantum q for cyclical operations.' },
                  { icon: GitCommit, title: 'Populate Data Structures', desc: 'Inject discrete processes into the queue array, defining chronological arrival constraints, required processing bursts, and hierarchical weights.' },
                  { icon: Clock, title: 'Compile and Execute', desc: 'Run the analytical engine to resolve the queue structure into chronological sequence maps and final throughput calculations.' },
                ].map((step, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.6, delay: 0.15 + idx * 0.12, ease: EASE }}
                    className="relative flex gap-6 items-start"
                  >
                    <div className="relative z-10 mt-1 w-10 h-10 rounded-none border border-white/20 bg-[#0a0a0a] flex items-center justify-center shrink-0">
                      <step.icon className="w-4 h-4 text-white/60" strokeWidth={1.2} />
                    </div>
                    <div className="pt-1.5">
                      <p className="font-mono text-[10px] text-white/30 mb-1.5">STEP 0{idx + 1}</p>
                      <h4 className="text-base font-medium tracking-tight mb-2">{step.title}</h4>
                      <p className="text-sm text-white/50 leading-relaxed">{step.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================= 03 ALGORITHM LIBRARY ======================= */}
      <section id="algorithms" className="py-24 md:py-32 px-6 md:px-12 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: EASE }}
            className="mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-6"
          >
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase mb-6">03. Algorithm Library</p>
              <h2 className="text-4xl md:text-5xl font-light tracking-tight leading-tight">
                FIFTEEN SCHEDULING
                <br />
                DISCIPLINES.
              </h2>
            </div>
            <p className="md:text-right text-sm text-white/50 max-w-sm leading-relaxed">
              Grouped by family — from the classic textbook disciplines to proportional-share and hard
              real-time schedulers. Every one of them runs in the same engine.
            </p>
          </motion.div>

          <div className="space-y-20">
            {ALGORITHM_FAMILIES.map((family) => (
              <div key={family.id}>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.6, ease: EASE }}
                  className="mb-8 border-b border-white/10 pb-6"
                >
                  <p className="font-mono text-[10px] text-white/30 mb-2">{family.index}</p>
                  <h3 className="text-xl md:text-2xl font-light tracking-tight">{family.label}</h3>
                  <p className="mt-2 text-sm text-white/45">{family.blurb}</p>
                </motion.div>

                <div className={`grid grid-cols-1 gap-px bg-white/10 border border-white/10 ${FAMILY_GRID[family.id]}`}>
                  {ALGORITHM_META.filter((a) => a.family === family.id).map((algo, idx) => (
                    <AlgorithmCard key={algo.key} algo={algo} index={idx} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================= 04 EVALUATIVE METRICS ======================= */}
      <section id="metrics" className="py-24 md:py-32 px-6 md:px-12 bg-[#0a0a0a] border-y border-white/10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: EASE }}
            className="mb-16"
          >
            <p className="text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase mb-6">04. Evaluative Metrics</p>
            <h2 className="text-4xl md:text-5xl font-light tracking-tight leading-tight">
              MEASURED, NOT
              <br />
              ESTIMATED.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/10 border border-white/10">
            <MetricCard
              icon={Sigma}
              title="Turnaround Time"
              formula={<>T<sub>tr</sub> = T<sub>complete</sub> − T<sub>arrive</sub></>}
              desc="Span from submission to completion — the full time a process occupies the system."
            />
            <MetricCard
              icon={Clock}
              title="Waiting Time"
              formula={<>T<sub>wait</sub> = T<sub>tr</sub> − T<sub>burst</sub></>}
              desc="Time spent idle in the ready queue; the quantity scheduling policies most directly shape."
            />
            <MetricCard
              icon={TrendingUp}
              title="Response Time"
              formula={<>T<sub>resp</sub> = T<sub>first</sub> − T<sub>arrive</sub></>}
              desc="Delay until first CPU allocation — the key interactivity metric for time-sharing work."
            />
            <MetricCard
              icon={Gauge}
              title="CPU Utilization"
              formula={<>U = Σ T<sub>burst</sub> ÷ T<sub>makespan</sub></>}
              desc="Fraction of wall-clock time the core is busy — drops as context-switch and idle overhead grow."
            />
          </div>
        </div>
      </section>

      {/* ============================= CTA ============================= */}
      <section className="py-32 px-6 md:px-12 text-center flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASE }}
          className="max-w-2xl"
        >
          <BookOpen className="mx-auto w-8 h-8 text-white/25 mb-8" strokeWidth={1} />
          <p className="text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase mb-6">Initialize Workspace</p>
          <h2 className="text-4xl md:text-5xl font-light tracking-tight leading-tight mb-10 uppercase">
            Run your first
            <br />
            schedule now.
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/simulator"
              className="group inline-flex items-center gap-4 bg-white text-black text-[10px] font-bold tracking-[0.2em] uppercase px-12 py-5 hover:bg-white/90 transition-all"
            >
              Open Simulator
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
            </Link>
            <Link
              href="/resources"
              className="inline-flex items-center gap-4 border border-white/20 text-white/80 text-[10px] font-bold tracking-[0.2em] uppercase px-12 py-5 hover:bg-white hover:text-black transition-all"
            >
              Read the Theory
            </Link>
          </div>
        </motion.div>
      </section>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

function AlgorithmCard({ algo, index }: { algo: AlgorithmMeta; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.7, delay: (index % 3) * 0.1, ease: EASE }}
      className="group relative bg-[#050505] p-7 flex flex-col hover:bg-[#0b0b0b] transition-colors duration-500"
    >
      <div className="flex items-start justify-between mb-6">
        <span className="font-mono text-2xl font-light text-white/85 tracking-tight">{algo.short}</span>
        <span
          className={`text-[9px] font-bold uppercase tracking-[0.18em] px-2.5 py-1 border ${
            algo.kind === 'Quantum'
              ? 'border-emerald-400/30 text-emerald-300/80'
              : algo.kind === 'Preemptive'
                ? 'border-sky-400/30 text-sky-300/80'
                : 'border-white/20 text-white/50'
          }`}
        >
          {algo.kind}
        </span>
      </div>
      <h4 className="text-sm font-medium text-white/90 mb-3">{algo.name}</h4>
      <p className="text-xs text-white/45 leading-relaxed mb-6 flex-1">{algo.blurb}</p>
      <div className="pt-4 border-t border-white/10 flex items-center justify-between">
        <span className="font-mono text-[10px] text-white/35">{algo.structure}</span>
        <span className="font-mono text-[10px] text-white/35 opacity-0 group-hover:opacity-100 transition-opacity">
          {algo.quantum ? 'quantum-driven' : 'one-shot'}
        </span>
      </div>
    </motion.div>
  );
}

function MetricCard({
  icon: Icon,
  title,
  formula,
  desc,
}: {
  icon: React.ElementType;
  title: string;
  formula: React.ReactNode;
  desc: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, ease: EASE }}
      className="group bg-[#0a0a0a] p-8 md:p-10 flex flex-col hover:bg-[#0d0d0d] transition-colors duration-500"
    >
      <Icon className="w-5 h-5 text-white/35 mb-8 transition-transform duration-500 group-hover:-translate-y-0.5" strokeWidth={1.3} />
      <h3 className="text-base font-medium tracking-tight mb-4">{title}</h3>
      <div className="bg-[#050505] border border-white/10 p-5 mb-5 font-mono text-lg text-white/85 tracking-wide">
        {formula}
      </div>
      <p className="text-xs text-white/45 leading-relaxed">{desc}</p>
    </motion.div>
  );
}
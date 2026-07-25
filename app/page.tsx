"use client";

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowDown, Cpu, Activity, FastForward, GitCommit, Layers, Clock } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-white selection:text-black">
      
      <section className="relative h-svh flex flex-col justify-center px-6 md:px-12 overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />

        <div className="z-10 mt-12 md:mt-20 max-w-6xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-[10px] md:text-xs font-bold tracking-[0.2em] text-white/50 uppercase mb-8 border-b border-white/10 inline-block pb-2">
              Computational Systems Lab
            </p>
            <h1 className="text-5xl sm:text-7xl md:text-[8rem] leading-[0.9] font-light tracking-tighter uppercase wrap-break-word">
              Deterministic <br />
              Scheduling <br />
              Analysis.
            </h1>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 1 }}
            className="mt-8 md:mt-12 max-w-xl"
          >
            <p className="text-sm font-medium tracking-wide text-white/60 leading-relaxed text-justify">
              A rigorous analytical environment designed to evaluate deterministic CPU resource allocation, simulate preemption constraints, and compute heuristic efficiency metrics across standard operating system scheduling algorithms.
            </p>
          </motion.div>
        </div>

        <motion.a 
          href="#architecture"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 w-12 h-12 md:w-16 md:h-16 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-colors"
        >
          <ArrowDown className="w-4 h-4 md:w-5 md:h-5" strokeWidth={1.5} />
        </motion.a>
      </section>

      <section id="architecture" className="py-24 md:py-32 px-6 md:px-12 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <p className="text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase mb-16">01. System Architecture</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
            {[
              { icon: Cpu, title: 'Multi-Heuristic Engine', desc: 'Conduct comparative analysis across FCFS, SJF, SRTF, Round Robin, and Priority scheduling models using unified stochastic datasets.' },
              { icon: Activity, title: 'Empirical Metrics', desc: 'Compute mathematically precise evaluative metrics, including aggregate Wait Time, Turnaround bounds, and optimal CPU saturation percentages.' },
              { icon: FastForward, title: 'Chronological Resolution', desc: 'Generate discrete, tick-by-tick chronological visualizers to identify context-switch overhead and potential starvation vectors.' },
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: idx * 0.2 }}
                className="border-l border-white/10 pl-6"
              >
                <feature.icon className="w-6 h-6 mb-6 text-white/40" strokeWidth={1.2} />
                <h3 className="text-lg md:text-xl font-medium tracking-tight mb-4">{feature.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed text-justify">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 md:py-32 px-6 md:px-12 bg-[#0a0a0a] border-y border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <p className="text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase mb-6">02. Methodology</p>
              <h2 className="text-4xl md:text-5xl font-light tracking-tight leading-tight mb-8">
                COMPUTATIONAL <br />EXECUTION.
              </h2>
              <p className="text-white/60 leading-relaxed text-sm max-w-md text-justify">
                The simulator constructs a strictly governed single-core ready queue environment. By introducing arbitrary arrival matrices and CPU burst requirements, researchers can empirically validate theoretical scheduling constraints.
              </p>
            </motion.div>

            <div className="space-y-8">
              {[
                { icon: Layers, title: 'Define Global Constraints', desc: 'Initialize the algorithmic model and establish global preemption variables, such as the requisite time quantum ($q$) for cyclical operations.' },
                { icon: GitCommit, title: 'Populate Data Structures', desc: 'Inject discrete processes into the queue array, defining chronological arrival constraints, required processing bursts, and hierarchical weights.' },
                { icon: Clock, title: 'Compile and Execute', desc: 'Run the analytical engine to process the queue structure, yielding chronological sequence maps and final throughput calculations.' }
              ].map((step, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 + (idx * 0.1) }}
                  className="flex gap-6 items-start"
                >
                  <div className="mt-1 w-10 h-10 rounded-none border border-white/20 flex items-center justify-center shrink-0 bg-transparent">
                    <step.icon className="w-4 h-4 text-white/60" strokeWidth={1.2} />
                  </div>
                  <div>
                    <h4 className="text-base font-medium tracking-tight mb-2">{step.title}</h4>
                    <p className="text-sm text-white/50 leading-relaxed text-justify">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-32 px-6 md:px-12 text-center flex flex-col items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase mb-8">Initialize Workspace</p>
          <Link href="/simulator" className="group inline-flex items-center gap-4 text-[10px] font-bold tracking-[0.2em] uppercase bg-white text-black px-12 py-5 hover:bg-white/90 transition-all">
            Access Simulator
            <svg 
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" 
              className="transition-transform group-hover:translate-x-1"
            >
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </Link>
        </motion.div>
      </section>
    </main>
  );
}
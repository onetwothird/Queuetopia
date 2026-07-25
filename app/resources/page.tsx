"use client";

import { motion } from 'framer-motion';
import Image from 'next/image';

const algorithms = [
  {
    id: 'fcfs',
    name: 'First Come First Served (FCFS)',
    classification: 'Non-Preemptive',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80&grayscale',
    abstract: 'FCFS represents the most fundamental scheduling heuristic, allocating the central processing unit strictly to the process that requests it first.',
    details: 'Implementation is strictly managed via a FIFO (First-In-First-Out) queue structure. While computationally inexpensive regarding scheduling overhead, FCFS is highly susceptible to the Convoy Effect. This phenomenon occurs when short, I/O-bound processes are forced to wait for heavy, CPU-bound processes to release the core, severely degrading overall system throughput and yielding suboptimal average waiting times.',
  },
  {
    id: 'sjf',
    name: 'Shortest Job First (SJF)',
    classification: 'Non-Preemptive',
    image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80&grayscale',
    abstract: 'SJF minimizes the average waiting time for a given set of processes by consistently selecting the waiting process with the smallest execution time.',
    details: 'Mathematically, SJF is provably optimal for minimizing average waiting time. However, it cannot be perfectly implemented at the level of short-term CPU scheduling because exact future burst times cannot be known. Operating systems approximate this by predicting future burst times using exponential averaging of previous CPU bursts. A critical flaw of SJF is the risk of starvation for long processes.',
  },
  {
    id: 'srtf',
    name: 'Shortest Remaining Time First (SRTF)',
    classification: 'Preemptive',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80&grayscale',
    abstract: 'SRTF serves as the preemptive counterpart to SJF. It continuously evaluates the ready queue, preempting the currently executing process if a new arrival possesses a shorter remaining execution time.',
    details: 'This continuous evaluation provides theoretically optimal average waiting times for dynamic systems. However, SRTF introduces substantial overhead due to frequent context switching. It also suffers from the same starvation vulnerabilities as SJF, where continuous streams of short processes can indefinitely delay heavy, CPU-bound tasks.',
  },
  {
    id: 'priority_np',
    name: 'Non-Preemptive Priority',
    classification: 'Non-Preemptive',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80&grayscale',
    abstract: 'This algorithm assigns an explicit priority integer to each process, allocating the CPU to the highest-priority process until it voluntarily yields or completes.',
    details: 'Priorities can be defined internally (e.g., memory requirements, time limits) or externally (e.g., user importance, department constraints). In the non-preemptive variant, once a process acquires the CPU, it retains control regardless of subsequent arrivals. A major vulnerability is indefinite blocking (starvation) of low-priority processes, typically mitigated by a technique called aging, which gradually increases the priority of waiting processes.',
  },
  {
    id: 'priority_p',
    name: 'Preemptive Priority',
    classification: 'Preemptive',
    image: 'https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?auto=format&fit=crop&w=800&q=80&grayscale',
    abstract: 'The preemptive iteration of priority scheduling immediately interrupts a running process if a new process arrives with a strictly higher priority classification.',
    details: 'This responsiveness is critical for real-time operating systems where tasks must meet strict, hard deadlines. The preemption mechanism requires robust context-switching capabilities. Like its non-preemptive counterpart, it necessitates aging protocols to prevent the starvation of low-tier processes under heavy computational loads.',
  },
  {
    id: 'rr',
    name: 'Round Robin (RR)',
    classification: 'Preemptive',
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80&grayscale',
    abstract: 'Designed specifically for time-sharing systems, RR assigns a fixed time slice (quantum) to each process in equal portions and in circular order.',
    details: 'The ready queue is treated as a circular structure. If a process burst exceeds the defined time quantum, the process is preempted and appended to the tail of the ready queue. The performance of RR depends heavily on the size of the time quantum. If the quantum is infinitely large, RR reduces to FCFS. If it is extremely small, the context-switching overhead dominates CPU utilization. Response time is strictly bounded.',
  },
  {
    id: 'mlq',
    name: 'Multi-Level Queue (MLQ)',
    classification: 'Hybrid',
    image: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&w=800&q=80&grayscale',
    abstract: 'MLQ partitions the ready queue into several distinct sub-queues, permanently assigning processes to a specific queue based on inherent properties like process type or origin.',
    details: 'Each distinct queue possesses its own scheduling algorithm. For instance, foreground (interactive) processes might utilize Round Robin for rapid responsiveness, while background (batch) processes might employ FCFS. Scheduling must also occur between the queues themselves, typically implemented as absolute preemptive priority (e.g., foreground strictly over background) or through proportional time-slicing among the queues.',
  }
];

export default function ResourcesPage() {
  return (
    <main className="min-h-screen pt-32 pb-24 bg-[#050505] selection:bg-white selection:text-black">
      <header className="max-w-5xl mx-auto px-6 md:px-12 mb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <p className="text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase mb-4">Theoretical Foundations</p>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-white mb-8 uppercase">
            Algorithm Architecture & <br /> Mathematical Models
          </h1>
          <p className="text-white/60 leading-relaxed text-sm max-w-2xl">
            A formal analysis of operating system process management, detailing the mathematical metrics used to evaluate scheduler efficiency and the core algorithms that dictate deterministic CPU allocation.
          </p>
        </motion.div>
      </header>

      <section className="max-w-5xl mx-auto px-6 md:px-12 mb-24">
        <div className="border border-white/10 p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 font-mono text-9xl leading-none pointer-events-none">∑</div>
          <h2 className="text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase mb-8">01. Evaluative Metrics</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Turnaround Time</h3>
              <p className="text-sm text-white/60 leading-relaxed mb-4">
                The total interval from the time of submission of a process to the time of its completion. It encapsulates the time spent waiting to get into memory, waiting in the ready queue, executing on the CPU, and doing I/O.
              </p>
              <div className="bg-[#0a0a0a] border border-white/5 p-4 flex justify-center text-white/90">
                {`$$T_{tr} = T_{comp} - T_{arr}$$`}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-2">Waiting Time</h3>
              <p className="text-sm text-white/60 leading-relaxed mb-4">
                The sum of the periods spent waiting in the ready queue. The CPU scheduling algorithm does not affect the amount of time during which a process executes or does I/O; it affects only the amount of time that a process spends waiting.
              </p>
              <div className="bg-[#0a0a0a] border border-white/5 p-4 flex justify-center text-white/90">
                {`$$T_{wt} = T_{tr} - T_{burst}$$`}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 md:px-12 space-y-16">
        <h2 className="text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase mb-8 border-b border-white/10 pb-4">02. Algorithm Specifications</h2>
        
        {algorithms.map((algo) => (
          <motion.article 
            key={algo.id} 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="flex flex-col lg:flex-row gap-12 group"
          >
            <div className="w-full lg:w-1/3 aspect-4/3 relative border border-white/10 overflow-hidden">
              <div className="absolute inset-0 bg-[#050505]/40 group-hover:bg-transparent transition-colors duration-700 z-10" />
              <Image 
                src={algo.image} 
                alt={`${algo.name} architectural representation`}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover scale-105 group-hover:scale-100 transition-transform duration-1000 grayscale opacity-70"
              />
            </div>

            <div className="w-full lg:w-2/3 flex flex-col justify-center">
              <div className="flex flex-wrap items-center gap-4 mb-3">
                <h3 className="text-2xl font-light tracking-tight text-white">{algo.name}</h3>
                <span className="border border-white/20 px-3 py-1 text-[9px] font-bold tracking-[0.2em] text-white/60 uppercase">
                  {algo.classification}
                </span>
              </div>
              
              <p className="text-sm font-medium text-white/80 leading-relaxed mb-6 border-l-2 border-white/20 pl-4">
                {algo.abstract}
              </p>
              
              <p className="text-sm text-white/50 leading-relaxed text-justify">
                {algo.details}
              </p>
            </div>
          </motion.article>
        ))}
      </section>
    </main>
  );
}
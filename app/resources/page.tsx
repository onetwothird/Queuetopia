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
    name: 'Priority Scheduling (Non-Preemptive)',
    classification: 'Non-Preemptive',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80&grayscale',
    abstract: 'This algorithm assigns an explicit priority integer to each process, allocating the CPU to the highest-priority process until it voluntarily yields or completes.',
    details: 'Priorities can be defined internally (e.g., memory requirements, time limits) or externally (e.g., user importance, department constraints). In the non-preemptive variant, once a process acquires the CPU, it retains control regardless of subsequent arrivals. A major vulnerability is indefinite blocking (starvation) of low-priority processes, typically mitigated by a technique called aging, which gradually increases the priority of waiting processes.',
  },
  {
    id: 'priority_p',
    name: 'Priority Scheduling (Preemptive)',
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
    id: 'hrrn',
    name: 'Highest Response Ratio Next (HRRN)',
    classification: 'Non-Preemptive',
    image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80&grayscale',
    abstract: 'HRRN is a non-preemptive scheduling discipline designed to balance the trade-off between the efficiency of SJF and the fairness of FCFS by dynamically computing a response ratio for every waiting process.',
    details: 'The response ratio is calculated as (waiting time + burst time) / burst time. As a process waits longer, its ratio climbs, eventually rivaling or exceeding that of freshly arrived short jobs. This self-correcting mechanic effectively prevents the indefinite starvation that plagues pure SJF, while still favoring shorter jobs when queue conditions are otherwise equal.',
  },
  {
    id: 'mlq',
    name: 'Multilevel Queue (MLQ)',
    classification: 'Depends',
    image: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&w=800&q=80&grayscale',
    abstract: 'MLQ partitions the ready queue into several distinct sub-queues, permanently assigning processes to a specific queue based on inherent properties like process type or origin.',
    details: 'Each distinct queue possesses its own scheduling algorithm. For instance, foreground (interactive) processes might utilize Round Robin for rapid responsiveness, while background (batch) processes might employ FCFS. Scheduling must also occur between the queues themselves, typically implemented as absolute preemptive priority (e.g., foreground strictly over background) or through proportional time-slicing among the queues.',
  },
  {
    id: 'mlfq',
    name: 'Multilevel Feedback Queue (MLFQ)',
    classification: 'Preemptive',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80&grayscale',
    abstract: 'MLFQ extends the multilevel queue model by allowing processes to migrate between priority tiers based on observed CPU behavior, rather than fixing them to a single queue for their entire lifetime.',
    details: 'New processes enter the topmost queue, which is granted the shortest time quantum. Should a process fail to complete within that slice, it is demoted to a lower-priority queue with a longer quantum, reflecting its classification as more CPU-bound. Interactive, I/O-heavy processes tend to complete quickly within the high-priority tiers and rarely get demoted, giving the scheduler adaptive responsiveness without requiring any prior knowledge of burst lengths.',
  },
  {
    id: 'lottery',
    name: 'Lottery Scheduling',
    classification: 'Preemptive',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80&grayscale',
    abstract: 'Lottery Scheduling reframes CPU allocation as a probabilistic raffle: each process holds a number of tickets proportional to its desired share of the processor, and a winning ticket is drawn at every scheduling decision.',
    details: 'Because selection is randomized, the algorithm avoids the pathological starvation scenarios that can arise in strictly deterministic schedulers, while still honoring proportional shares on average over many rounds. Processes with heavier ticket allocations run more frequently, and additional tickets can be transferred between cooperating processes to implement priority inheritance.',
  },
  {
    id: 'stride',
    name: 'Stride Scheduling',
    classification: 'Preemptive',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80&grayscale',
    abstract: 'Stride Scheduling delivers the same proportional-share guarantees as Lottery Scheduling but replaces randomness with a fully deterministic bookkeeping mechanism.',
    details: 'Every process is assigned a stride value inversely proportional to its ticket count, and a running pass counter that increases by its stride each time it is scheduled. The scheduler always selects the process with the lowest pass value, ensuring that CPU time is distributed with far less variance than the lottery approach while preserving the same proportional-fairness properties.',
  },
  {
    id: 'guaranteed',
    name: 'Guaranteed Scheduling',
    classification: 'Preemptive',
    image: 'https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?auto=format&fit=crop&w=800&q=80&grayscale',
    abstract: 'Guaranteed Scheduling makes an explicit promise to every process: over time, each of the n active processes will receive approximately 1/n of the available CPU time.',
    details: 'The scheduler continuously tracks how much CPU time each process has actually received versus how much it is owed, then dispatches whichever process has fallen furthest behind its guaranteed share. This produces a self-balancing allocation that adapts automatically as processes arrive and depart the system.',
  },
  {
    id: 'fairshare',
    name: 'Fair Share Scheduling',
    classification: 'Preemptive',
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80&grayscale',
    abstract: 'Fair Share Scheduling extends the guaranteed-allocation principle beyond individual processes to groups of processes, ensuring that CPU time is divided fairly among users or departments rather than treating every process as an independent competitor.',
    details: "A user or group that spawns many processes should not be able to dominate the CPU simply by virtue of having more runnable tasks. The scheduler therefore allocates a share to each group first, and only then divides that group's share among its own member processes, preventing any single owner from crowding out others regardless of process count.",
  },
  {
    id: 'edf',
    name: 'Earliest Deadline First (EDF)',
    classification: 'Preemptive',
    image: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&w=800&q=80&grayscale',
    abstract: 'Earliest Deadline First is a dynamic-priority, preemptive scheduling policy built for real-time systems, in which the process with the closest completion deadline is always given the CPU.',
    details: "Priorities are recomputed continuously as deadlines approach, so a process's urgency automatically increases relative to its peers over time. EDF is provably optimal for meeting deadlines on a single processor when total system utilization remains within capacity, though it degrades unpredictably under overload conditions, where multiple deadlines may be missed in a cascading fashion.",
  },
  {
    id: 'rms',
    name: 'Rate Monotonic Scheduling (RMS)',
    classification: 'Preemptive',
    image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80&grayscale',
    abstract: "Rate Monotonic Scheduling assigns fixed, static priorities to periodic real-time tasks based purely on how frequently they must run: the shorter a task's period, the higher its priority.",
    details: 'Because priorities never change once assigned, RMS is simpler to analyze and implement than dynamic schemes like EDF. Its schedulability can be verified in advance using well-established utilization bounds, making it a popular choice for hard real-time systems such as embedded controllers, where predictability and low scheduling overhead are paramount.',
  },
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
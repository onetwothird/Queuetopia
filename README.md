# QueueTopia — CPU Scheduling Simulator

A deterministic CPU scheduling laboratory built with Next.js and TypeScript. QueueTopia lets you queue up processes, run them through fifteen classical and modern scheduling algorithms, and inspect the resulting execution timeline, per-process metrics, and CPU utilization — all computed by a pure, dependency-free simulation engine.

---

## Features

- **15 scheduling algorithms**, all implemented as pure functions over a shared `Process` model — see [Algorithm Reference](#algorithm-reference) below.
- **Tick-accurate Gantt chart** that renders merged execution blocks, idle gaps, and a ruled time axis derived directly from the simulator's timeline output.
- **Live metrics** — average turnaround, average waiting time, total duration, and CPU utilization — computed from the same `SimulationResult` the chart consumes.
- **Context-aware process form**: input fields (priority, queue level, tickets, deadline, period) appear only when the selected algorithm actually uses them.
- **Context-aware time quantum**: the quantum input is only shown for algorithms that schedule on fixed time slices (RR, MLQ, MLFQ, Lottery, Stride, Guaranteed, Fair Share).
- **Round Robin preemption log**: a dedicated view that isolates every forced context switch (a process that exhausts its quantum without finishing).
- A dark, engineering-lab visual identity — IBM Plex Sans/Serif/Mono, a faint blueprint grid, and uppercase tracked labels throughout.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router), React, TypeScript |
| Styling | Tailwind CSS (v4 syntax — arbitrary values, `bg-size-*`, `mask-*`) |
| Animation | Framer Motion |
| Icons | lucide-react |
| Fonts | IBM Plex Sans, IBM Plex Serif, IBM Plex Mono (`next/font/google`) |

---

## Getting Started

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to see the landing page, then visit `/simulator` to open the workspace.

---

## Project Structure

```
app/
├── layout.tsx              # Root layout: fonts, metadata, ambient grid backdrop, <Navigation />
├── page.tsx                # Landing page — hero, architecture/methodology sections, CTA
└── simulator/
    └── page.tsx            # Simulator workspace — wires state, form, table, and chart together

lib/
├── types.ts                # Process, TimelineEvent, SimulationResult, Algorithm types
└── algorithms.ts           # Pure simulation engine — one function per algorithm + dispatcher

components/
├── layout/
│   └── Navigation.tsx
├── simulator/
│   ├── AlgorithmSelect.tsx # Algorithm dropdown + conditional time-quantum input
│   ├── ProcessForm.tsx     # Add-process form; conditionally reveals per-algorithm fields
│   └── ProcessTable.tsx    # Active queue table; columns adapt to the selected algorithm
└── visualizations/
    ├── GanttChart.tsx      # Timeline blocks, ruled time axis, metrics footer
    ├── MetricsDisplay.tsx  # Standalone metrics strip (turnaround / waiting / CPU util)
    └── RrFlow.tsx          # Round Robin preemption log (context-switch events only)
```

---

## How the Simulation Works

Every algorithm operates on the same `Process` shape:

```ts
{
  arrival, burst, priority, queueLevel, remainingBurst,
  tickets?, deadline?, period?   // used only by the algorithms that need them
}
```

...and returns a `SimulationResult`:

```ts
{
  timeline: TimelineEvent[],   // { process: number | 'idle', start, end }[]
  processes: Process[]         // each annotated with completion, turnaround, waiting, response, startTime
}
```

Internally, `lib/algorithms.ts` is organized around a small set of shared runners rather than fifteen bespoke implementations:

- **`simulateFCFS`** — a direct, one-pass arrival-ordered runner.
- **`simulateNonPreemptive`** — a generic engine parameterized by a *selector*; powers **SJF**, **Priority (Non-Preemptive)**, and **HRRN**.
- **`simulatePreemptive`** — a generic 1ms-resolution engine parameterized by a *comparator*; powers **SRTF**, **Priority (Preemptive)**, **EDF**, and **RMS**.
- **Quantum-based runners** — each maintains its own scheduling state (ready queue, pass values, service-received ratios, ticket pools) and advances in slices of the configured time quantum: **Round Robin**, **MLQ**, **MLFQ**, **Lottery**, **Stride**, **Guaranteed**, and **Fair Share**.

Adjacent blocks belonging to the same process (or idle stretches) are merged via `mergeTimeline` before being handed to the UI, so the Gantt chart always renders one continuous block per run instead of many 1ms slivers.

`runSimulation(algorithm, processes, quantum)` is the single entry point the UI calls; it dispatches to the correct function by algorithm key.

---

## Algorithm Reference

| Algorithm | Key | Type | Extra Field(s) Used |
|---|---|---|---|
| First Come First Served | `fcfs` | Non-preemptive | — |
| Shortest Job First | `sjf` | Non-preemptive | — |
| Shortest Remaining Time First | `srtf` | Preemptive (1ms) | — |
| Priority (Non-Preemptive) | `priority_np` | Non-preemptive | Priority *(lower = higher priority)* |
| Priority (Preemptive) | `priority_p` | Preemptive (1ms) | Priority |
| Round Robin | `rr` | Quantum-based | Time Quantum |
| Highest Response Ratio Next | `hrrn` | Non-preemptive | — |
| Multilevel Queue | `mlq` | Quantum-based | Queue Level (Q1 = RR, Q2 = FCFS) |
| Multilevel Feedback Queue | `mlfq` | Quantum-based | 3 tiers, demoted on quantum exhaustion |
| Lottery Scheduling | `lottery` | Quantum-based | Tickets *(seeded PRNG, reproducible)* |
| Stride Scheduling | `stride` | Quantum-based | Tickets *(deterministic proportional share)* |
| Guaranteed Scheduling | `guaranteed` | Quantum-based | — *(targets 1/n CPU share per process)* |
| Fair Share Scheduling | `fairshare` | Quantum-based | Group ID *(priority field repurposed)* |
| Earliest Deadline First | `edf` | Preemptive (1ms) | Deadline *(absolute time)* |
| Rate Monotonic Scheduling | `rms` | Preemptive (1ms) | Period *(shorter period = higher priority)* |

**Metrics** (shown in both `GanttChart` and `MetricsDisplay`):
- **Avg Turnaround** = mean of `completion − arrival` across all processes
- **Avg Waiting** = mean of `turnaround − burst`
- **Total Duration** = end time of the last timeline event
- **CPU Utilization** = `Σ burst / total duration × 100`

---

## Notes on the UI

- `AlgorithmSelect`, `ProcessForm`, and `ProcessTable` all read the same `QUANTUM_ALGORITHMS` / conditional-field logic independently, so every surface stays in sync with whichever algorithm is selected — add a field to `ProcessForm` and a matching column to `ProcessTable` if you introduce a new algorithm parameter.
- `ProcessTable` builds its header and rows from a single `columns` array, so column widths and cell content can never drift apart.
- `RrFlow` is driven purely by the timeline: it flags a block as a forced context switch whenever its duration equals the configured quantum *and* the following block belongs to a different process.

---

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Framer Motion](https://www.framer.com/motion/)

## Deploy on Vercel

The easiest way to deploy this app is via the [Vercel Platform](https://vercel.com/new).

Check the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for details.
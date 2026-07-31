<div align="center">

# QueueTopia

**A deterministic CPU scheduling simulator for the classroom and the lab.**

![Next.js](https://img.shields.io/badge/Next.js-App%20Router-black?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer%20Motion-Animations-EF008F?logo=framer&logoColor=white)

Queue up processes, run them through fifteen scheduling algorithms, and inspect the resulting execution timeline, per-process metrics, and CPU utilization — computed by a pure, dependency-free simulation engine.

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [How the Simulation Works](#how-the-simulation-works)
- [Algorithm Reference](#algorithm-reference)
- [UI Design Notes](#ui-design-notes)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

QueueTopia is a single-core CPU scheduling simulator built to make scheduling theory tangible: define an arrival/burst matrix, pick an algorithm, and watch the resulting dispatch order, idle gaps, and efficiency metrics resolve tick by tick. It's aimed at students validating textbook scheduling behavior and engineers who want a quick, visual sandbox for comparing algorithm trade-offs.

The simulator is deliberately split into two independent halves:

- A **pure computation layer** (`lib/algorithms.ts`) with no framework or UI dependencies — every algorithm is a plain function you could unit test or run in Node on its own.
- A **presentation layer** (`components/`) that renders whatever that layer returns, adapting its inputs and outputs to the selected algorithm.

---

## Features

- **15 scheduling algorithms** spanning non-preemptive, preemptive, and quantum-based proportional-share families — see [Algorithm Reference](#algorithm-reference).
- **Tick-accurate Gantt chart** with merged execution blocks, idle gaps, and a ruled time axis derived directly from the simulator's timeline output.
- **Live metrics** — average turnaround, average waiting time, total duration, and CPU utilization — computed from the same `SimulationResult` the chart consumes.
- **Context-aware process form**: fields like priority, queue level, tickets, deadline, and period appear only when the selected algorithm actually uses them.
- **Context-aware time quantum**: the quantum input only surfaces for algorithms that schedule on fixed time slices (RR, MLQ, MLFQ, Lottery, Stride, Guaranteed, Fair Share).
- **Round Robin preemption log**: an isolated view of every forced context switch — a process that exhausts its quantum without finishing.
- A distinct dark, engineering-lab visual identity — IBM Plex Sans/Serif/Mono, a faint blueprint grid, and uppercase tracked labels throughout.

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

### Prerequisites

- Node.js 18.17 or later
- npm, yarn, pnpm, or bun

### Installation

```bash
git clone <this-repository-url>
cd queuetopia
npm install
```

### Run the dev server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) for the landing page, then visit `/simulator` to open the workspace.

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
  timeline: TimelineEvent[],  
  processes: Process[]         
}
```

Rather than fifteen bespoke implementations, `lib/algorithms.ts` is organized around a small set of shared runners:

| Runner | Parameterized by | Powers |
|---|---|---|
| `simulateFCFS` | — (direct, one-pass) | FCFS |
| `simulateNonPreemptive` | a *selector* function | SJF, Priority (Non-Preemptive), HRRN |
| `simulatePreemptive` | a *comparator*, 1ms resolution | SRTF, Priority (Preemptive), EDF, RMS |
| Dedicated quantum-based runners | own scheduling state (ready queues, pass values, service ratios, ticket pools) | RR, MLQ, MLFQ, Lottery, Stride, Guaranteed, Fair Share |

Adjacent blocks belonging to the same process (or idle stretches) are merged via `mergeTimeline` before reaching the UI, so the Gantt chart always renders one continuous block per run instead of many 1ms slivers.

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

- **Avg Turnaround** — mean of `completion − arrival` across all processes
- **Avg Waiting** — mean of `turnaround − burst`
- **Total Duration** — end time of the last timeline event
- **CPU Utilization** — `Σ burst / total duration × 100`

---

## UI Design Notes

- `AlgorithmSelect`, `ProcessForm`, and `ProcessTable` each read the same conditional-field logic independently, so every surface stays in sync with whichever algorithm is selected. Introducing a new algorithm parameter means adding a field to `ProcessForm` and a matching column to `ProcessTable`.
- `ProcessTable` builds its header and rows from a single `columns` array, so column widths and cell content can never drift apart.
- `RrFlow` is driven purely by the timeline: it flags a block as a forced context switch whenever its duration equals the configured quantum *and* the following block belongs to a different process.

---

## Roadmap

- Wire `RrFlow` and `MetricsDisplay` into `simulator/page.tsx` (currently implemented but not yet rendered there — the page renders `GanttChart` only).
- Unit tests for `lib/algorithms.ts` against known textbook schedules.
- Exportable simulation results (CSV / JSON).

---

## Contributing

Issues and pull requests are welcome. If you're adding a new algorithm:

1. Implement it as a pure function in `lib/algorithms.ts` following the existing runner patterns.
2. Register it in the `runSimulation` dispatcher and `ALGORITHM_OPTIONS` in `AlgorithmSelect.tsx`.
3. Add any new fields it needs to `Process` (`lib/types.ts`), `ProcessForm.tsx`, and `ProcessTable.tsx`.

## License

No license file is currently included in this repository. Add a `LICENSE` file (e.g. MIT, Apache-2.0) before distributing or accepting external contributions.
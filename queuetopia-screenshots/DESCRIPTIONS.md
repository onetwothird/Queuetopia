# QueueTopia — Portfolio Screenshots

**QueueTopia** is an educational CPU-scheduling solver for Operating Systems students. You enter a process table, pick one of fifteen scheduling algorithms, and get a complete step-by-step worked solution: Gantt chart, ready queue, CT/TAT/WT/RT for every process, and the averages, laid out the way it is solved on paper.

**Tech stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Framer Motion · Web Audio API · HTML Canvas

Desktop shots are 1440×900 at 2× resolution. Mobile shots are 390×844 (iPhone-size) at 3×.

---

## Home page

### 01 — Hero section
`01-home-hero.png`
The landing page introduces QueueTopia as a learning tool for OS students. On the right, an animated mini Gantt chart draws its blocks in one by one while a scan line sweeps across the timeline. Behind everything, the interactive canvas background is itself a giant Gantt grid that lights up under the mouse.

### 02 — Stats and algorithm marquee
`02-home-stats-and-marquee.png`
Animated counters (15 algorithms, 5 solution steps, 6 metrics, 100% deterministic) count up when scrolled into view. Below them, a looping marquee lists every supported scheduling discipline.

### 03 — Feature overview
`03-home-feature-overview.png`
The three core ideas: every algorithm in the syllabus, show-your-solution computation tables, and a step-by-step Gantt chart that explains each scheduling decision like a teacher at the board.

### 04 — How it works
`04-home-how-it-works.png`
A three-step guide (choose the algorithm → enter the process table → solve and check your work) set beside a sticky explanation of the single-CPU, ready-queue model used in OS lectures and exams.

### 05 — Algorithm library
`05-home-algorithm-library.png`
All fifteen algorithms grouped into four families: Classic, Time-Slicing & Multilevel, Proportional Share and Real-Time. Each card shows the algorithm's short name, whether it is preemptive, non-preemptive or quantum-based, a summary, and its underlying data structure.

### 06 — Evaluative metrics
`06-home-evaluative-metrics.png`
The four performance formulas the solver computes (turnaround, waiting, response and CPU utilization), each written in proper notation.

---

## Solver (the main feature)

### 07 — Input panel
`07-solver-input-panel.png`
Pick an algorithm, set the time quantum for time-sliced schedulers, and add processes with their arrival and burst times. Extra fields (priority, tickets, deadline, period, queue level) appear only when the chosen algorithm needs them. An "Active Discipline" card explains how the selected algorithm makes its decisions.

### 08 — Step-by-step Gantt chart
`08-solver-step-by-step-gantt.png`
The heart of QueueTopia. Students replay the schedule one decision at a time with VCR-style controls. Each step shows:
- the Gantt chart drawn up to that moment, with the current block highlighted
- arrival markers (▲) under the timeline
- for Round Robin, the ready queue written left to right, with entries crossed out once served
- a plain-language explanation of *why* the scheduler chose that process, plus the CPU and ready-queue state, including events such as "quantum expired" and "arrives"

### 09 — Remaining-burst trace
`09-solver-remaining-burst-trace.png`
For preemptive and time-sliced algorithms, a table tracks every process's remaining burst at each checkpoint. The process holding the CPU is shown in bold, and finished processes turn green, just like the trace table students draw by hand.

### 10 — Completed Gantt chart
`10-solver-completed-gantt.png`
The finished Gantt chart with every block, tick mark and the full ready-queue history, ready to copy into an answer sheet.

### 11 — Computation table
`11-solver-computation-table.png`
For each process, the solver writes out the working rather than just the answer: TAT = CT − AT, WT = TAT − BT and RT = first run − AT, with totals at the bottom.

### 12 — Averages
`12-solver-averages.png`
Average turnaround, waiting and response time, CPU utilization, throughput and idle time. Each one shows the full fraction, e.g. (16 + 10 + 18 + 14 + 7) / 5, so students can check their arithmetic.

### 13 — Full worked solution
`13-solver-full-worked-solution.png`
The complete solution on one page: Gantt chart → remaining-burst trace → per-process computations → averages.

---

## Study guide

### 14 — Study guide overview
`14-study-guide-overview.png`
A long-form reference page with a sticky reading timeline on the right. The timeline tracks reading progress, highlights the section in view, and jumps to any algorithm on click.

### 15 — Metric formulas
`15-study-guide-metric-formulas.png`
Definitions of each evaluative metric with its formula, explaining what each one measures and why scheduling policies affect it.

### 16 — Algorithm reading
`16-study-guide-algorithm-reading.png`
Each algorithm gets its own article: a summary, a detailed explanation (convoy effect, starvation, aging, quantum sizing and more), its data structure, and a "Run in Simulator" button that opens the solver with that algorithm preselected.

### 17 — Comparison matrix
`17-study-guide-comparison-matrix.png`
A quick-reference table comparing all fifteen algorithms by family, scheduling kind, governing mechanism and whether a time quantum is used.

---

## Interaction details

### 18 — Custom cursor effect
`18-cursor-effect.png`
A selection-frame cursor that follows the pointer and snaps around buttons and links, like a window manager focusing a target. It switches off automatically on touch screens and for visitors who prefer reduced motion.

### 19 — System tray
`19-system-tray.png`
A taskbar-style tray pinned to the corner of every page, with a sound toggle (interface beeps synthesized live with the Web Audio API, no audio files), a cursor-effect toggle and a clock. Preferences are saved in the browser.

---

## Mobile (responsive design)

### 20 — Mobile home
`20-mobile-home.png`
The hero section adapted for phones, with the headline, description and call-to-action buttons reflowed for a narrow screen.

### 21 — Mobile menu
`21-mobile-menu.png`
A full-screen slide-down navigation menu for small screens.

### 22 — Mobile solver
`22-mobile-solver.png`
The step-by-step worked solution on a phone. Wide content such as the Gantt chart and ready queue scrolls sideways inside its own panel, so the page itself never overflows.

### 23 — Mobile study guide contents
`23-mobile-study-guide-contents.png`
On phones, the desktop reading timeline becomes a sticky "Contents" bar showing the current section and reading progress. Tapping it opens the full table of contents.

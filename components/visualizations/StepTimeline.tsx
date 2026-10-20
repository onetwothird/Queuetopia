"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ScheduleStep } from '@/lib/types';

const PROCESS_COLORS = [
  'bg-white text-black',
  'bg-[#3b82f6] text-white',
  'bg-[#10b981] text-white',
  'bg-[#f43f5e] text-white',
  'bg-[#f59e0b] text-white',
  'bg-[#8b5cf6] text-white',
];

function colorFor(process: number | 'idle'): string {
  if (process === 'idle') return 'bg-[#0a0a0a] text-white/30';
  return PROCESS_COLORS[(process as number) % PROCESS_COLORS.length];
}

function dotColorFor(process: number): string {
  return PROCESS_COLORS[process % PROCESS_COLORS.length].split(' ')[0];
}

interface StepTimelineProps {
  steps: ScheduleStep[];
  totalTime: number;
  timeSteps: number[];
}

export default function StepTimeline({
  steps,
  totalTime,
}: StepTimelineProps) {
  const [activeStepIdx, setActiveStepIdx] = useState<number>(
    steps ? steps.length - 1 : 0
  );

  if (!steps || steps.length === 0) return null;

  const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
  const clampedIdx = Math.min(Math.max(activeStepIdx, 0), steps.length - 1);
  const currentStep = steps[clampedIdx];

  return (
    <div className="bg-transparent border border-white/10 mt-6 sm:mt-8 overflow-hidden">
      <div className="p-4 sm:p-6 md:p-8">
        {/* Responsive Header & Interactive Step Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">
              Step-by-Step Manual Execution Walkthrough
            </h2>
            <p className="text-[10px] sm:text-[11px] text-white/40 font-mono mt-1">
              Tap any Gantt block or use the step controls to trace each scheduling decision by hand
            </p>
          </div>

          {/* Mobile-responsive control bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 font-mono text-[10px] w-full lg:w-auto">
            <div className="px-3 py-1.5 bg-white/10 border border-white/20 text-white font-bold text-center whitespace-nowrap">
              Step {clampedIdx + 1} / {steps.length} (t={currentStep.time}ms →{' '}
              {currentStep.endTime}ms)
            </div>

            <div className="grid grid-cols-4 sm:flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveStepIdx(0)}
                disabled={clampedIdx === 0}
                className="px-2 sm:px-2.5 py-1.5 border border-white/15 bg-[#0a0a0a] text-white/70 hover:text-white disabled:opacity-30 text-center whitespace-nowrap"
              >
                ⏮ t=0
              </button>
              <button
                type="button"
                onClick={() => setActiveStepIdx((i) => Math.max(0, i - 1))}
                disabled={clampedIdx === 0}
                className="px-2 sm:px-2.5 py-1.5 border border-white/15 bg-[#0a0a0a] text-white/70 hover:text-white disabled:opacity-30 text-center whitespace-nowrap"
              >
                ◀ Prev
              </button>
              <button
                type="button"
                onClick={() =>
                  setActiveStepIdx((i) => Math.min(steps.length - 1, i + 1))
                }
                disabled={clampedIdx === steps.length - 1}
                className="px-2 sm:px-2.5 py-1.5 border border-white/15 bg-[#0a0a0a] text-white/70 hover:text-white disabled:opacity-30 text-center whitespace-nowrap"
              >
                Next ▶
              </button>
              <button
                type="button"
                onClick={() => setActiveStepIdx(steps.length - 1)}
                disabled={clampedIdx === steps.length - 1}
                className="px-2 sm:px-2.5 py-1.5 border border-white/15 bg-[#0a0a0a] text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-30 text-center whitespace-nowrap"
              >
                All ({totalTime}ms)
              </button>
            </div>
          </div>
        </div>

        {/* Step-by-Step Manual Worksheet Track */}
        <div className="overflow-x-auto overscroll-x-contain pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div
            className="min-w-full"
            style={{ minWidth: `${Math.max(steps.length * 88, 520)}px` }}
          >
            {/* Unmerged Gantt boxes up to clampedIdx */}
            <div className="flex w-full h-12 sm:h-14 border border-white/20 bg-[#0a0a0a]">
              {steps.map((step, idx) => {
                const isRevealed = idx <= clampedIdx;
                const isSelected = idx === clampedIdx;
                const duration = step.endTime - step.time;

                return (
                  <button
                    key={step.index}
                    type="button"
                    onClick={() => setActiveStepIdx(idx)}
                    style={{
                      flexGrow: Math.max(duration, 1),
                      flexBasis: '78px',
                    }}
                    className={`relative flex flex-col items-center justify-center border-r border-[#050505] last:border-0 px-1 transition-all ${
                      isRevealed
                        ? colorFor(step.running)
                        : 'bg-[#050505] text-white/15'
                    } ${
                      isSelected
                        ? 'ring-2 ring-white z-10'
                        : 'hover:opacity-90'
                    }`}
                  >
                    <div className="flex items-center gap-1 font-mono text-[11px] sm:text-xs font-bold whitespace-nowrap">
                      <span>
                        {step.running === 'idle' ? 'IDLE' : `P${step.running}`}
                      </span>
                      {step.sliceEnd === 'completed' && (
                        <span className="text-[9px] sm:text-[10px] text-emerald-300">
                          ✓
                        </span>
                      )}
                      {step.sliceEnd === 'quantum' && (
                        <span className="text-[8px] sm:text-[9px] px-1 bg-black/30 rounded">
                          Q
                        </span>
                      )}
                      {step.sliceEnd === 'awaiting-arrival' && (
                        <span className="text-[9px] sm:text-[10px] text-sky-300">
                          ⋯
                        </span>
                      )}
                    </div>
                    <span className="text-[8px] sm:text-[9px] font-mono opacity-65 whitespace-nowrap">
                      {step.time} → {step.endTime}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Vertical Candidate / Ready Queue Stacks under each step timestamp */}
            <div className="flex w-full items-start pt-1">
              {steps.map((step, idx) => {
                const isRevealed = idx <= clampedIdx;
                const isSelected = idx === clampedIdx;
                const duration = step.endTime - step.time;
                const isLast = idx === steps.length - 1;

                return (
                  <div
                    key={`step-col-${step.index}`}
                    style={{
                      flexGrow: Math.max(duration, 1),
                      flexBasis: '78px',
                    }}
                    className={`flex justify-between transition-opacity ${
                      isRevealed ? 'opacity-100' : 'opacity-25'
                    }`}
                  >
                    <div className="flex flex-col items-start">
                      <div className="w-px h-2.5 bg-white/40" />
                      <span
                        className={`text-[11px] sm:text-xs font-mono font-bold mt-0.5 ${
                          isSelected ? 'text-amber-400' : 'text-white/80'
                        }`}
                      >
                        {step.time}
                      </span>

                      {/* Ready Queue Candidates stacked vertically */}
                      <div className="mt-2 flex flex-col gap-1 pr-1.5">
                        {step.candidates && step.candidates.length > 0 ? (
                          step.candidates.map((cand) => {
                            const isWinner = cand.id === step.chosen;
                            const isNew = step.arrivals.includes(cand.id);
                            return (
                              <div
                                key={cand.id}
                                onClick={() => setActiveStepIdx(idx)}
                                className={`cursor-pointer px-1.5 py-0.5 rounded-sm font-mono text-[9px] sm:text-[10px] border transition-colors whitespace-nowrap ${
                                  isWinner
                                    ? 'bg-white/15 border-white/50 text-white font-bold'
                                    : 'bg-white/2 border-white/10 text-white/50'
                                }`}
                                title={cand.detail}
                              >
                                <div className="flex items-center gap-1">
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColorFor(
                                      cand.id
                                    )}`}
                                  />
                                  <span>P{cand.id}</span>
                                  {isNew && step.time > 0 && (
                                    <span className="text-[8px] text-sky-400">
                                      +
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <span className="text-[9px] font-mono text-white/30">
                            IDLE
                          </span>
                        )}
                      </div>
                    </div>

                    {isLast && (
                      <div className="flex flex-col items-end">
                        <div className="w-px h-2.5 bg-white/40" />
                        <span className="text-[11px] sm:text-xs font-mono font-bold text-emerald-400 mt-0.5">
                          {step.endTime}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Active Step Manual Decision Breakdown Card */}
        <motion.div
          key={`detail-${currentStep.index}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: EASE }}
          className="mt-4 sm:mt-6 p-3.5 sm:p-4 border border-white/15 bg-white/2 font-mono text-xs space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 bg-white text-black font-bold text-[10px]">
                t = {currentStep.time}ms
              </span>
              <span className="text-white font-bold text-[11px] sm:text-xs">
                {currentStep.running === 'idle'
                  ? 'CPU IDLE'
                  : `Run P${currentStep.running} (${currentStep.time}ms → ${currentStep.endTime}ms, -${
                      currentStep.endTime - currentStep.time
                    }ms BT)`}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[10px]">
              {currentStep.arrivals.length > 0 && (
                <span className="text-sky-400">
                  Arrived at t={currentStep.time}:{' '}
                  {currentStep.arrivals.map((id) => `P${id}`).join(', ')}
                </span>
              )}
              {currentStep.preempted !== null && (
                <span className="text-amber-400">
                  Preempted: P{currentStep.preempted}
                </span>
              )}
            </div>
          </div>

          <p className="text-white/70 text-[10px] sm:text-[11px] leading-relaxed">
            <strong className="text-white uppercase tracking-wider text-[9px] sm:text-[10px] mr-2">
              Manual Check Reason:
            </strong>
            {currentStep.reason}
          </p>

          {currentStep.candidates.length > 0 && (
            <div>
              <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-white/40 mb-2">
                Active Processes in RAM at t = {currentStep.time}ms:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {currentStep.candidates.map((c) => {
                  const isChosen = c.id === currentStep.chosen;
                  return (
                    <div
                      key={c.id}
                      className={`px-3 py-2 border text-[10px] sm:text-[11px] flex items-center justify-between gap-2 ${
                        isChosen
                          ? 'border-white/50 bg-white/10 text-white font-bold'
                          : 'border-white/10 bg-[#0a0a0a] text-white/60'
                      }`}
                    >
                      <span className="truncate">
                        {isChosen ? '▸ ' : '• '}P{c.id} — {c.detail}
                      </span>
                      {isChosen && (
                        <span className="text-[8px] sm:text-[9px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 uppercase shrink-0">
                          Chosen
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
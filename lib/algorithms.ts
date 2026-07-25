import { Process, SimulationResult, TimelineEvent } from './types';

export function simulateFCFS(processes: Process[]): SimulationResult {
    const sortedProcesses = [...processes].map(p => ({...p})).sort((a, b) => {
        if (a.arrival === b.arrival) return a.id - b.id; 
        return a.arrival - b.arrival;
    });
    
    let currentTime = 0;
    const timeline: TimelineEvent[] = [];

    sortedProcesses.forEach(process => {
        if (currentTime < process.arrival) currentTime = process.arrival;
        if (process.startTime === -1) {
            process.startTime = currentTime;
            process.response = currentTime - process.arrival;
        }

        timeline.push({ process: process.id, start: currentTime, end: currentTime + process.burst });

        process.completion = currentTime + process.burst;
        process.turnaround = process.completion - process.arrival;
        process.waiting = process.turnaround - process.burst;
        currentTime = process.completion;
    });

    return { timeline, processes: sortedProcesses };
}

// TODO: Paste simulateSJF, simulatePriorityP, simulateSRTF, simulatePriorityNP, simulateRR, simulateMLQ here.
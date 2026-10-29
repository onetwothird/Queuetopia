"use client";

import { useEffect, useRef } from 'react';

const CELL = 48;
const BRUSH = 2.2; // radius, in cells, of the trail the pointer leaves
const DECAY = 0.97; // per-frame heat falloff
const BURST_EVERY = 2600; // ms between ambient "process bursts"

// The page background is drawn as a giant Gantt chart: every row is a process
// and every column a time unit. Moving the pointer lights up the cells under it,
// and every few seconds a short burst runs along a random row the way a
// dispatched process fills its slot. It stays monochrome so it never competes
// with the colored charts in front of it. Static grid only when the visitor
// prefers reduced motion.
export default function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let cols = 0;
    let rows = 0;
    let width = 0;
    let height = 0;
    let heat = new Float32Array(0);
    const active = new Set<number>();
    let bursts: { row: number; col: number; length: number; progress: number }[] = [];
    let frame = 0;
    let lastBurst = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(width / CELL) + 1;
      rows = Math.ceil(height / CELL) + 1;
      heat = new Float32Array(cols * rows);
      active.clear();
      bursts = [];
      draw();
    };

    const drawGrid = () => {
      // Grid lines fade out toward the bottom of the viewport.
      for (let x = 0; x <= width; x += CELL) {
        const g = ctx.createLinearGradient(0, 0, 0, height);
        g.addColorStop(0, 'rgba(255,255,255,0.05)');
        g.addColorStop(0.75, 'rgba(255,255,255,0.012)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = g;
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += CELL) {
        const a = 0.05 * Math.max(0, 1 - y / height) + 0.008;
        ctx.strokeStyle = `rgba(255,255,255,${a})`;
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(width, y + 0.5);
        ctx.stroke();
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      drawGrid();
      active.forEach((i) => {
        const h = heat[i];
        const row = Math.floor(i / cols);
        const col = i % cols;
        const a = Math.min(h, 1);
        ctx.fillStyle = `rgba(226,232,240,${a * 0.035})`;
        ctx.fillRect(col * CELL + 1, row * CELL + 1, CELL - 1, CELL - 1);
        ctx.strokeStyle = `rgba(226,232,240,${a * 0.14})`;
        ctx.strokeRect(col * CELL + 1.5, row * CELL + 1.5, CELL - 2, CELL - 2);
      });
    };

    const heatCell = (col: number, row: number, amount: number) => {
      if (col < 0 || row < 0 || col >= cols || row >= rows) return;
      const i = row * cols + col;
      heat[i] = Math.min(1, heat[i] + amount);
      active.add(i);
    };

    const tick = (now: number) => {
      frame = 0;
      if (document.hidden) return;

      if (now - lastBurst > BURST_EVERY) {
        lastBurst = now;
        bursts.push({
          row: Math.floor(Math.random() * rows),
          col: Math.floor(Math.random() * Math.max(1, cols - 6)),
          length: 3 + Math.floor(Math.random() * 5),
          progress: 0,
        });
      }
      bursts = bursts.filter((b) => {
        b.progress += 0.12;
        const filled = Math.min(b.length, Math.floor(b.progress));
        for (let c = 0; c < filled; c++) heatCell(b.col + c, b.row, 0.05);
        return b.progress < b.length + 1;
      });

      active.forEach((i) => {
        heat[i] *= DECAY;
        if (heat[i] < 0.02) {
          heat[i] = 0;
          active.delete(i);
        }
      });

      draw();
      frame = requestAnimationFrame(tick);
    };

    const start = () => {
      if (!frame && !reduced) frame = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      if (reduced) return;
      const cx = e.clientX / CELL;
      const cy = e.clientY / CELL;
      const r = Math.ceil(BRUSH);
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const col = Math.floor(cx) + dx;
          const row = Math.floor(cy) + dy;
          const dist = Math.hypot(col + 0.5 - cx, row + 0.5 - cy);
          if (dist < BRUSH) heatCell(col, row, 0.3 * (1 - dist / BRUSH));
        }
      }
      start();
    };

    // A click "dispatches" the row under the pointer: a burst runs from there.
    const onDown = (e: PointerEvent) => {
      if (reduced) return;
      bursts.push({
        row: Math.floor(e.clientY / CELL),
        col: Math.floor(e.clientX / CELL),
        length: 6,
        progress: 0,
      });
      start();
    };

    const onVisibility = () => {
      if (!document.hidden) start();
    };

    resize();
    start();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0" aria-hidden="true" />;
}

"use client";

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Cpu, Rows3, Gauge, Timer } from 'lucide-react';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/simulator', label: 'Solver' },
  { href: '/resources', label: 'Study Guide' },
];

const COURSE_TOPICS = [
  { icon: Cpu, label: 'CPU Scheduling' },
  { icon: Rows3, label: 'Gantt Charts' },
  { icon: Timer, label: 'Ready Queues' },
  { icon: Gauge, label: 'Performance Metrics' },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#070707]">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-12 gap-12 sm:gap-10 xl:gap-16">
          {/* Brand */}
          <div className="sm:col-span-3 lg:col-span-5">
            <Link href="/" className="inline-flex items-center">
              <Image
                src="/logo.png"
                alt="QueueTopia Logo"
                width={160}
                height={160}
                className="w-28 h-auto object-contain opacity-90"
              />
            </Link>
            <p className="mt-6 text-sm text-white/50 leading-relaxed max-w-sm">
              A study companion for Operating Systems students. Enter the process
              table from your exercise, pick an algorithm, and follow a complete
              worked solution — Gantt chart, ready queue, and every CT, TAT, WT
              and RT computation — exactly as you would write it on paper.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <Link
                href="/simulator"
                className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase text-white border border-white/20 px-5 py-3 w-fit hover:bg-white hover:text-black transition-colors"
              >
                Solve a Problem
                <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </Link>
            </div>
          </div>

          {/* Navigation */}
          <div className="min-w-0 lg:col-span-3">
            <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/40 mb-6">
              Navigate
            </h3>
            <ul className="space-y-4">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
                  >
                    <span className="w-0 group-hover:w-4 h-px bg-white/60 transition-all duration-300" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Algorithm coverage */}
          <div className="min-w-0 lg:col-span-2">
            <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/40 mb-6">
              Algorithm Families
            </h3>
            <ul className="space-y-4 text-sm text-white/60">
              <li>Classic Disciplines</li>
              <li>Time-Slicing &amp; Multilevel</li>
              <li>Proportional Share</li>
              <li>Real-Time Scheduling</li>
            </ul>
          </div>

          {/* Stack */}
          <div className="min-w-0 lg:col-span-2">
            <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/40 mb-6">
              Course Topics
            </h3>
            <ul className="space-y-4">
              {COURSE_TOPICS.map((item) => (
                <li key={item.label} className="flex items-center gap-2 text-sm text-white/60">
                  <item.icon className="w-3.5 h-3.5 text-white/30 shrink-0" strokeWidth={1.5} />
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="text-[10px] tracking-[0.2em] uppercase text-white/30">
            © {new Date().getFullYear()} QueueTopia — Learning Operating Systems
          </p>
          <p className="font-mono text-[10px] text-white/30">
            FCFS · SJF · SRTF · ROUND ROBIN · MLFQ · EDF · RMS + 8 MORE
          </p>
        </div>
      </div>
    </footer>
  );
}
import './global.css';
import type { Metadata } from 'next';
import { IBM_Plex_Sans, IBM_Plex_Serif, IBM_Plex_Mono } from 'next/font/google';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import ScrollProgress from '@/components/layout/ScrollProgress';

const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-sans',
});

const plexSerif = IBM_Plex_Serif({
  subsets: ['latin'],
  weight: ['500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-plex-serif',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-mono',
});

export const metadata: Metadata = {
  title: 'QueueTopia — CPU Scheduling Simulator',
  description:
    'Deterministic CPU scheduling simulator: queue up processes and run them through 15 algorithms — FCFS, SJF, SRTF, Priority, Round Robin, MLFQ, Lottery, EDF, RMS and more — then inspect Gantt timelines, per-process metrics, and CPU utilization.',
  icons: {
    icon: '/logo.png?v=2',
    apple: '/logo.png?v=2',
  },
  openGraph: {
    title: 'QueueTopia — CPU Scheduling Simulator',
    description:
      'A deterministic CPU scheduling simulator with 15 algorithms, tick-accurate Gantt charts, and per-process metrics.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${plexSans.variable} ${plexSerif.variable} ${plexMono.variable} font-sans min-h-screen antialiased bg-[#050505] text-white selection:bg-white selection:text-black`}
      >
        <div className="fixed inset-0 -z-10 pointer-events-none" aria-hidden="true">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_12%_-10%,rgba(59,130,246,0.14),transparent_60%),radial-gradient(ellipse_60%_45%_at_95%_105%,rgba(16,185,129,0.10),transparent_60%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-size-[3rem_3rem] mask-[radial-gradient(ellipse_100%_75%_at_50%_0%,#000_45%,transparent_100%)]" />
        </div>
        <ScrollProgress />
        <Navigation />
        {children}
        <Footer />
      </body>
    </html>
  );
}
import './global.css';
import type { Metadata } from 'next';
import { IBM_Plex_Sans, IBM_Plex_Serif, IBM_Plex_Mono } from 'next/font/google';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import ScrollProgress from '@/components/layout/ScrollProgress';
import { SystemPrefsProvider } from '@/components/system/SystemPrefs';
import CursorEffect from '@/components/system/CursorEffect';
import SystemTray from '@/components/system/SystemTray';
import InteractiveBackground from '@/components/system/InteractiveBackground';

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
  title: 'QueueTopia — Learn CPU Scheduling Step by Step',
  description:
    'An educational CPU scheduling solver for Operating Systems students. Enter a process table, choose FCFS, SJF, SRTF, Priority, Round Robin, MLFQ, EDF, RMS and more, and get a complete worked solution: Gantt chart, ready queue, CT, TAT, WT, RT and averages.',
  icons: {
    icon: '/logo.png?v=2',
    apple: '/logo.png?v=2',
  },
  openGraph: {
    title: 'QueueTopia — Learn CPU Scheduling Step by Step',
    description:
      'Worked, step-by-step CPU scheduling solutions for Operating Systems students: Gantt charts, ready queues, and every metric computed by hand.',
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
          <InteractiveBackground />
        </div>
        <SystemPrefsProvider>
          <ScrollProgress />
          <Navigation />
          {children}
          <Footer />
          <SystemTray />
          <CursorEffect />
        </SystemPrefsProvider>
      </body>
    </html>
  );
}
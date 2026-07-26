import './global.css';
import type { Metadata } from 'next';
import { IBM_Plex_Sans, IBM_Plex_Serif, IBM_Plex_Mono } from 'next/font/google';
import Navigation from '@/components/layout/Navigation';

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
    'Queue up processes, run them through FCFS, SJF, SRTF, Priority, or Round Robin, and see the resulting schedule, waiting times, and CPU utilization.',
  icons: {
    // The ?v=2 forces the browser to ignore its cache and fetch the new image
    icon: '/logo.png?v=2', 
    apple: '/logo.png?v=2', 
  },
  openGraph: {
    images: ['/logo.png'], 
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${plexSans.variable} ${plexSerif.variable} ${plexMono.variable} font-sans min-h-screen antialiased bg-[#050505] text-white selection:bg-white selection:text-black`}
      >
        {/* Ambient backdrop: soft processor-glow blooms + engineering grid, fixed behind all content.
            Every card in the app is bg-transparent, so this reads through all of them. */}
        <div className="fixed inset-0 -z-10 pointer-events-none" aria-hidden="true">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_12%_-10%,rgba(59,130,246,0.14),transparent_60%),radial-gradient(ellipse_60%_45%_at_95%_105%,rgba(16,185,129,0.10),transparent_60%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-size-[3rem_3rem] mask-[radial-gradient(ellipse_100%_75%_at_50%_0%,#000_45%,transparent_100%)]" />
        </div>
        <Navigation />
        {children}
      </body>
    </html>
  );
}
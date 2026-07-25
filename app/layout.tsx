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
        <Navigation />
        {children}
      </body>
    </html>
  );
}
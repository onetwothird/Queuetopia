"use client";

import { useEffect, useState } from 'react';
import { Volume2, VolumeX, Crosshair } from 'lucide-react';
import { useSystemPrefs } from './SystemPrefs';

// A taskbar-style tray pinned to the corner: the sound and cursor-effect
// switches stay reachable on every page, even after the navigation hides.
export default function SystemTray() {
  const { sound, cursor, toggleSound, toggleCursor } = useSystemPrefs();
  const [clock, setClock] = useState('');

  useEffect(() => {
    const tick = () =>
      setClock(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    tick();
    const id = window.setInterval(tick, 15_000);
    return () => window.clearInterval(id);
  }, []);

  const base =
    'w-9 h-9 inline-flex items-center justify-center transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-white';

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center border border-white/15 bg-[#050505]/85 backdrop-blur-md">
      <button
        type="button"
        onClick={toggleSound}
        aria-pressed={sound}
        aria-label={sound ? 'Turn sound off' : 'Turn sound on'}
        title={sound ? 'Sound on' : 'Sound off'}
        data-sound="custom"
        className={`${base} ${sound ? 'text-white bg-white/10' : 'text-white/45 hover:text-white'}`}
      >
        {sound ? <Volume2 className="w-4 h-4" strokeWidth={1.5} /> : <VolumeX className="w-4 h-4" strokeWidth={1.5} />}
      </button>
      <button
        type="button"
        onClick={toggleCursor}
        aria-pressed={cursor}
        aria-label={cursor ? 'Turn cursor effect off' : 'Turn cursor effect on'}
        title={cursor ? 'Cursor effect on' : 'Cursor effect off'}
        className={`${base} hidden md:inline-flex border-l border-white/10 ${cursor ? 'text-white bg-white/10' : 'text-white/45 hover:text-white'}`}
      >
        <Crosshair className="w-4 h-4" strokeWidth={1.5} />
      </button>
      <span className="px-3 font-mono text-[11px] text-white/55 border-l border-white/10 h-9 inline-flex items-center tabular-nums" suppressHydrationWarning>
        {clock || '--:--'}
      </span>
    </div>
  );
}

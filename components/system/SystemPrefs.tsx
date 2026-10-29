"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';

// Interface sounds are synthesised with the Web Audio API — short square and
// sine blips modelled on hardware beeps — so the site ships no audio files.
export type SoundName = 'click' | 'step' | 'back' | 'solve' | 'toggle';

interface SystemPrefs {
  sound: boolean;
  cursor: boolean;
  toggleSound: () => void;
  toggleCursor: () => void;
  /** `pitch` nudges the tone upward, e.g. by step index while solving. */
  play: (name: SoundName, pitch?: number) => void;
}

const SystemPrefsContext = createContext<SystemPrefs | null>(null);

const STORAGE_KEY = 'queuetopia:prefs';
const DEFAULT_PREFS = '{"sound":false,"cursor":true}';

// Preferences live in localStorage and are read through useSyncExternalStore,
// so the server renders the defaults and the client picks up the stored value
// without a hydration mismatch. `memory` covers browsers that block storage.
let memory = DEFAULT_PREFS;
const listeners = new Set<() => void>();

function readSnapshot(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? memory;
  } catch {
    return memory;
  }
}

function writePrefs(next: { sound: boolean; cursor: boolean }) {
  memory = JSON.stringify(next);
  try {
    window.localStorage.setItem(STORAGE_KEY, memory);
  } catch {
    // Preference simply won't survive a reload.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

function parsePrefs(raw: string): { sound: boolean; cursor: boolean } {
  try {
    const parsed = JSON.parse(raw);
    return { sound: parsed.sound === true, cursor: parsed.cursor !== false };
  } catch {
    return { sound: false, cursor: true };
  }
}

export function SystemPrefsProvider({ children }: { children: React.ReactNode }) {
  const raw = useSyncExternalStore(subscribe, readSnapshot, () => DEFAULT_PREFS);
  const prefs = useMemo(() => parsePrefs(raw), [raw]);
  const ctxRef = useRef<AudioContext | null>(null);
  const soundRef = useRef(prefs.sound);

  useEffect(() => {
    soundRef.current = prefs.sound;
  }, [prefs.sound]);

  const beep = useCallback((name: SoundName, pitch = 0) => {
    if (typeof window === 'undefined') return;
    if (!ctxRef.current) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      ctxRef.current = new Ctor();
    }
    const ctx = ctxRef.current;
    if (ctx.state === 'suspended') void ctx.resume();

    const tone = (freq: number, at: number, length: number, type: OscillatorType, volume: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t0 = ctx.currentTime + at;
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + length);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + length + 0.02);
    };

    switch (name) {
      case 'click':
        tone(1320, 0, 0.035, 'square', 0.025);
        break;
      case 'step':
        tone(660 * Math.pow(2, Math.min(pitch, 24) / 24), 0, 0.07, 'triangle', 0.08);
        break;
      case 'back':
        tone(520, 0, 0.06, 'triangle', 0.06);
        break;
      case 'solve':
        tone(784, 0, 0.12, 'sine', 0.09);
        tone(1046.5, 0.09, 0.16, 'sine', 0.09);
        tone(1568, 0.18, 0.22, 'sine', 0.06);
        break;
      case 'toggle':
        tone(880, 0, 0.05, 'square', 0.03);
        tone(1320, 0.05, 0.06, 'square', 0.03);
        break;
    }
  }, []);

  const play = useCallback(
    (name: SoundName, pitch?: number) => {
      if (soundRef.current) beep(name, pitch);
    },
    [beep]
  );

  const toggleSound = useCallback(() => {
    const next = { ...prefs, sound: !prefs.sound };
    soundRef.current = next.sound;
    writePrefs(next);
    if (next.sound) beep('toggle');
  }, [prefs, beep]);

  const toggleCursor = useCallback(() => {
    const next = { ...prefs, cursor: !prefs.cursor };
    writePrefs(next);
  }, [prefs]);

  // A soft key click on every button and link. Controls that play their own
  // sound opt out with data-sound="custom".
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (!soundRef.current) return;
      const target = !(e.target instanceof Element) ? null : e.target.closest('a, button, select, [role="button"], input[type="checkbox"]');
      if (!target || target.closest('[data-sound="custom"]') || (target as HTMLButtonElement).disabled) return;
      beep('click');
    };
    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, [beep]);

  const value = useMemo(
    () => ({ ...prefs, toggleSound, toggleCursor, play }),
    [prefs, toggleSound, toggleCursor, play]
  );

  return <SystemPrefsContext.Provider value={value}>{children}</SystemPrefsContext.Provider>;
}

export function useSystemPrefs(): SystemPrefs {
  const ctx = useContext(SystemPrefsContext);
  if (!ctx) throw new Error('useSystemPrefs must be used inside SystemPrefsProvider');
  return ctx;
}

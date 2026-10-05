"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const ACTIVITY_KEY = "mc-last-activity";
const ACTIVITY_EVENTS = [
  "pointerdown",
  "pointermove",
  "keydown",
  "wheel",
  "scroll",
  "touchstart",
] as const;

/** Writing storage on every mouse move would be wasteful. */
const WRITE_EVERY_MS = 5_000;

function readLastActivity(): number | null {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function writeLastActivity(at: number) {
  try {
    localStorage.setItem(ACTIVITY_KEY, String(at));
  } catch {
    /* storage unavailable: this tab still tracks its own activity */
  }
}

interface Options {
  /** Only run while someone is actually signed in. */
  enabled: boolean;
  /** Inactivity before sign-out. */
  idleMs: number;
  /** How long before that the warning shows. */
  warnMs: number;
  onTimeout: () => void;
}

/**
 * Signs a person out after a stretch with no input, with a warning first.
 *
 * Activity is shared across tabs through localStorage, so working in one tab
 * keeps the others alive — otherwise a quiet second tab would sign her out
 * mid-shift. The check still works when timers are throttled in a
 * background tab, because it compares clock time rather than counting ticks.
 */
export function useIdleTimeout({
  enabled,
  idleMs,
  warnMs,
  onTimeout,
}: Options) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const lastLocal = useRef(0);
  const lastWrite = useRef(0);
  const onTimeoutRef = useRef(onTimeout);

  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  const touch = useCallback(() => {
    const now = Date.now();
    lastLocal.current = now;
    if (now - lastWrite.current > WRITE_EVERY_MS) {
      lastWrite.current = now;
      writeLastActivity(now);
    }
  }, []);

  /** An explicit "stay signed in": always counts, and writes at once. */
  const stay = useCallback(() => {
    const now = Date.now();
    lastLocal.current = now;
    lastWrite.current = now;
    writeLastActivity(now);
    setSecondsLeft(null);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const start = Date.now();
    lastLocal.current = start;
    lastWrite.current = start;
    writeLastActivity(start);

    for (const e of ACTIVITY_EVENTS) {
      window.addEventListener(e, touch, { passive: true });
    }

    let fired = false;
    const tick = () => {
      if (fired) return;
      const last = Math.max(lastLocal.current, readLastActivity() ?? 0);
      const idleFor = Date.now() - last;

      if (idleFor >= idleMs) {
        fired = true;
        setSecondsLeft(0);
        onTimeoutRef.current();
      } else if (idleFor >= idleMs - warnMs) {
        setSecondsLeft(Math.ceil((idleMs - idleFor) / 1000));
      } else {
        setSecondsLeft((s) => (s === null ? s : null));
      }
    };

    const id = window.setInterval(tick, 1000);
    // A laptop waking from sleep should decide at once, not a second later.
    document.addEventListener("visibilitychange", tick);

    return () => {
      for (const e of ACTIVITY_EVENTS) window.removeEventListener(e, touch);
      document.removeEventListener("visibilitychange", tick);
      window.clearInterval(id);
    };
  }, [enabled, idleMs, warnMs, touch]);

  return { secondsLeft, stay };
}

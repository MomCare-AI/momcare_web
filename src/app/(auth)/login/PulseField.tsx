"use client";

/**
 * The monitoring field behind the sign-in.
 *
 * Genuinely three-dimensional: each trace is a polyline in world space, rotated
 * about Y, projected through a perspective divide and drawn back-to-front so
 * depth reads as depth rather than as a blur filter.
 *
 * What it draws is the product. Each trace is one patient's vitals, each on its
 * own heart rate, running continuously and receding into the past. Decoration
 * that means nothing would have been easier and would have said nothing.
 *
 * Canvas rather than SVG because this is ~2,000 points redrawn every frame, and
 * that many DOM nodes is a different kind of animation entirely.
 */

import { useEffect, useRef } from "react";

const TRACES = 9;
const POINTS = 200;
const SPAN = 2.6; // world width of one trace
const DEPTH = 0.52; // world distance between traces
const FOCAL = 3.4; // perspective focal length
const INK = "226, 72, 59"; // the pulse red, as channels so alpha can vary

/**
 * One cardiac cycle, as a sum of gaussians — P, then the QRS complex, then T.
 * Not clinically exact and not meant to be; it is the silhouette a nurse would
 * recognise from across a ward.
 */
function ecg(t: number): number {
  const at = (centre: number, width: number, height: number) =>
    height * Math.exp(-((t - centre) ** 2) / (2 * width * width));

  return (
    at(0.2, 0.022, 0.16) +
    at(0.38, 0.008, -0.22) +
    at(0.42, 0.01, 1) +
    at(0.46, 0.01, -0.34) +
    at(0.62, 0.04, 0.3)
  );
}

export function PulseField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    // jsdom has no 2d context. The page must still render under test.
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const still =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;

    /**
     * Measured every frame rather than on mount and a ResizeObserver.
     * At mount the element has not been laid out yet, so the first read is
     * effectively zero, and if the observer then misses its callback the
     * canvas keeps a one-pixel backing store for the life of the page - which
     * looks exactly like the animation being broken. One rect read per frame
     * is cheaper than that failure.
     */
    const measure = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === width && rect.height === height) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const render = (time: number) => {
      measure();
      if (width < 2 || height < 2) return;

      ctx.clearRect(0, 0, width, height);

      // Gentle sweep rather than a full spin — enough for the depth to read,
      // slow enough that nobody watches it instead of signing in.
      const yaw = Math.sin(time * 0.12) * 0.42 - 0.28;
      const cos = Math.cos(yaw);
      const sin = Math.sin(yaw);

      const cx = width * 0.52;
      const cy = height * 0.5;
      const scale = Math.min(width, height * 1.35) * 0.42;

      // Back to front, so nearer traces occlude the ones behind them.
      for (let i = TRACES - 1; i >= 0; i--) {
        const z = i * DEPTH;
        const rate = 0.58 + i * 0.045; // every patient beats differently
        const phase = time * rate + i * 0.37;

        // Depth is measured after rotation, so the fade tracks what the eye
        // actually sees rather than the index in the loop.
        const depth = -SPAN * 0.5 * sin + z * cos;
        const near = 1 - Math.min(depth / (TRACES * DEPTH), 1);

        ctx.beginPath();
        let started_ = false;

        for (let p = 0; p <= POINTS; p++) {
          const u = p / POINTS;
          const wx = (u - 0.5) * SPAN;
          const wy = -ecg((u * 2.2 + phase) % 1) * 0.44;

          const rx = wx * cos - z * sin;
          const rz = wx * sin + z * cos;

          const k = FOCAL / (FOCAL + rz);
          const sx = cx + rx * scale * k;
          const sy = cy + wy * scale * k + (z - TRACES * DEPTH * 0.4) * 26;

          if (!started_) {
            ctx.moveTo(sx, sy);
            started_ = true;
          } else {
            ctx.lineTo(sx, sy);
          }
        }

        ctx.strokeStyle = `rgba(${INK}, ${0.09 + near * near * 0.72})`;
        ctx.lineWidth = 0.7 + near * 1.5;
        ctx.stroke();
      }
    };

    // Paint once, synchronously, before any animation frame is asked for.
    // A tab that is not being composited never runs requestAnimationFrame, so
    // a loop-only implementation leaves the panel blank until the tab is
    // looked at - and the still, reduced-motion rendering would never appear
    // at all.
    render(6);

    let frame = 0;
    const started = performance.now();

    const loop = (now: number) => {
      render((now - started) / 1000);
      frame = requestAnimationFrame(loop);
    };

    if (!still) frame = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(frame);
  }, []);

  return <canvas ref={ref} aria-hidden="true" />;
}

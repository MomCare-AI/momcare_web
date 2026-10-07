"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Keeps the care plan's month card and its tabs on screen, just beneath the
 * patient header, and collapses the card down to its title once you scroll
 * well past where it sticks.
 *
 * It is built the same way as PatientStickyHeader: the sticky wrapper holds
 * the header's *expanded* height, and only the visible content inside it
 * shrinks. Collapsing therefore never moves the plan underneath, and the strip
 * left below a collapsed header is see-through. Two thresholds (collapse after
 * 70px of scroll past the stick point, expand again under 10px) stop it
 * flickering around a single scroll position.
 */
export function CarePlanStickyHeader({
  children,
}: {
  children: (collapsed: boolean) => ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [fullHeight, setFullHeight] = useState<number | undefined>(undefined);
  const wrapRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const collapsedRef = useRef(false);

  // Stick directly under the patient header, whatever size it currently is
  // (it shrinks as the page scrolls). Set straight on the element so the
  // change does not re-render anything.
  useEffect(() => {
    const wrap = wrapRef.current;
    const head = document.querySelector<HTMLElement>(".mc-patient-sticky-head");
    const headInner = document.querySelector<HTMLElement>(
      ".mc-patient-sticky-inner"
    );
    if (!wrap || !head || !headInner) return;

    const place = () => {
      const base = parseFloat(getComputedStyle(head).top) || 0;
      wrap.style.top = `${base + headInner.offsetHeight}px`;
    };
    place();

    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(place) : null;
    observer?.observe(headInner);
    window.addEventListener("resize", place);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", place);
    };
  }, []);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      const wrap = wrapRef.current;
      const marker = markerRef.current;
      if (!wrap || !marker) return;
      // The wrapper itself never moves once stuck, so how far it has been
      // scrolled past is measured from a marker left at its natural spot.
      const stuckAt = parseFloat(wrap.style.top) || 0;
      const past = stuckAt - marker.getBoundingClientRect().top;
      let next = collapsedRef.current;
      if (!next && past > 70) next = true;
      else if (next && past < 10) next = false;
      if (next !== collapsedRef.current) {
        collapsedRef.current = next;
        setCollapsed(next);
      }
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Remember the expanded height; it only ever grows while collapsed.
  useEffect(() => {
    const el = innerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      if (collapsedRef.current) return;
      setFullHeight((prev) => Math.max(prev ?? 0, el.offsetHeight));
    });
    observer.observe(el);
    const onResize = () => {
      if (!collapsedRef.current) setFullHeight(undefined);
    };
    window.addEventListener("resize", onResize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <>
      <div
        ref={markerRef}
        aria-hidden
        style={{ position: "absolute", height: 0, width: 0 }}
      />
      <div
        ref={wrapRef}
        className="mc-careplan-sticky"
        style={fullHeight ? { height: fullHeight } : undefined}
      >
        <div ref={innerRef} className="mc-careplan-sticky-inner">
          {children(collapsed)}
        </div>
      </div>
    </>
  );
}

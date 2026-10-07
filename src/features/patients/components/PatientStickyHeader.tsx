"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Keeps the patient header and its tabs at the top while the record scrolls,
 * and collapses the header's detail rows once you are well down the page.
 *
 * Why it is built this way. Collapsing shrinks the header, and if the header's
 * own height were what holds the page's layout, every frame of that animation
 * would shift and re-lay-out the whole record underneath (charts, tables...) -
 * that was the lag. So the sticky wrapper keeps the header's *expanded* height
 * fixed, and only the visible card inside it shrinks. The wrapper does not
 * catch clicks and has no background, so the strip it leaves under a collapsed
 * header is see-through and the page scrolls beneath it. Nothing outside the
 * header ever moves because of the collapse.
 *
 * The collapse has two thresholds (down past 90px, back up under 16px), so the
 * header cannot flicker open and shut around a single scroll position.
 */
export function PatientStickyHeader({
  children,
}: {
  children: (collapsed: boolean) => ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [fullHeight, setFullHeight] = useState<number | undefined>(undefined);
  const innerRef = useRef<HTMLDivElement>(null);
  const collapsedRef = useRef(false);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      const y = window.scrollY;
      let next = collapsedRef.current;
      if (!next && y > 90) next = true;
      else if (next && y < 16) next = false;
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

  // Remember the header's expanded height. While it is collapsed (or part-way
  // between) the card is shorter, so only ever grow the number; a window resize
  // starts the measurement again.
  useEffect(() => {
    const el = innerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    // It only grows while the card is opening or closing; once it has been
    // still for a moment the exact height is taken, so a card that has got
    // shorter does not leave a blank strip behind.
    let settle: ReturnType<typeof setTimeout> | undefined;
    const observer = new ResizeObserver(() => {
      if (collapsedRef.current) return;
      setFullHeight((prev) => Math.max(prev ?? 0, el.offsetHeight));
      clearTimeout(settle);
      settle = setTimeout(() => {
        if (!collapsedRef.current) setFullHeight(el.offsetHeight);
      }, 400);
    });
    observer.observe(el);

    const onResize = () => {
      if (!collapsedRef.current) setFullHeight(undefined);
    };
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(settle);
      observer.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div
      className="mc-patient-sticky-head"
      style={fullHeight ? { height: fullHeight } : undefined}
    >
      <div ref={innerRef} className="mc-patient-sticky-inner">
        {children(collapsed)}
      </div>
    </div>
  );
}

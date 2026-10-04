"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown, Globe2, MapPin, Search } from "lucide-react";

import { useLocations } from "../hooks/useLocations";
import { useLocationScope } from "../LocationScopeContext";

interface Props {
  /** Icon-only, matching the sidebar's own collapsed nav items — no room
   *  for the search panel at that width, so collapsed just shows the pin. */
  collapsed: boolean;
}

/**
 * Which single site the portal is scoped to, or every site at once —
 * the reference platform's own pattern (a dropdown right under the org
 * name, search + a bulleted list, "All locations" as its own top entry).
 * Portals its panel with `position: fixed` inside `.mc-portal` rather than
 * `position: absolute` — the sidebar itself scrolls (`overflow-y: auto`),
 * which would otherwise clip the panel the same way `.mc-dtable-wrap` did
 * for the table Action menus (see `shared/ui/ActionMenu.tsx`'s own note).
 */
export function LocationSwitcher({ collapsed }: Props) {
  const { selectedLocationId, setSelectedLocationId } = useLocationScope();
  const locationsQuery = useLocations();
  const locations = locationsQuery.data?.results ?? [];

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [pos, setPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const selected = locations.find((l) => l.id === selectedLocationId) ?? null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return locations;
    return locations.filter((l) => l.name.toLowerCase().includes(q));
  }, [locations, search]);

  useEffect(() => {
    if (!open) return;

    const place = () => {
      const r = btnRef.current?.getBoundingClientRect();
      if (!r) return;
      setPos({ top: r.bottom + 6, left: r.left, width: r.width });
    };
    place();

    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        btnRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // "All Locations" first, then whatever the search leaves.
  const options = useMemo(() => {
    const q = search.trim().toLowerCase();
    const all = !q || "all locations".includes(q);
    return [
      ...(all ? [{ id: null as string | null, name: "All Locations" }] : []),
      ...filtered.map((l) => ({ id: l.id as string | null, name: l.name })),
    ];
  }, [filtered, search]);
  const [focusIndex, setFocusIndex] = useState(0);

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusIndex((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && options[focusIndex]) {
      e.preventDefault();
      choose(options[focusIndex].id);
    }
  };

  const choose = (id: string | null) => {
    setSelectedLocationId(id);
    setOpen(false);
    setSearch("");
  };

  return (
    <div className="mc-locationswitch-wrap">
      <button
        ref={btnRef}
        type="button"
        className="mc-locationswitch"
        aria-haspopup="listbox"
        aria-expanded={open}
        title={
          collapsed ? (selected ? selected.name : "All locations") : undefined
        }
        onClick={() => setOpen((v) => !v)}
      >
        <MapPin size={15} strokeWidth={2} aria-hidden />
        <span className="mc-locationswitch-label mc-sidebar-fade">
          {selected ? selected.name : "All Locations"}
        </span>
        <ChevronDown
          className="mc-sidebar-fade"
          size={14}
          strokeWidth={2}
          aria-hidden
          style={{
            marginLeft: "auto",
            flex: "none",
            transform: open ? "rotate(180deg)" : undefined,
          }}
        />
      </button>

      {typeof document !== "undefined" &&
        pos &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                key="panel"
                ref={panelRef}
                role="listbox"
                aria-label="Choose a location"
                className="mc-locationswitch-panel"
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
                style={{
                  position: "fixed",
                  top: pos.top,
                  left: pos.left,
                  width: Math.max(pos.width, 252),
                  zIndex: 200,
                }}
              >
                <div className="mc-locationswitch-heading">Switch location</div>
                <div className="mc-locationswitch-search">
                  <Search size={14} strokeWidth={2} aria-hidden />
                  <input
                    autoFocus
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setFocusIndex(0);
                    }}
                    onKeyDown={onSearchKey}
                    placeholder="Search locations…"
                    aria-label="Search locations"
                  />
                </div>

                <ul className="mc-locationswitch-list">
                  {locationsQuery.isPending && (
                    <li className="mc-locationswitch-empty">Loading…</li>
                  )}
                  {locationsQuery.isSuccess && options.length === 0 && (
                    <li className="mc-locationswitch-empty">
                      No locations match
                    </li>
                  )}
                  {options.map((opt, i) => {
                    const active = selectedLocationId === opt.id;
                    return (
                      <li
                        key={opt.id ?? "all"}
                        role="option"
                        aria-selected={active}
                      >
                        <button
                          type="button"
                          className="mc-locationswitch-option"
                          data-active={active}
                          data-focused={i === focusIndex}
                          onMouseEnter={() => setFocusIndex(i)}
                          onClick={() => choose(opt.id)}
                        >
                          <span className="mc-locationswitch-icon" aria-hidden>
                            {opt.id === null ? (
                              <Globe2 size={14} strokeWidth={2} />
                            ) : (
                              <MapPin size={14} strokeWidth={2} />
                            )}
                          </span>
                          {opt.name}
                          {active && (
                            <Check
                              size={14}
                              strokeWidth={2.4}
                              aria-hidden
                              style={{ marginLeft: "auto" }}
                            />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>,
          document.querySelector(".mc-portal") ?? document.body
        )}
    </div>
  );
}

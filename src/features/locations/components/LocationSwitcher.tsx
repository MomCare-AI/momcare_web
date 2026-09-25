"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, MapPin, Search } from "lucide-react";

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

  const choose = (id: string | null) => {
    setSelectedLocationId(id);
    setOpen(false);
    setSearch("");
  };

  return (
    <div style={{ padding: collapsed ? "0 10px" : "0 14px", marginBottom: 4 }}>
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
        {!collapsed && (
          <>
            <span className="mc-locationswitch-label">
              {selected ? selected.name : "All Locations"}
            </span>
            <ChevronDown
              size={14}
              strokeWidth={2}
              aria-hidden
              style={{
                marginLeft: "auto",
                transition: "transform 0.15s ease",
                transform: open ? "rotate(180deg)" : undefined,
              }}
            />
          </>
        )}
      </button>

      {open &&
        pos &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            role="listbox"
            aria-label="Choose a location"
            className="mc-locationswitch-panel"
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width: Math.max(pos.width, 240),
              zIndex: 200,
            }}
          >
            <div className="mc-locationswitch-search">
              <Search size={13} strokeWidth={2} aria-hidden />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search location…"
                aria-label="Search locations"
              />
            </div>

            <ul className="mc-locationswitch-list">
              <li role="option" aria-selected={selectedLocationId === null}>
                <button
                  type="button"
                  className="mc-locationswitch-option"
                  onClick={() => choose(null)}
                >
                  <span
                    className="mc-locationswitch-dot"
                    data-active={selectedLocationId === null}
                    aria-hidden
                  />
                  All Locations
                  {selectedLocationId === null && (
                    <Check
                      size={13}
                      strokeWidth={2.4}
                      aria-hidden
                      style={{ marginLeft: "auto" }}
                    />
                  )}
                </button>
              </li>

              {locationsQuery.isPending && (
                <li className="mc-locationswitch-empty">Loading…</li>
              )}
              {locationsQuery.isSuccess && filtered.length === 0 && (
                <li className="mc-locationswitch-empty">No locations match</li>
              )}
              {filtered.map((loc) => (
                <li
                  key={loc.id}
                  role="option"
                  aria-selected={selectedLocationId === loc.id}
                >
                  <button
                    type="button"
                    className="mc-locationswitch-option"
                    onClick={() => choose(loc.id)}
                  >
                    <span
                      className="mc-locationswitch-dot"
                      data-active={selectedLocationId === loc.id}
                      aria-hidden
                    />
                    {loc.name}
                    {selectedLocationId === loc.id && (
                      <Check
                        size={13}
                        strokeWidth={2.4}
                        aria-hidden
                        style={{ marginLeft: "auto" }}
                      />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>,
          document.querySelector(".mc-portal") ?? document.body
        )}
    </div>
  );
}

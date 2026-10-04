import type { PatientStatusEntry } from "./types";

/**
 * The logic behind the "Edit statuses" popup, kept free of React so the
 * rules are testable: what is currently on the patient, which of those the
 * signed-in person may take off, and what a save must add and remove.
 *
 * The backend rules this mirrors: any hospital staff member may assign a
 * status; only the person who added one, or a hospital admin, may remove it.
 * The same name may be logged more than once (a status can recur), so a
 * status is matched by name, ignoring case.
 */

export const DEFAULT_STATUS_COLOR = "#4361ee";

export interface CatalogueLabel {
  id: string;
  name: string;
  description: string;
  color: string | null;
}

export interface StatusChoice {
  /** Lower-cased name: how a catalogue label and a logged entry are matched. */
  key: string;
  name: string;
  description: string;
  color: string;
  /** Every entry of this name currently logged on the patient. */
  entries: PatientStatusEntry[];
  assigned: boolean;
  /** False when someone else added it and the user is not a hospital admin. */
  removable: boolean;
  inCatalogue: boolean;
  /** Typed into the popup and not saved yet; ticked until it is unticked. */
  isNew?: boolean;
}

export const keyOf = (name: string) => name.trim().toLowerCase();

/** A usable #rrggbb colour, or the portal's default blue. */
export function safeColor(color: string | null | undefined): string {
  return color && /^#[0-9a-f]{6}$/i.test(color) ? color : DEFAULT_STATUS_COLOR;
}

/** One item per name (first wins), for showing a patient's statuses once each. */
export function uniqueByName<T extends { name: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((i) => {
    const k = keyOf(i.name);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function buildChoices(
  labels: CatalogueLabel[],
  entries: PatientStatusEntry[],
  user: { id: string; isAdmin: boolean }
): StatusChoice[] {
  const byKey = new Map<string, PatientStatusEntry[]>();
  for (const e of entries) {
    const k = keyOf(e.name);
    byKey.set(k, [...(byKey.get(k) ?? []), e]);
  }

  const canRemove = (list: PatientStatusEntry[]) =>
    user.isAdmin || list.every((e) => e.added_by === user.id);

  const fromCatalogue: StatusChoice[] = uniqueByName(labels).map((l) => {
    const logged = byKey.get(keyOf(l.name)) ?? [];
    return {
      key: keyOf(l.name),
      name: l.name,
      description: l.description,
      color: safeColor(l.color),
      entries: logged,
      assigned: logged.length > 0,
      removable: canRemove(logged),
      inCatalogue: true,
    };
  });

  // Statuses still on the patient whose catalogue entry has since been
  // deleted: shown too, so they can still be taken off.
  const known = new Set(fromCatalogue.map((c) => c.key));
  const orphans: StatusChoice[] = [];
  for (const [key, logged] of byKey) {
    if (known.has(key)) continue;
    const first = logged[0];
    orphans.push({
      key,
      name: first.name,
      description: first.description,
      color: safeColor(first.color),
      entries: logged,
      assigned: true,
      removable: canRemove(logged),
      inCatalogue: false,
    });
  }

  return [...fromCatalogue, ...orphans];
}

/** What saving must do, given which choices are ticked. */
export function planChanges(choices: StatusChoice[], selected: Set<string>) {
  const toAdd: StatusChoice[] = [];
  const toRemove: PatientStatusEntry[] = [];
  for (const c of choices) {
    const wanted = selected.has(c.key);
    if (wanted && !c.assigned) toAdd.push(c);
    // A locked choice is never removed, whatever the selection says.
    if (!wanted && c.assigned && c.removable) toRemove.push(...c.entries);
  }
  return { toAdd, toRemove };
}

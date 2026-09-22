/**
 * Client-side CSV export — no backend call, no new dependency. Takes rows
 * already loaded for the screen and a column spec, produces a file download.
 * Excel/Sheets/Numbers all read this format natively.
 */

export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number | null;
}

function escapeCsvCell(value: string | number | null): string {
  const s = value === null ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => escapeCsvCell(c.header)).join(",");
  const body = rows
    .map((row) => columns.map((c) => escapeCsvCell(c.value(row))).join(","))
    .join("\n");
  return `${header}\n${body}`;
}

/** Triggers a browser download — a detached anchor click is still the most
 *  reliable cross-browser way to do this without a library. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

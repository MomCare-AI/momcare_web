"use client";

import { useEffect, useRef } from "react";

import { useAddBands } from "../hooks/useNgoBands";

/** Registers a batch of new NGO-owned bands. Serials are assigned automatically. */
export function AddBandsDialog({ onClose }: { onClose: () => void }) {
  const add = useAddBands();
  const batchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    batchRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    add.mutate(
      {
        batch: String(form.get("batch") ?? ""),
        quantity: Number(form.get("quantity")),
      },
      { onSuccess: onClose }
    );
  };

  const field =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-600";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40"
        onClick={onClose}
        aria-hidden
      />
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-bands-title"
        className="relative w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 id="add-bands-title" className="text-lg font-bold text-slate-900">
          Add bands
        </h2>
        <p className="text-sm text-slate-500">
          New bands join your stock. Serial numbers are assigned automatically.
        </p>

        <div>
          <label
            htmlFor="batch"
            className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            Batch label
          </label>
          <input
            ref={batchRef}
            id="batch"
            name="batch"
            placeholder="e.g. 2026-C"
            required
            className={field}
          />
        </div>

        <div>
          <label
            htmlFor="quantity"
            className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            Quantity
          </label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            min={1}
            max={200}
            defaultValue={10}
            required
            className={field}
          />
        </div>

        {add.error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {add.error.message}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={add.isPending}
            className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:bg-slate-300"
          >
            {add.isPending ? "Adding…" : "Add bands"}
          </button>
        </div>
      </form>
    </div>
  );
}

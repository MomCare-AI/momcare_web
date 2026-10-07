"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, Undo2 } from "lucide-react";

import { Card, CardBody, CardHeader } from "@/shared/ui/Card";
import type { useCarePlanActions } from "../hooks/useCarePlan";
import type {
  AdjustmentInput,
  ExerciseContent,
  NutritionContent,
  PlanItem,
  PlanSection,
  SectionName,
} from "../types";
import { PlanItemEditor } from "./PlanItemEditor";
import { SourcesBlock } from "./SourcesBlock";

type Actions = ReturnType<typeof useCarePlanActions>;
type ListName = AdjustmentInput["list_name"];

interface ListSpec {
  name: ListName;
  title: string;
  /** What an "add" button says. */
  add: string;
}

const NUTRITION_LISTS: ListSpec[] = [
  { name: "meals", title: "Meals", add: "Add a meal" },
  { name: "foods_to_eat", title: "Foods to eat", add: "Add a food" },
  {
    name: "foods_to_avoid",
    title: "Foods to avoid",
    add: "Add a food to avoid",
  },
];
const EXERCISE_LISTS: ListSpec[] = [
  { name: "activities", title: "Activities", add: "Add an activity" },
  { name: "avoid", title: "Avoid", add: "Add something to avoid" },
];

function describe(item: PlanItem): string {
  const extras: string[] = [];
  if (item.slot) extras.push(item.slot[0].toUpperCase() + item.slot.slice(1));
  if (item.duration_minutes) extras.push(`${item.duration_minutes} min`);
  if (item.frequency_per_week)
    extras.push(`${item.frequency_per_week}× a week`);
  if (item.intensity) extras.push(item.intensity);
  return extras.length ? ` (${extras.join(", ")})` : "";
}

/**
 * Nutrition or exercise for the week: the label, this section's own progress,
 * the items with the doctor's edit controls, and where the advice came from.
 *
 * Items are plain text. The `item_key` used to address an item is never shown.
 */
export function CarePlanSection({
  section,
  data,
  actions,
  editable,
}: {
  section: SectionName;
  data: PlanSection<NutritionContent> | PlanSection<ExerciseContent>;
  actions: Actions;
  /** False once the plan is finalized. */
  editable: boolean;
}) {
  const isNutrition = section === "nutrition";
  const lists = isNutrition ? NUTRITION_LISTS : EXERCISE_LISTS;
  const content = data.content as Record<string, unknown>;

  const [editor, setEditor] = useState<{
    list: ListSpec;
    item?: PlanItem;
  } | null>(null);

  const writes = [
    actions.adjust,
    actions.editAdjustment,
    actions.undoAdjustment,
  ];
  const busy = writes.some((w) => w.isPending);
  const failure = writes.find((w) => w.isError)?.error as Error | undefined;

  const close = () => setEditor(null);
  const reset = () => writes.forEach((w) => w.reset());

  const save = (
    list: ListSpec,
    item: PlanItem | undefined,
    c: AdjustmentInput["content"]
  ) => {
    if (!item) {
      actions.adjust.mutate(
        { section, list_name: list.name, action: "add", content: c },
        { onSuccess: close }
      );
    } else if (item.source === "staff" && item.adjustment_id) {
      actions.editAdjustment.mutate(
        { adjustmentId: item.adjustment_id, content: c ?? {} },
        { onSuccess: close }
      );
    } else {
      actions.adjust.mutate(
        {
          section,
          list_name: list.name,
          action: "edit",
          item_key: item.item_key,
          content: c,
        },
        { onSuccess: close }
      );
    }
  };

  const remove = (list: ListSpec, item: PlanItem) => {
    reset();
    if (item.source === "staff" && item.adjustment_id) {
      actions.undoAdjustment.mutate(item.adjustment_id);
    } else {
      actions.adjust.mutate({
        section,
        list_name: list.name,
        action: "remove",
        item_key: item.item_key,
      });
    }
  };

  const tips = isNutrition
    ? ((content.timing_tips as string[] | undefined) ?? [])
    : ((content.stop_signs as string[] | undefined) ?? []);
  const tipsTitle = isNutrition
    ? "Timing tips"
    : "Stop and call your care team if";

  return (
    <Card>
      <CardHeader
        className={
          isNutrition ? "mc-card-head-nutrition" : "mc-card-head-exercise"
        }
      >
        <div>
          <div className="mc-card-title">
            {isNutrition ? "Nutrition" : "Exercise"}
          </div>
        </div>
      </CardHeader>
      <CardBody>
        {data.progress?.text && (
          <p style={{ margin: "0 0 12px", fontSize: 13.5 }}>
            {data.progress.text}
          </p>
        )}

        {lists.map((list) => {
          const items = (content[list.name] as PlanItem[] | undefined) ?? [];
          return (
            <div key={list.name} style={{ marginBottom: 14 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <div className="mc-card-sub" style={{ fontWeight: 600 }}>
                  {list.title}
                </div>
                {editable && (
                  <button
                    type="button"
                    className="mc-btn-ghost mc-btn-sm"
                    disabled={busy}
                    onClick={() => {
                      reset();
                      setEditor({ list });
                    }}
                  >
                    <Plus size={12} strokeWidth={2} aria-hidden />
                    {list.add}
                  </button>
                )}
              </div>

              {items.length === 0 ? (
                <p className="mc-hint">Nothing listed.</p>
              ) : (
                <ul
                  style={{ listStyle: "none", margin: "6px 0 0", padding: 0 }}
                >
                  {items.map((item, i) => (
                    <li
                      key={`${item.adjustment_id ?? item.item_key ?? "item"}-${i}`}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 10,
                        padding: "6px 0",
                        borderTop: "1px solid var(--c-border-soft)",
                        fontSize: 13.5,
                      }}
                    >
                      <span>
                        {item.text}
                        <span style={{ color: "var(--c-faint)" }}>
                          {describe(item)}
                        </span>
                        {item.source === "staff" && (
                          <span
                            className="mc-badge mc-badge-neutral"
                            style={{ marginLeft: 8 }}
                          >
                            Edited by staff
                          </span>
                        )}
                      </span>
                      {editable && (
                        <span style={{ display: "flex", gap: 4, flex: "none" }}>
                          <button
                            type="button"
                            className="mc-btn-ghost mc-btn-sm"
                            aria-label={`Edit ${item.text}`}
                            disabled={busy}
                            onClick={() => {
                              reset();
                              setEditor({ list, item });
                            }}
                          >
                            <Pencil size={12} strokeWidth={2} aria-hidden />
                          </button>
                          <button
                            type="button"
                            className="mc-btn-ghost mc-btn-sm"
                            aria-label={
                              item.source === "staff"
                                ? `Undo the change to ${item.text}`
                                : `Remove ${item.text}`
                            }
                            title={
                              item.source === "staff"
                                ? "Undo this change"
                                : "Remove from the plan"
                            }
                            disabled={busy}
                            onClick={() => remove(list, item)}
                          >
                            {item.source === "staff" ? (
                              <Undo2 size={12} strokeWidth={2} aria-hidden />
                            ) : (
                              <Trash2 size={12} strokeWidth={2} aria-hidden />
                            )}
                          </button>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}

        {isNutrition &&
          typeof content.hydration === "string" &&
          content.hydration && (
            <p style={{ margin: "0 0 12px", fontSize: 13.5 }}>
              <strong>Hydration: </strong>
              {content.hydration}
            </p>
          )}

        {tips.length > 0 && (
          <div style={{ marginBottom: 6 }}>
            <div className="mc-card-sub" style={{ fontWeight: 600 }}>
              {tipsTitle}
            </div>
            <ul style={{ margin: "4px 0 0", paddingLeft: 18, fontSize: 13.5 }}>
              {tips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        )}

        {failure && !editor && (
          <p className="mc-alert mc-alert-error" role="alert">
            {failure.message}
          </p>
        )}

        <SourcesBlock
          basis={data.basis}
          sources={data.sources}
          sourceLinks={data.source_links}
          notice={data.generated_by_ai_notice}
        />
      </CardBody>

      {editor && (
        <PlanItemEditor
          key={
            editor.item?.adjustment_id ??
            editor.item?.item_key ??
            `new-${editor.list.name}`
          }
          open
          onClose={close}
          title={editor.item ? "Edit item" : editor.list.add}
          listName={editor.list.name}
          initial={editor.item}
          saving={busy}
          error={failure?.message ?? null}
          onSave={(c) => save(editor.list, editor.item, c)}
        />
      )}
    </Card>
  );
}

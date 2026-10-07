"use client";

import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Lock,
  Pencil,
  RotateCcw,
  Salad,
} from "lucide-react";

import { usePortal } from "@/app/(portal)/dashboard/portal";
import { Card, CardBody, CardHeader } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { RowSkeleton } from "@/shared/ui/RowSkeleton";
import { formatDateTime } from "@/shared/lib/formatDateTime";
import {
  STATUS_TEXT,
  TREND_TEXT,
  carePlanPermissions,
  isEditable,
  weekRangeLabel,
} from "../carePlanLogic";
import { useCarePlanActions, useCurrentCarePlan } from "../hooks/useCarePlan";
import type { CarePlan } from "../types";
import { AllergiesEditor } from "./AllergiesEditor";
import { CarePlanEntries } from "./CarePlanEntries";
import { CarePlanSection } from "./CarePlanSection";
import { CarePlanStickyHeader } from "./CarePlanStickyHeader";
import { RecapText } from "./RecapText";
import { SourcesBlock } from "./SourcesBlock";

const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : null;

/**
 * Patient page -> Care Plan tab (staff view).
 *
 * One call returns the whole plan for the week she is in. A plan can be `null`
 * (no readings yet); while it is `preparing` or has an `update_pending` the
 * hook polls every few seconds and stops by itself when both clear.
 */
export function CarePlanPanel({ pregnancyId }: { pregnancyId: string }) {
  const query = useCurrentCarePlan(pregnancyId);

  if (query.isPending) {
    return (
      <Card>
        <div className="mc-rows">
          <RowSkeleton count={4} variant="plain" />
        </div>
      </Card>
    );
  }

  if (query.isError) {
    // "Could not load" is not "there is no plan" — the two must not look alike.
    return (
      <Card>
        <EmptyState
          icon={<Salad size={20} strokeWidth={1.9} aria-hidden />}
          title="The care plan could not be loaded"
          text="This is a problem reaching the server, not a statement that she has no plan."
          actions={
            <button className="mc-btn" onClick={() => query.refetch()}>
              Try again
            </button>
          }
        />
      </Card>
    );
  }

  const {
    care_plan: plan,
    preparing,
    update_pending,
    status_message,
  } = query.data;

  const banner = (preparing || update_pending) && (
    <p className="mc-alert mc-alert-notice" role="status" aria-live="polite">
      <Loader2 size={14} strokeWidth={2} className="mc-spin" aria-hidden />
      {status_message ??
        (preparing
          ? "Her plan for this week is being prepared."
          : "Her newest reading is still being looked at.")}
    </p>
  );

  if (!plan) {
    return (
      <>
        {banner}
        {!preparing && (
          <Card>
            <EmptyState
              icon={<Salad size={20} strokeWidth={1.9} aria-hidden />}
              title="No care plan yet"
              text="A plan is written after her first reading. Take a first reading and it will appear here."
            />
          </Card>
        )}
      </>
    );
  }

  return (
    <>
      {banner}
      <CarePlanView pregnancyId={pregnancyId} plan={plan} />
    </>
  );
}

function CarePlanView({
  pregnancyId,
  plan,
}: {
  pregnancyId: string;
  plan: CarePlan;
}) {
  const { user } = usePortal();
  const { canWriteMedications, canFinalize } = carePlanPermissions(
    user.role_code
  );
  const actions = useCarePlanActions(pregnancyId, plan.id);
  const editable = isEditable(plan);
  const [editingAllergies, setEditingAllergies] = useState(false);
  const [sub, setSub] = useState<"plan" | "medication" | "notes">("plan");

  const stateChange = [actions.review, actions.finalize, actions.reopen];
  const stateBusy = stateChange.some((a) => a.isPending);
  const stateError = messageOf(stateChange.find((a) => a.isError)?.error);

  const week = plan.week;
  const reviewFacts = [
    plan.reviewed_by &&
      `Reviewed by ${plan.reviewed_by}${plan.reviewed_at ? ` · ${formatDateTime(plan.reviewed_at)}` : ""}`,
    plan.finalized_by &&
      `Finalized by ${plan.finalized_by}${plan.finalized_at ? ` · ${formatDateTime(plan.finalized_at)}` : ""}`,
    plan.last_evaluated_at &&
      `Last checked against her readings ${formatDateTime(plan.last_evaluated_at)}`,
  ].filter(Boolean) as string[];

  const entriesError = (...ms: { error: unknown }[]) =>
    messageOf(ms.find((m) => m.error)?.error);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* The important things first. Which week this is, where the plan
          stands and what can be done about it share one row; last week's
          progress and the quick advice sit side by side beneath it. The card
          and the tabs stay on screen under the patient header, and the card
          shrinks to its title line once you scroll. */}
      <CarePlanStickyHeader>
        {(collapsed) => (
          <>
            <Card>
              <CardHeader
                style={{ flexWrap: "wrap", gap: 12, alignItems: "center" }}
              >
                <div style={{ minWidth: 0 }}>
                  <div className="mc-card-title">
                    {[
                      `Month ${plan.month_number}`,
                      plan.weeks_label,
                      plan.trimester ? `Trimester ${plan.trimester}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                    {week &&
                      ` · This week: week ${week.week_number} (${weekRangeLabel(week.week_start, week.week_end)})`}
                  </div>
                  <div className="mc-hdr-collapse" data-collapsed={collapsed}>
                    <div className="mc-hdr-collapse-inner">
                      {plan.message && (
                        <div className="mc-card-sub">{plan.message}</div>
                      )}
                      {reviewFacts.map((f) => (
                        <div key={f} className="mc-card-sub">
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Where the plan stands and what can be done about it, on the
              same row as which week it is. */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    className={`mc-badge ${plan.status === "finalized" ? "mc-badge-stable" : plan.status === "reviewed" ? "mc-badge-info" : "mc-badge-neutral"}`}
                  >
                    {plan.status === "finalized" ? (
                      <Lock size={12} strokeWidth={2.2} aria-hidden />
                    ) : (
                      <CheckCircle2 size={12} strokeWidth={2.2} aria-hidden />
                    )}
                    {STATUS_TEXT[plan.status]}
                  </span>
                  {plan.status === "in_progress" && (
                    <button
                      type="button"
                      className="mc-btn mc-btn-sm"
                      disabled={stateBusy}
                      onClick={() => {
                        stateChange.forEach((a) => a.reset());
                        actions.review.mutate();
                      }}
                    >
                      <CheckCircle2 size={13} strokeWidth={2} aria-hidden />
                      {actions.review.isPending ? "Saving…" : "Mark reviewed"}
                    </button>
                  )}
                  {canFinalize && plan.status === "reviewed" && (
                    <button
                      type="button"
                      className="mc-btn-dark mc-btn-sm"
                      disabled={stateBusy}
                      onClick={() => {
                        stateChange.forEach((a) => a.reset());
                        actions.finalize.mutate();
                      }}
                    >
                      <Lock size={13} strokeWidth={2} aria-hidden />
                      {actions.finalize.isPending ? "Saving…" : "Finalize"}
                    </button>
                  )}
                  {canFinalize && plan.status === "finalized" && (
                    <button
                      type="button"
                      className="mc-btn-ghost mc-btn-sm"
                      disabled={stateBusy}
                      onClick={() => {
                        stateChange.forEach((a) => a.reset());
                        actions.reopen.mutate();
                      }}
                    >
                      <RotateCcw size={13} strokeWidth={2} aria-hidden />
                      {actions.reopen.isPending ? "Saving…" : "Reopen to edit"}
                    </button>
                  )}
                </div>
              </CardHeader>

              {(plan.status === "finalized" || stateError) && (
                <div
                  className="mc-hdr-collapse"
                  data-collapsed={collapsed && !stateError}
                >
                  <div className="mc-hdr-collapse-inner">
                    <CardBody>
                      {plan.status === "finalized" && (
                        <p className="mc-hint" style={{ margin: 0 }}>
                          This plan is finalized and cannot be edited.
                          {canFinalize
                            ? " Reopen it to make changes."
                            : " A provider or the hospital admin can reopen it."}
                        </p>
                      )}
                      {stateError && (
                        <p
                          className="mc-alert mc-alert-error"
                          role="alert"
                          style={{
                            marginTop: plan.status === "finalized" ? 10 : 0,
                          }}
                        >
                          <AlertCircle size={14} strokeWidth={2} aria-hidden />
                          {stateError}
                        </p>
                      )}
                    </CardBody>
                  </div>
                </div>
              )}
            </Card>

            {/* Three sections of the plan, as a child nav under the header. */}
            <div
              className="mc-tabs"
              role="tablist"
              aria-label="Care plan section"
              style={{ marginBottom: 0 }}
            >
              {(
                [
                  ["plan", "Exercise & nutrition", null],
                  ["medication", "Medication", plan.medications.length],
                  ["notes", "Notes", plan.notes.length],
                ] as const
              ).map(([id, label, count]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={sub === id}
                  aria-current={sub === id ? "page" : undefined}
                  className="mc-tab"
                  onClick={() => setSub(id)}
                >
                  {label}
                  {count !== null && (
                    <span className="mc-tab-count">{count}</span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </CarePlanStickyHeader>

      {sub === "plan" && (
        <>
          {/* A short card for the latest worse reading. It never replaces the
            weekly plan, and is gone once the week has been re-planned. */}
          {plan.reading_advice && (
            <div style={{ marginBottom: 18 }}>
              <Card>
                <CardHeader>
                  <div className="mc-card-title">Right now</div>
                </CardHeader>
                <CardBody>
                  {plan.reading_advice.tips.length > 0 && (
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5 }}>
                      {plan.reading_advice.tips.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  )}
                  <SourcesBlock
                    basis={plan.reading_advice.basis}
                    sources={plan.reading_advice.sources}
                    sourceLinks={plan.reading_advice.source_links}
                    notice={plan.reading_advice.generated_by_ai_notice}
                  />
                </CardBody>
              </Card>
            </div>
          )}
          {/* Nutrition on the left; last week's recap on its right, with the
            exercise card stacked beneath the recap. */}
          <div className="mc-grid-even">
            <CarePlanSection
              section="nutrition"
              data={plan.nutrition}
              actions={actions}
              editable={editable}
            />
            <div className="mc-stack">
              {plan.progress?.text && (
                <Card>
                  <CardHeader className="mc-card-head-recap">
                    <div className="mc-card-title">How she did last week</div>
                  </CardHeader>
                  <CardBody>
                    <p style={{ margin: 0, fontSize: 13.5 }}>
                      <RecapText text={plan.progress.text} />
                    </p>
                  </CardBody>
                </Card>
              )}
              <CarePlanSection
                section="exercise"
                data={plan.exercise}
                actions={actions}
                editable={editable}
              />
            </div>
          </div>
          <div className="mc-grid-even">
            {plan.weeks.length > 1 && (
              <Card>
                <CardHeader>
                  <div className="mc-card-title">Weeks this month</div>
                </CardHeader>
                <CardBody>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {plan.weeks.map((w) => {
                      const trend =
                        typeof w.trend === "string"
                          ? TREND_TEXT[w.trend]
                          : null;
                      return (
                        <span
                          key={w.week_number}
                          className="mc-badge mc-badge-neutral"
                        >
                          Week {w.week_number}
                          {trend ? ` · ${trend}` : ""}
                        </span>
                      );
                    })}
                  </div>
                </CardBody>
              </Card>
            )}
            <Card>
              <CardHeader>
                <div>
                  <div className="mc-card-title">
                    This plan was built around…
                  </div>
                  <div className="mc-card-sub">
                    Food allergies, diet and conditions on her record
                  </div>
                </div>
                {editable && (
                  <button
                    type="button"
                    className="mc-btn-ghost mc-btn-sm"
                    onClick={() => {
                      actions.saveAllergies.reset();
                      setEditingAllergies(true);
                    }}
                  >
                    <Pencil size={12} strokeWidth={2} aria-hidden />
                    Edit
                  </button>
                )}
              </CardHeader>
              <CardBody>
                <dl
                  style={{ margin: 0, display: "grid", gap: 6, fontSize: 13.5 }}
                >
                  <div>
                    <dt className="mc-hint">Food allergies</dt>
                    <dd style={{ margin: 0 }}>
                      {plan.allergies_and_conditions.food_allergies.length
                        ? plan.allergies_and_conditions.food_allergies.join(
                            ", "
                          )
                        : "None recorded"}
                    </dd>
                  </div>
                  <div>
                    <dt className="mc-hint">Dietary preference</dt>
                    <dd style={{ margin: 0 }}>
                      {plan.allergies_and_conditions.dietary_preference}
                    </dd>
                  </div>
                  <div>
                    <dt className="mc-hint">Conditions</dt>
                    <dd style={{ margin: 0 }}>
                      {plan.allergies_and_conditions.conditions.length
                        ? plan.allergies_and_conditions.conditions
                            .map((c) => c.label)
                            .join(", ")
                        : "None recorded"}
                    </dd>
                  </div>
                </dl>
              </CardBody>
            </Card>
          </div>
        </>
      )}

      {sub === "medication" && (
        <CarePlanEntries
          title="Medication (from your provider)"
          subtitle="Written only by doctors — the AI never writes medicines."
          emptyText="No medication has been added."
          entries={plan.medications}
          canWrite={canWriteMedications}
          editable={editable}
          addLabel="Add medication"
          busy={
            actions.addMedication.isPending ||
            actions.editMedication.isPending ||
            actions.removeMedication.isPending
          }
          error={entriesError(
            actions.addMedication,
            actions.editMedication,
            actions.removeMedication
          )}
          onAdd={(text, done) =>
            actions.addMedication.mutate(text, { onSuccess: done })
          }
          onEdit={(id, text, done) =>
            actions.editMedication.mutate({ id, text }, { onSuccess: done })
          }
          onRemove={(id) => actions.removeMedication.mutate(id)}
          onDismissError={() => {
            actions.addMedication.reset();
            actions.editMedication.reset();
            actions.removeMedication.reset();
          }}
        />
      )}

      {sub === "notes" && (
        <CarePlanEntries
          title="Notes from your care team"
          emptyText="No notes yet."
          entries={plan.notes}
          canWrite
          editable={editable}
          addLabel="Add note"
          busy={
            actions.addNote.isPending ||
            actions.editNote.isPending ||
            actions.removeNote.isPending
          }
          error={entriesError(
            actions.addNote,
            actions.editNote,
            actions.removeNote
          )}
          onAdd={(text, done) =>
            actions.addNote.mutate(text, { onSuccess: done })
          }
          onEdit={(id, text, done) =>
            actions.editNote.mutate({ id, text }, { onSuccess: done })
          }
          onRemove={(id) => actions.removeNote.mutate(id)}
          onDismissError={() => {
            actions.addNote.reset();
            actions.editNote.reset();
            actions.removeNote.reset();
          }}
        />
      )}

      {editingAllergies && (
        <AllergiesEditor
          current={plan.allergies_and_conditions}
          saving={actions.saveAllergies.isPending}
          error={messageOf(actions.saveAllergies.error)}
          onClose={() => setEditingAllergies(false)}
          onSave={(input) =>
            actions.saveAllergies.mutate(input, {
              onSuccess: () => setEditingAllergies(false),
            })
          }
        />
      )}

      {/* Always shown, unchanged. */}
      <Card>
        <CardBody>
          <p style={{ margin: 0, fontSize: 13 }}>{plan.disclaimer}</p>
          {plan.warning_signs.length > 0 && (
            <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 13 }}>
              {plan.warning_signs.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

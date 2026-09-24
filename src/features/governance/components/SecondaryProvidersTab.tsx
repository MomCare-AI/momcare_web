"use client";

import { Fragment, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  AlertCircle,
  ChevronDown,
  Contact,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { usePortal } from "@/app/(portal)/dashboard/layout";
import {
  useCreateSecondaryProvider,
  useDeleteSecondaryProvider,
  useSecondaryProviders,
  useUpdateSecondaryProvider,
} from "@/features/secondary-providers/hooks/useSecondaryProviders";
import type {
  SecondaryProvider,
  SecondaryProviderInput,
} from "@/features/secondary-providers/types";
import { SortableHeader, type SortDirection } from "@/shared/ui/SortableHeader";
import { Card, CardBody, CardHeader } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { RowSkeleton } from "@/shared/ui/RowSkeleton";

const EMPTY_FORM: SecondaryProviderInput = {
  name: "",
  email: "",
  phone: "",
  affiliation: "",
};

export function SecondaryProvidersTab() {
  const { isHospitalAdmin, user } = usePortal();
  const canWrite = isHospitalAdmin || user.role_code === "care_manager";

  const providersQuery = useSecondaryProviders();
  const createProvider = useCreateSecondaryProvider();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<SecondaryProviderInput>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{ key: "name"; dir: SortDirection }>({
    key: "name",
    dir: "asc",
  });

  const providers = providersQuery.data?.results ?? [];

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? providers.filter((p) =>
          [p.name, p.email, p.phone, p.affiliation]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(q)
        )
      : providers;
    const dir = sort.dir === "desc" ? -1 : 1;
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name) * dir);
  }, [providers, search, sort]);

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await createProvider.mutateAsync(form);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Could not add this provider."
      );
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div>
            <div className="mc-card-title">Secondary providers</div>
            <div className="mc-card-sub">
              Nearby clinics or doctors a patient can visit when the main
              hospital isn&apos;t reachable — they examine the patient and
              report back. No login, no role on this platform.
            </div>
          </div>
          {canWrite && (
            <button className="mc-btn" onClick={() => setShowForm((v) => !v)}>
              {showForm ? (
                <X size={15} strokeWidth={2} />
              ) : (
                <Plus size={15} strokeWidth={2} />
              )}
              {showForm ? "Cancel" : "Add provider"}
            </button>
          )}
        </CardHeader>

        {canWrite && showForm && (
          <CardBody>
            <form onSubmit={submitCreate}>
              <div className="mc-formgrid">
                <div>
                  <label className="mc-label" htmlFor="new-sp-name">
                    Name <span className="mc-req">*</span>
                  </label>
                  <input
                    id="new-sp-name"
                    className="mc-input"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Dr. Amina Yousaf"
                  />
                </div>
                <div>
                  <label className="mc-label" htmlFor="new-sp-affiliation">
                    Affiliation
                  </label>
                  <input
                    id="new-sp-affiliation"
                    className="mc-input"
                    value={form.affiliation}
                    onChange={(e) =>
                      setForm({ ...form, affiliation: e.target.value })
                    }
                    placeholder="e.g. Rural Health Centre, Kahuta"
                  />
                </div>
                <div>
                  <label className="mc-label" htmlFor="new-sp-phone">
                    Phone
                  </label>
                  <input
                    id="new-sp-phone"
                    className="mc-input"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="mc-label" htmlFor="new-sp-email">
                    Email
                  </label>
                  <input
                    id="new-sp-email"
                    className="mc-input"
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="Optional"
                  />
                </div>
              </div>

              {formError && (
                <p
                  className="mc-alert mc-alert-error"
                  style={{ marginTop: 12 }}
                >
                  <AlertCircle size={15} strokeWidth={2} aria-hidden />
                  {formError}
                </p>
              )}
              <button
                type="submit"
                className="mc-btn"
                style={{ marginTop: 14 }}
                disabled={createProvider.isPending}
              >
                <Plus size={15} strokeWidth={2} aria-hidden />
                {createProvider.isPending ? "Adding…" : "Add provider"}
              </button>
            </form>
          </CardBody>
        )}

        {providersQuery.isPending && (
          <CardBody>
            <div className="mc-rows">
              <RowSkeleton count={3} variant="plain" />
            </div>
          </CardBody>
        )}

        {providersQuery.isError && (
          <CardBody>
            <EmptyState
              icon={<Contact size={20} strokeWidth={1.9} aria-hidden />}
              title="Couldn't load secondary providers"
              text="This is a problem reaching the server, not an empty list. Refresh to try again."
            />
          </CardBody>
        )}

        {providersQuery.isSuccess &&
          (providers.length === 0 ? (
            <CardBody>
              <EmptyState
                icon={<Contact size={20} strokeWidth={1.9} aria-hidden />}
                title="No secondary providers yet"
                text="Nearby clinicians a patient sees when the main hospital isn't reachable will appear here once added."
              />
            </CardBody>
          ) : (
            <>
              <div style={{ padding: "14px 20px 0" }}>
                <div style={{ position: "relative", maxWidth: 320 }}>
                  <Search
                    size={14}
                    strokeWidth={2}
                    aria-hidden
                    style={{
                      position: "absolute",
                      left: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      opacity: 0.5,
                    }}
                  />
                  <input
                    className="mc-input"
                    style={{ paddingLeft: 30 }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, email or phone…"
                    aria-label="Search secondary providers"
                  />
                </div>
              </div>

              <div className="mc-dtable-wrap" style={{ marginTop: 14 }}>
                <table className="mc-dtable">
                  <thead>
                    <tr>
                      <SortableHeader
                        label="Name"
                        direction={sort.dir}
                        onClick={() =>
                          setSort((s) => ({
                            key: "name",
                            dir: s.dir === "asc" ? "desc" : "asc",
                          }))
                        }
                      />
                      <th>Affiliation</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Patients</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((provider) => (
                      <ProviderRow
                        key={provider.id}
                        provider={provider}
                        canWrite={canWrite}
                        editing={editingId === provider.id}
                        onStartEdit={() => setEditingId(provider.id)}
                        onStopEdit={() => setEditingId(null)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ))}
      </Card>
    </>
  );
}

function ProviderRow({
  provider,
  canWrite,
  editing,
  onStartEdit,
  onStopEdit,
}: {
  provider: SecondaryProvider;
  canWrite: boolean;
  editing: boolean;
  onStartEdit: () => void;
  onStopEdit: () => void;
}) {
  const updateProvider = useUpdateSecondaryProvider();
  const deleteProvider = useDeleteSecondaryProvider();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState<SecondaryProviderInput>({
    name: provider.name,
    email: provider.email,
    phone: provider.phone,
    affiliation: provider.affiliation,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProvider.mutate(
      { providerId: provider.id, input: form },
      { onSuccess: onStopEdit }
    );
  };

  return (
    <Fragment>
      <tr
        className="mc-dtable-row"
        aria-expanded={canWrite ? expanded : undefined}
        onClick={() => canWrite && setExpanded((v) => !v)}
      >
        <td>
          <div className="mc-dtable-primary">{provider.name}</div>
        </td>
        <td>{provider.affiliation || "—"}</td>
        <td>{provider.email || "—"}</td>
        <td>{provider.phone || "—"}</td>
        <td>{provider.patient_count}</td>
        <td>
          {canWrite && (
            <ChevronDown
              size={16}
              strokeWidth={2}
              aria-hidden
              style={{
                transform: expanded ? "rotate(180deg)" : undefined,
                transition: "transform 0.15s ease",
              }}
            />
          )}
        </td>
      </tr>
      {expanded && canWrite && (
        <tr className="mc-dtable-detail">
          <td colSpan={6}>
            <div className="mc-dtable-detail-inner">
              {editing ? (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <form onSubmit={submit}>
                    <div className="mc-formgrid">
                      <div>
                        <label
                          className="mc-label"
                          htmlFor={`sp-name-${provider.id}`}
                        >
                          Name <span className="mc-req">*</span>
                        </label>
                        <input
                          id={`sp-name-${provider.id}`}
                          className="mc-input"
                          required
                          value={form.name}
                          onChange={(e) =>
                            setForm({ ...form, name: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label
                          className="mc-label"
                          htmlFor={`sp-affiliation-${provider.id}`}
                        >
                          Affiliation
                        </label>
                        <input
                          id={`sp-affiliation-${provider.id}`}
                          className="mc-input"
                          value={form.affiliation}
                          onChange={(e) =>
                            setForm({ ...form, affiliation: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label
                          className="mc-label"
                          htmlFor={`sp-phone-${provider.id}`}
                        >
                          Phone
                        </label>
                        <input
                          id={`sp-phone-${provider.id}`}
                          className="mc-input"
                          value={form.phone}
                          onChange={(e) =>
                            setForm({ ...form, phone: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label
                          className="mc-label"
                          htmlFor={`sp-email-${provider.id}`}
                        >
                          Email
                        </label>
                        <input
                          id={`sp-email-${provider.id}`}
                          className="mc-input"
                          type="email"
                          value={form.email}
                          onChange={(e) =>
                            setForm({ ...form, email: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    {updateProvider.isError && (
                      <p
                        className="mc-alert mc-alert-error"
                        style={{ marginTop: 12 }}
                      >
                        {updateProvider.error instanceof Error
                          ? updateProvider.error.message
                          : "Could not save this provider."}
                      </p>
                    )}

                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <button
                        type="button"
                        className="mc-btn-ghost mc-btn-sm"
                        onClick={onStopEdit}
                        disabled={updateProvider.isPending}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="mc-btn mc-btn-sm"
                        disabled={updateProvider.isPending}
                      >
                        {updateProvider.isPending ? "Saving…" : "Save changes"}
                      </button>
                    </div>
                  </form>
                </motion.div>
              ) : (
                <div
                  style={{ display: "flex", gap: 8 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {!confirmingDelete ? (
                    <>
                      <button
                        type="button"
                        className="mc-btn-ghost mc-btn-sm"
                        onClick={onStartEdit}
                      >
                        <Pencil size={13} strokeWidth={2} aria-hidden /> Edit
                      </button>
                      <button
                        type="button"
                        className="mc-btn-ghost mc-btn-sm mc-btn-danger"
                        onClick={() => setConfirmingDelete(true)}
                      >
                        <Trash2 size={13} strokeWidth={2} aria-hidden /> Remove
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="mc-hint">Remove this contact?</span>
                      <button
                        type="button"
                        className="mc-btn-ghost mc-btn-sm"
                        onClick={() => setConfirmingDelete(false)}
                        disabled={deleteProvider.isPending}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="mc-btn mc-btn-sm"
                        style={{ background: "var(--c-high)" }}
                        disabled={deleteProvider.isPending}
                        onClick={() => deleteProvider.mutate(provider.id)}
                      >
                        {deleteProvider.isPending ? "Removing…" : "Confirm"}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </Fragment>
  );
}

"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Contact, Plus, Search, X } from "lucide-react";

import { usePortal } from "@/app/(portal)/dashboard/layout";
import {
  useCreateSecondaryProvider,
  useSecondaryProviders,
} from "@/features/secondary-providers/hooks/useSecondaryProviders";
import type { SecondaryProviderInput } from "@/features/secondary-providers/types";
import { SortableHeader, type SortDirection } from "@/shared/ui/SortableHeader";
import { Card, CardBody } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { RowSkeleton } from "@/shared/ui/RowSkeleton";
import { ProviderActionMenu } from "./ProviderActionMenu";

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
        {providersQuery.isSuccess && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              flexWrap: "wrap",
              padding: "14px 20px 0",
            }}
          >
            <div style={{ position: "relative", maxWidth: 320, flex: 1 }}>
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
          </div>
        )}

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
          (rows.length === 0 ? (
            <CardBody>
              <EmptyState
                icon={<Contact size={20} strokeWidth={1.9} aria-hidden />}
                title={
                  providers.length === 0
                    ? "No secondary providers yet"
                    : "No providers match"
                }
                text={
                  providers.length === 0
                    ? "Nearby clinicians a patient sees when the main hospital isn't reachable will appear here once added."
                    : "Try a different search term."
                }
              />
            </CardBody>
          ) : (
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
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((provider) => (
                    <tr key={provider.id} className="mc-dtable-row">
                      <td>
                        <div className="mc-dtable-primary">{provider.name}</div>
                      </td>
                      <td>{provider.affiliation || "—"}</td>
                      <td>{provider.email || "—"}</td>
                      <td>{provider.phone || "—"}</td>
                      <td>{provider.patient_count}</td>
                      <td>
                        {canWrite && <ProviderActionMenu provider={provider} />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
      </Card>
    </>
  );
}

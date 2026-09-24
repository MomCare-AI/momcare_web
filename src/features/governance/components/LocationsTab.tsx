"use client";

import { useState } from "react";
import { AlertCircle, MapPin, Plus, X } from "lucide-react";

import { usePortal } from "@/app/(portal)/dashboard/layout";
import { useStaffList } from "@/features/staff/hooks/useStaff";
import {
  useCreateLocation,
  useLocations,
} from "@/features/locations/hooks/useLocations";
import type { LocationCreateInput } from "@/features/locations/types";
import { LocationsTable } from "@/features/locations/components/LocationsTable";
import { Card, CardBody, CardHeader } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { RowSkeleton } from "@/shared/ui/RowSkeleton";

const MANAGER_ROLE_CODES = new Set([
  "hospital_admin",
  "provider",
  "nurse",
  "care_manager",
]);

const EMPTY_FORM: LocationCreateInput = {
  name: "",
  location_manager: "",
  phone: "",
  email: "",
  address_line1: "",
  city: "",
  state: "",
  postal_code: "",
  country: "",
};

export function LocationsTab() {
  const { org, isHospitalAdmin } = usePortal();
  const locationsQuery = useLocations();
  const staffQuery = useStaffList();
  const createLocation = useCreateLocation();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<LocationCreateInput>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  const locations = locationsQuery.data?.results ?? [];
  const managers = (staffQuery.data ?? []).filter((m) =>
    MANAGER_ROLE_CODES.has(m.role_code)
  );

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await createLocation.mutateAsync(form);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Could not add this location."
      );
    }
  };

  return (
    <>
      <section className="mc-kpis">
        <div className="mc-kpi">
          <div className="mc-kpi-top">
            <span className="mc-kpi-label">Locations</span>
            <span className="mc-kpi-icon mc-kpi-icon-brand">
              <MapPin size={17} strokeWidth={1.9} aria-hidden />
            </span>
          </div>
          <span className="mc-kpi-value">{org.location_count}</span>
          <span className="mc-kpi-foot">Recorded for this hospital</span>
        </div>
      </section>

      {isHospitalAdmin && showForm && (
        <Card style={{ marginBottom: 18 }}>
          <CardHeader>
            <div>
              <div className="mc-card-title">Add a location</div>
              <div className="mc-card-sub">
                A location manager is required for every site.
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <form onSubmit={submitCreate}>
              <div className="mc-formgrid">
                <div>
                  <label className="mc-label" htmlFor="new-loc-name">
                    Name <span className="mc-req">*</span>
                  </label>
                  <input
                    id="new-loc-name"
                    className="mc-input"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. City General Hospital — East Wing"
                  />
                </div>
                <div>
                  <label className="mc-label" htmlFor="new-loc-manager">
                    Location manager <span className="mc-req">*</span>
                  </label>
                  <select
                    id="new-loc-manager"
                    className="mc-input"
                    required
                    value={form.location_manager}
                    onChange={(e) =>
                      setForm({ ...form, location_manager: e.target.value })
                    }
                  >
                    <option value="" disabled>
                      Select a staff member
                    </option>
                    {managers.map((m) => (
                      <option key={m.id} value={m.user_id}>
                        {m.full_name || m.email} · {m.role_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mc-label" htmlFor="new-loc-phone">
                    Phone
                  </label>
                  <input
                    id="new-loc-phone"
                    className="mc-input"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="mc-label" htmlFor="new-loc-email">
                    Email
                  </label>
                  <input
                    id="new-loc-email"
                    className="mc-input"
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="mc-label" htmlFor="new-loc-addr1">
                    Address line 1
                  </label>
                  <input
                    id="new-loc-addr1"
                    className="mc-input"
                    value={form.address_line1}
                    onChange={(e) =>
                      setForm({ ...form, address_line1: e.target.value })
                    }
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="mc-label" htmlFor="new-loc-city">
                    City
                  </label>
                  <input
                    id="new-loc-city"
                    className="mc-input"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="mc-label" htmlFor="new-loc-state">
                    State / province
                  </label>
                  <input
                    id="new-loc-state"
                    className="mc-input"
                    value={form.state}
                    onChange={(e) =>
                      setForm({ ...form, state: e.target.value })
                    }
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="mc-label" htmlFor="new-loc-postal">
                    Postal code
                  </label>
                  <input
                    id="new-loc-postal"
                    className="mc-input"
                    value={form.postal_code}
                    onChange={(e) =>
                      setForm({ ...form, postal_code: e.target.value })
                    }
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="mc-label" htmlFor="new-loc-country">
                    Country
                  </label>
                  <input
                    id="new-loc-country"
                    className="mc-input"
                    value={form.country}
                    onChange={(e) =>
                      setForm({ ...form, country: e.target.value })
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
                disabled={createLocation.isPending}
              >
                <Plus size={15} strokeWidth={2} aria-hidden />
                {createLocation.isPending ? "Adding…" : "Add location"}
              </button>
            </form>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div>
            <div className="mc-card-title">Locations</div>
            <div className="mc-card-sub">Every site this hospital runs</div>
          </div>
          {isHospitalAdmin && (
            <button className="mc-btn" onClick={() => setShowForm((v) => !v)}>
              {showForm ? (
                <X size={15} strokeWidth={2} />
              ) : (
                <Plus size={15} strokeWidth={2} />
              )}
              {showForm ? "Cancel" : "Add location"}
            </button>
          )}
        </CardHeader>

        {locationsQuery.isPending && (
          <CardBody>
            <div className="mc-rows">
              <RowSkeleton count={3} variant="plain" />
            </div>
          </CardBody>
        )}

        {locationsQuery.isError && (
          <CardBody>
            <EmptyState
              icon={<MapPin size={20} strokeWidth={1.9} aria-hidden />}
              title="Couldn't load locations"
              text="This is a problem reaching the server, not an empty hospital. Refresh to try again."
            />
          </CardBody>
        )}

        {locationsQuery.isSuccess &&
          (locations.length === 0 ? (
            <CardBody>
              <EmptyState
                icon={<MapPin size={20} strokeWidth={1.9} aria-hidden />}
                title="No locations recorded"
                text="Sites will appear here once they're added."
              />
            </CardBody>
          ) : (
            <LocationsTable locations={locations} />
          ))}
      </Card>
    </>
  );
}

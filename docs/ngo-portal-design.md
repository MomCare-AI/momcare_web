# NGO portal — design decisions (2 Oct 2026)

Foundation shipped (demo auth, `/ngo` shell, placeholder dashboard) under `src/features/ngo`.
This file records the agreed direction for what goes on top of it.

## Purpose

NGOs (1) supply health bands to pregnant mothers and (2) run ambulances for serious cases.
The portal is organised around **bands, ambulances and cases — not patients**.

## Data boundary (hard rule)

NGO sees: band serial/status/battery/last sync; beneficiary name, area, eligibility, band held;
during an _active_ emergency only: location, callback number, coarse severity, destination hospital
(access expires when the case closes).
NGO never sees: vitals history, risk scores, obstetric history, notes, consent, hospital patient lists.

## Decisions

- **Build order:** band program first (overview, inventory, applications), emergency second, reports third.
- **Band ownership:** NGO keeps ownership, bands are on loan to the mother/hospital. Needs a loan record and return/recall flow.
- **Ambulance triggers:** mother's SOS button and hospital clinician request. A top-tier alert may _prompt_ a request but a human confirms — no auto-dispatch (thresholds not yet obstetrician-reviewed).
- Emergency lifecycle: requested → accepted → dispatched → en route → arrived → handed to hospital → closed.

## Backend dependencies (Ahmed's — frontend only defines the contract)

- NGO tenant type distinct from hospital `Organization`, with its own RLS policies and roles.
- Device ownership/loan model (today `Device` belongs to a hospital).
- Band application endpoints; emergency request + time-limited access grant; ambulance/crew/fleet models.
- Rule for which NGO receives a case when several cover an area.

## Frontend approach

Keep the repository pattern: pages → hooks → `ngoRepository` (dummy now) → swap for real API later.
Still demo-auth only; replace `ngoAuth` when a real NGO login endpoint exists.

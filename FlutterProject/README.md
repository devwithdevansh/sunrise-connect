# Sunrise Connect (Flutter app)

Parent-facing school fee management app for the Sunrise Connect backend
(Node/Express + MongoDB, GetX-based Flutter client).

## What's in this zip

This bundle contains the Dart source (`lib/`), assets, and project config
files (`pubspec.yaml`, `.gitignore`, `analysis_options.yaml`). It does
**not** include `android/`, `ios/`, or `web/` platform folders — the
original export was just the `lib/` source tree, so those need to be
generated once on your machine (see Setup, step 1).

## Setup

1. **Generate platform folders.** From inside this project's root folder, run:
   ```bash
   flutter create .
   ```
   This safely fills in the missing `android/`, `ios/`, `web/`, etc.
   folders without touching `lib/`, `pubspec.yaml`, or anything already here.

2. **Configure the staff-bypass credentials** (see Security section below
   for why this exists and why it's risky):
   ```bash
   cp assets/config/staff_config.example.json assets/config/staff_config.json
   ```
   Then edit `staff_config.json` and fill in the real staff email/password.
   This file is gitignored and will not be committed.

3. **Point the app at your backend.** `lib/core/config/env.dart` is the
   single source of truth for the base URL. Defaults:
   - Android emulator → `http://10.0.2.2:3000/api/v1`
   - iOS simulator / web → `http://localhost:3000/api/v1`
   - Physical device → set `_lanOverrideIp` in `env.dart` to your backend
     machine's LAN IP (e.g. `192.168.1.50`).

4. **Install dependencies and run:**
   ```bash
   flutter pub get
   flutter run
   ```

Backend must be running on port `3000` with base path `/api/v1` (matches
`backend/src/config/env.js` and `backend/src/app.js` as shipped).

## Security note — please read before shipping this

`ApiClient` contains a "staff token" mechanism: certain parent-facing
calls (fetching a parent's students, fee ledgers, payment history, and
*creating* payments) silently log in as a staff account in the background
and use that token instead of the logged-in parent's own token. This
exists because the backend currently restricts `GET /students`,
`GET /ledgers`, and `GET /payments` (list/filter) to `ADMIN`/`STAFF` only,
with no parent-scoped equivalent, and `GET /ledgers/:id` doesn't verify
the requesting parent actually owns that ledger.

What's been changed in this pass: the staff email/password are no longer
hardcoded in `api_client.dart`. They now live in
`assets/config/staff_config.json`, which is gitignored, loaded at runtime
via `StaffConfig`, and `.example.json`-templated for safe sharing.

What this **does not** fix: Flutter compiles whatever's on disk straight
into the built APK/IPA. Anyone who downloads the published app can pull
this file's contents back out with free tools (apktool, jadx, etc.) and
get a working staff login to every parent's fee/payment data — including
the ability to create payment records under staff authority. Moving the
file out of git stops it from leaking through your repo/GitHub history;
it does not stop it from leaking through the compiled app once you
publish.

**Recommended real fix**, whenever you're ready to revisit the backend:
add parent-scoped, ownership-checked endpoints (e.g. parents can list
*their own* children's students/ledgers/payments, and `POST /payments`
validates the ledger belongs to the authenticated parent) so the client
never needs to carry staff-level credentials at all. At that point
`getStaffToken()`/`useStaffToken` and this config file can be deleted
entirely.

## Notes on the codebase

A few files are present but unused (kept rather than deleted, in case
you want them for reference): `modules/fees/views/*` (4 files),
`modules/fees/{bindings,controllers,widgets}/fee_*.dart`,
`modules/notifications/{bindings/notification_binding.dart,
views/notification_list_view.dart, widgets/notification_widget.dart}`,
`modules/dashboard/widgets/*`, `modules/profile/{widgets/profile_widget.dart,
views/edit_profile_view.dart}`, `profile_controller.dart`,
`core/services/mock_data_service.dart`, and `data/mock/dummy_data.dart`.
The live, routed code path is in `core/routes/app_pages.dart`.

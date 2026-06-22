# Sunrise Connect — Pending Tasks
> **Date:** 2026-06-22 · **Author:** AI Review · **Scope:** Admin Frontend + Flutter Parents App

---

## Quick Reference — Bug Priority

| # | Area | Issue | Priority |
|---|------|-------|----------|
| A1 | Admin → CollectFee | Admission & Bag/Kit fee tab breaks when `isNewAdmission = true` | 🔴 Critical |
| A2 | Admin → Dashboard | Dashboard stats & "Today's Collection" uses wrong date comparison | 🔴 Critical |
| A3 | Admin → CollectFee | "Add Custom Fee" button is disabled (WIP) | 🟠 High |
| A4 | Admin → Setup | WhatsApp / Notification section not hidden / disabled | 🟠 High |
| A5 | Admin → Backend | Admin ↔ App connection fails (auth middleware disabled on payments) | 🔴 Critical |
| A6 | Admin → Students | Excel import / bulk migration UI is missing | 🟠 High |
| A7 | Admin → Setup | Setup flow not 100% complete | 🟡 Medium |
| F1 | Flutter → Dashboard | Only first child's ID shown for multi-child parents | 🔴 Critical |
| F2 | Flutter → Fees | Admission & Bag/Kit fee tiles still visible (should be removed) | 🟠 High |
| F3 | Flutter → Fees | Transport fee handling is broken | 🔴 Critical |
| F4 | Flutter → Dashboard | Pixel overflow in fee summary section | 🟡 Medium |
| F5 | Flutter → App-wide | Rate-limit (429) errors while using the app | 🔴 Critical |

---

## 🖥️ ADMIN FRONTEND — Bugs & Features

---

### A1 — 🔴 Admission Fees & Bag/Kit Fees Bug

**File:** [`CollectFee.tsx`](file:///d:/sunrise_connect/sunrise-connect/admin-frontend/src/components/CollectFee.tsx)

**What's happening:**
When a student has `isNewAdmission = true`, the **ADMISSION** and **BAG & KIT** tabs appear in the fee category tab bar (line 425–431). But when you click them, the UI looks up the ledger using `period = 'One-time'`:

```tsx
// CollectFee.tsx — line 548
getDueAmount(feeCategory, 'One-time')
```

The backend creates the Admission ledger with `feePeriod: 'Admission'` and the Bag & Kit ledger with `feePeriod: 'Bag & Kit'` (see `StudentService.js` lines 260 and 285). So `getLedger('ADMISSION', 'One-time')` always returns `undefined` — it never matches. This means:
- The "already paid" check always shows `₹0 due` even when it hasn't been paid.
- The amount shown is pulled from `feeStructures` (frontend config) not from the actual ledger's `remainingAmount`.
- Even if the admin selects it, `feesToPay.filter(f => f.ledgerId)` (line 290) strips it out, so payment silently fails.

**Fix needed:**
Change the period lookup key from `'One-time'` to `'Admission'` for the ADMISSION tab and `'Bag & Kit'` for the BAG_KIT tab in `CollectFee.tsx` lines 548, 566, 577, 586, 588, 593.

---

### A2 — 🔴 Dashboard is Bugged

**File:** [`Dashboard.tsx`](file:///d:/sunrise_connect/sunrise-connect/admin-frontend/src/components/Dashboard.tsx), [`store.tsx`](file:///d:/sunrise_connect/sunrise-connect/admin-frontend/src/store.tsx)

**What's happening:**
`Dashboard.tsx` (line 23) computes `todayString` using `new Date().toISOString().split('T')[0]` which gives UTC date. If the server or the transaction `date` field stores a different timezone offset, today's payments will be miscounted or not appear at all.

The `transactions` array is fetched from the backend's `/payments` endpoint. The backend returns `createdAt` (ISO timestamp), but `Dashboard.tsx` compares against `t.date` — a field that may be normalized differently in `store.tsx`.

Also, the "Recent Payments" table (lines 272–279) has hardcoded logic:
```tsx
tx.amount === 1500 ? (
  <span>₹1,500 <span>of ₹3,500</span></span>
```
This is mock/debug code that shouldn't be in production.

**Fix needed:**
1. Normalize `todayString` using the local timezone, not UTC.
2. Verify the `date` field on each transaction in `store.tsx` matches the format being compared.
3. Remove the hardcoded `tx.amount === 1500` display branch from the Recent Payments table.
4. The backend `DashboardService.getSystemMetrics()` does not return today's per-mode breakdown — the frontend needs to either call the backend correctly or the backend needs a `/dashboard/today` endpoint.

---

### A3 — 🟠 Additional Fees with Custom Name (WIP Feature)

**File:** [`CollectFee.tsx`](file:///d:/sunrise_connect/sunrise-connect/admin-frontend/src/components/CollectFee.tsx) — line 390–396

**What's happening:**
There is a disabled **"Add Custom Fee (WIP)"** button on the CollectFee screen:
```tsx
<button type="button" disabled ...>
  <Plus /> Add Custom Fee (WIP)
</button>
```

**What's needed:**
A new fee category of type `OTHER` with a custom name (e.g., "Annual Day Fee", "Sports Kit") that can be collected as a one-time fee for a specific student without creating a full ledger entry.

**Implementation plan:**
1. **Backend:** Add `POST /api/v1/ledger/custom` endpoint that creates a single ad-hoc `StudentFeeLedger` with `feeType: 'OTHER'`, a custom `feePeriod` name, and an `amount` provided by the admin.
2. **Admin Frontend:** Activate the "Add Custom Fee" button — open a modal where the admin enters:
   - Custom fee name (e.g., "Annual Day")
   - Amount
   Then immediately add it to the student's ledger and to the cart.

---

### A4 — 🟠 Disable WhatsApp & Notification Sections

**What's happening:**
The setup section or notification-related UI elements are currently visible/active. Since WhatsApp and notification integration is not yet ready, these UI elements should be hidden or shown as "Coming Soon" to prevent confusing staff.

**Fix needed:**
In the `Setup.tsx` or whichever component renders notification settings: wrap those sections in a disabled/grayed-out UI block with a label like `"Coming Soon — WhatsApp notifications will be enabled in a future update"`.

---

### A5 — 🔴 App Connection is Broken (Auth Middleware Disabled on Payments)

**File:** [`payment.routes.js`](file:///d:/sunrise_connect/sunrise-connect/backend/src/routes/payment.routes.js)

**What's happening:**
The `authenticate` middleware is commented out on all payment routes:
```js
// router.use(authenticate); // disabled for dev
```

This has two consequences:
1. `req.user` is always `undefined` inside `PaymentController` and `PaymentService` — so audit logs write `performedBy: null`.
2. The Flutter app sends a Bearer token with every payment request. If auth is not enforced, the token's validity is never verified — but if auth is **re-enabled**, the app's staff token (from `api_client.dart`) must be valid for the `/payments` POST route.

**Fix needed:**
1. Re-enable `router.use(authenticate)` in `payment.routes.js`.
2. Re-enable `router.use(authenticate)` in `ledger.routes.js` (also verify it's enabled there).
3. Verify the Flutter app's `StaffConfig` credentials are correct and the app correctly retries on 401 (the retry logic exists in `api_client.dart` lines 198–215, but only fires if auth is enforced).

---

### A6 — 🟠 Import Excel Feature for Migration is Missing

**File:** [`MigrationController.js`](file:///d:/sunrise_connect/sunrise-connect/backend/src/controllers/MigrationController.js), Admin Frontend (no UI exists yet)

**What's happening:**
The backend has a `MigrationController` and `migration.routes.js` endpoint, but there is **no UI** in the admin frontend to trigger or upload an Excel file for bulk student import.

**What's needed:**
1. **Admin Frontend — New Screen/Modal:** A "Bulk Import" button (or section under Students) where the admin can upload an `.xlsx` file.
2. **Frontend:** Parse the Excel columns (`studentName`, `parentName`, `parentMobile`, `medium`, `standard`, `division`, `transportType`, `isRTE`, `isNewAdmission`) client-side using a library like `xlsx` (SheetJS).
3. **Frontend:** Show a preview table of rows to be imported, with validation errors flagged in red.
4. **Frontend:** On confirm, call the existing migration endpoint with the parsed student array.
5. **Backend:** Verify `MigrationController` supports batch creation and returns per-row success/error status.

---

### A7 — 🟡 Setup Feature Isn't 100% Done

**File:** [`Setup.tsx`](file:///d:/sunrise_connect/sunrise-connect/admin-frontend/src/components/Setup.tsx), [`FeeStructure.tsx`](file:///d:/sunrise_connect/sunrise-connect/admin-frontend/src/components/FeeStructure.tsx)

**What's happening:**
The setup flow covers: Academic Year, Fee Categories, Fee Structures, and Transport Zones. Known gaps:

1. **Fee Category management** (`Setup.tsx` line 192) — The `ADMISSION` type is listed as a dropdown option but `BAG_KIT` is not a valid `FeeCategory` type per the model (`FeeCategory.js` line 16 only allows `EDUCATION | TERM | TRANSPORT | ADMISSION | OTHER`). The UI may allow creating an invalid category type.
2. **Notification/WhatsApp config** is referenced in setup but not fully built.
3. **Academic Year management** — only one year can be active, but there is no UI feedback if you try to add a second active year.
4. **Transport Zone** — only two zones (`Railnagar`, `Outside Railnagar`) are supported, but this constraint isn't clearly communicated to the admin in the UI.

**Fix needed:**
- Remove `BAG_KIT` from the fee category type dropdown in Setup.
- Add inline help text explaining the 2-zone transport limit.
- Add a guard in the Academic Year creation UI to prevent activating a second year.

---

## 📱 FLUTTER PARENTS APP — Bugs & Features

---

### F1 — 🔴 Same Parent, Multiple Children — Only First Child's ID Shown

**File:** [`dashboard_controller.dart`](file:///d:/sunrise_connect/sunrise-connect/FlutterProject/lib/modules/dashboard/controllers/dashboard_controller.dart) — line 88–89

**What's happening:**
When `getStudentsForParent(parentId)` returns a list with multiple students, the controller only ever uses `studentsList.first`:
```dart
final newStudent = studentsList.first;
student.value = newStudent;
```

This means only the **first child** is ever displayed. Parents with 2+ children cannot see the fees or details for their other children.

**Fix needed:**
1. Change `student` from a single `Rxn<StudentModel>` to `RxList<StudentModel> students = <StudentModel>[].obs`.
2. Add a `selectedStudentIndex = 0.obs` to track which child is currently being viewed.
3. In the dashboard UI, add a child-switcher (tab bar or dropdown at the top) with each child's name.
4. When switching children, reload fees and notifications for the newly selected student's ID.
5. Cache each child's fees separately (already keyed by `sId` so the cache pattern works).

---

### F2 — 🟠 Remove Admission / Bag & Kit Fees from Flutter App

**File:** [`fee_model.dart`](file:///d:/sunrise_connect/sunrise-connect/FlutterProject/lib/data/models/fee_model.dart), Fee-related views in `lib/modules/fees/`

**What's happening:**
The Flutter app is a **parents' view only**. Admission and Bag & Kit fees are one-time fees collected in person at the school by admin staff. Parents should not see a "Pay Now" button for these — it creates confusion and the payment flow in the app is not designed to handle one-time fees.

**Fix needed:**
1. In the fee list fetching / display logic, **filter out** ledger entries where `feeType == 'ADMISSION'` or `feeType == 'BAG_KIT'`.
2. These should also be excluded from `totalFees`, `totalPaid`, and `totalPending` aggregates in `_calculateAggregates()`.
3. The fee summary on the app should show a note like: "Admission & Bag/Kit fees are collected at school."

---

### F3 — 🔴 Transport Fee Handling is Broken

**File:** [`fee_repository.dart`](file:///d:/sunrise_connect/sunrise-connect/FlutterProject/lib/data/repositories/fee_repository.dart), [`fee_model.dart`](file:///d:/sunrise_connect/sunrise-connect/FlutterProject/lib/data/models/fee_model.dart)

**What's happening:**
Transport fees are stored as 12 individual monthly ledger entries (`feeType: 'TRANSPORT'`). The Flutter app's fee display groups all fees but does not correctly handle the transport-specific month labels. Additionally, the `FeeModel.fromJson` has a known casting bug:

```dart
// BUGGY — operator precedence issue
amount: (json['amount'] ?? json['totalAmount'] ?? 0.0 as num).toDouble(),
```

`0.0 as num` is evaluated first, meaning if both `amount` and `totalAmount` are null, the fallback evaluates incorrectly. For transport fees this becomes `0.0`, hiding actual amounts.

Also, the Flutter app attempts to make payments for transport using the same payment flow as education fees. But transport fees in the backend may need separate handling or the payment route may reject them.

**Fix needed:**
1. Fix the `fromJson` cast in `fee_model.dart`:
   ```dart
   amount: ((json['amount'] ?? json['totalAmount'] ?? 0) as num).toDouble(),
   paidAmount: ((json['paidAmount'] ?? 0) as num).toDouble(),
   remainingAmount: ((json['remainingAmount'] ?? 0) as num).toDouble(),
   ```
2. In the fee UI, group transport fees by month similar to education fees.
3. Verify the `POST /payments` route on the backend accepts `feeType: 'TRANSPORT'` ledger IDs correctly.

---

### F4 — 🟡 Pixel Overflow in Fee Summary

**File:** Fee summary widget in `lib/modules/fees/` or `lib/modules/dashboard/views/`

**What's happening:**
On smaller screen sizes (phones with ~5.5" screens), the fee summary section causes a `RenderFlex overflowed` exception — likely a Row or Column with fixed-width children that don't wrap.

**Fix needed:**
1. Identify the overflowing widget using Flutter's layout inspector or the overflow error message's widget path.
2. Wrap the problem `Row` in a `FittedBox` or use `Flexible`/`Expanded` widgets to allow children to resize.
3. Use `overflow: TextOverflow.ellipsis` on any long fee type or student name strings.
4. Test on a Pixel 4a (5.8" screen) and Galaxy A32 (6.4" screen) as minimum targets.

---

### F5 — 🔴 Rate Limit (429) Errors While Using the App

**File:** [`api_client.dart`](file:///d:/sunrise_connect/sunrise-connect/FlutterProject/lib/core/network/api_client.dart), [`rateLimit.middleware.js`](file:///d:/sunrise_connect/sunrise-connect/backend/src/middlewares/rateLimit.middleware.js)

**What's happening:**
The `authRateLimit` middleware is applied to all auth routes. The Flutter app calls `getStaffToken()` → `_performStaffLogin()` → `POST /auth/portal/login` very aggressively:
- It is called on every API request where `useStaffToken: true`.
- If the token has expired or the cached token is invalid, multiple concurrent requests all try to log in simultaneously (the `_staffTokenFuture` deduplication only partially works — it only deduplicates within one invocation cycle).
- On app resume, multiple widgets call their controllers' `onInit()` simultaneously, each triggering `getStaffToken()` before the shared `_staffTokenFuture` is set.

The 30-second throttle (`_lastStaffLoginFailed`) helps but it still means a full 30-second window of failed requests before throttling kicks in.

**Fix needed:**
1. **Deduplication fix:** Ensure `_staffTokenFuture` is set *before* `await _performStaffLogin()` is called (it currently is — verify this is actually working atomically).
2. **Token lifetime:** Increase the staff token's TTL in the backend `.env` from its current value, or pre-refresh the token 5 minutes before expiry.
3. **Rate limit adjustment:** In `rateLimit.middleware.js`, consider raising the `authRateLimit` window for portal logins from the app — or create a separate, higher-limit route for app staff logins.
4. **Long-term fix:** Add parent-scoped endpoints on the backend (`GET /students?parentId=X` is already there but requires staff auth) — ideally, use the parent's own JWT to access their own data, removing the need for a staff token entirely.

---

## 📋 Task Checklist

### Admin Frontend
- [ ] **A1** — Fix `getLedger` period key: use `'Admission'` / `'Bag & Kit'` instead of `'One-time'` in `CollectFee.tsx`
- [ ] **A2** — Fix dashboard date comparison (timezone), remove hardcoded `₹1,500 / ₹3,500` mock branch
- [ ] **A3** — Implement "Add Custom Fee" modal: backend `POST /ledger/custom` + frontend modal
- [ ] **A4** — Hide WhatsApp/Notification config in Setup with a "Coming Soon" notice
- [ ] **A5** — Re-enable `authenticate` middleware on `payment.routes.js` and `ledger.routes.js`
- [ ] **A6** — Build Excel bulk-import UI: file upload → preview table → confirm → call migration API
- [ ] **A7** — Remove BAG_KIT from fee category type dropdown; add transport zone & academic year UI guards

### Flutter App
- [ ] **F1** — Support multi-child: change `student` to `RxList`, add child-switcher UI
- [ ] **F2** — Filter out `ADMISSION` and `BAG_KIT` ledgers from all fee views and aggregates
- [ ] **F3** — Fix `FeeModel.fromJson` cast bug; fix transport fee grouping in UI
- [ ] **F4** — Fix pixel overflow in fee summary widget (use `Flexible`/`Expanded`, `TextOverflow.ellipsis`)
- [ ] **F5** — Fix staff token rate-limit: verify deduplication, raise TTL, consider parent-scoped auth

---

## 📁 Key Files Reference

| File | What it does |
|------|-------------|
| [`CollectFee.tsx`](file:///d:/sunrise_connect/sunrise-connect/admin-frontend/src/components/CollectFee.tsx) | Admin fee collection UI — all tab/ledger logic |
| [`Dashboard.tsx`](file:///d:/sunrise_connect/sunrise-connect/admin-frontend/src/components/Dashboard.tsx) | Admin dashboard — today's collection, stats |
| [`FeeStructure.tsx`](file:///d:/sunrise_connect/sunrise-connect/admin-frontend/src/components/FeeStructure.tsx) | Admin fee structure editor per class |
| [`Setup.tsx`](file:///d:/sunrise_connect/sunrise-connect/admin-frontend/src/components/Setup.tsx) | Admin initial setup — academic year, categories |
| [`store.tsx`](file:///d:/sunrise_connect/sunrise-connect/admin-frontend/src/store.tsx) | Global state + `authFetch` + `recordPayment` |
| [`StudentService.js`](file:///d:/sunrise_connect/sunrise-connect/backend/src/services/StudentService.js) | Creates student + generates all ledger entries |
| [`PaymentService.js`](file:///d:/sunrise_connect/sunrise-connect/backend/src/services/PaymentService.js) | Records payments, updates ledger, writes audit |
| [`payment.routes.js`](file:///d:/sunrise_connect/sunrise-connect/backend/src/routes/payment.routes.js) | **Auth middleware is currently disabled here** |
| [`DashboardService.js`](file:///d:/sunrise_connect/sunrise-connect/backend/src/services/DashboardService.js) | Backend metrics — does not have today's breakdown |
| [`dashboard_controller.dart`](file:///d:/sunrise_connect/sunrise-connect/FlutterProject/lib/modules/dashboard/controllers/dashboard_controller.dart) | Flutter — loads students, fees, handles payment |
| [`api_client.dart`](file:///d:/sunrise_connect/sunrise-connect/FlutterProject/lib/core/network/api_client.dart) | Flutter — all HTTP requests + staff token logic |
| [`fee_model.dart`](file:///d:/sunrise_connect/sunrise-connect/FlutterProject/lib/data/models/fee_model.dart) | Flutter — `FeeModel.fromJson` (has cast bug) |
| [`fee_repository.dart`](file:///d:/sunrise_connect/sunrise-connect/FlutterProject/lib/data/repositories/fee_repository.dart) | Flutter — fetches/pays fees via API |
| [`student_repository.dart`](file:///d:/sunrise_connect/sunrise-connect/FlutterProject/lib/data/repositories/student_repository.dart) | Flutter — `getStudentsForParent` (returns list, but only first used) |

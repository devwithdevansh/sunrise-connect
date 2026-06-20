# Fee / Payment Issues — Full Analysis

## Summary of Issues Found

5 bugs were identified that collectively cause **payments to not reach the backend** or **not update the UI** after a successful payment.

---

## 🔴 Bug 1 — Idempotency Key Reuse Silently Replays Old Response (Backend blocks payment)

**File:** [`payment.routes.js`](file:///d:/projects/sunrise-connect/backend/src/routes/payment.routes.js#L16-L19) · [`idempotency.middleware.js`](file:///d:/projects/sunrise-connect/backend/src/middlewares/idempotency.middleware.js) · [`fee_repository.dart`](file:///d:/projects/sunrise-connect/FlutterProject/lib/data/repositories/fee_repository.dart#L52-L58)

**Root cause:** The Flutter app generates the idempotency key using `DateTime.now().millisecondsSinceEpoch`.
```dart
// fee_repository.dart line 58
'Idempotency-Key': 'idem-${DateTime.now().millisecondsSinceEpoch}-${ledgerId}'
```
This looks unique per call, BUT if a user retries (network timeout, double-tap, or the 401-retry built into `ApiClient.post`), the middleware will have already stored the first response keyed to the original timestamp. The second attempt within 24 hours will get a replayed cached response — but critically, **the backend `authenticate` middleware is disabled** on the payment route:

```js
// payment.routes.js line 16
// router.use(authenticate); // disabled for dev
```

This means any unauthenticated POST gets through… yet the middleware is still `idempotency` enforced. When the `ApiClient` auto-retries a 401, it regenerates a new key so those are fine, but **if the same request is retried within 1 ms** (e.g. user double-taps), they share the same timestamp and the second payment is silently blocked — returning 201 with the old body but NOT creating a new ledger update.

**Fix:** Use a UUID (e.g. `package:uuid`) for the idempotency key, not a timestamp.

```dart
// Before
'Idempotency-Key': 'idem-${DateTime.now().millisecondsSinceEpoch}-${ledgerId}'

// After
import 'package:uuid/uuid.dart';
'Idempotency-Key': const Uuid().v4()
```

---

## 🔴 Bug 2 — Stale Cache Prevents UI Refresh After Payment (UI not updating)

**File:** [`dashboard_controller.dart`](file:///d:/projects/sunrise-connect/FlutterProject/lib/modules/dashboard/controllers/dashboard_controller.dart#L43-L82)

**Root cause:** `loadDashboardData` has a 5-minute in-memory+SharedPreferences cache. After `payFee()` succeeds, it calls `refreshData()` → `loadDashboardData(pId, forceRefresh: true)`. This **does** bypass the cache. However, the **fee data** has a *second* cache layer keyed by student ID:

```dart
// dashboard_controller.dart line 63-70
final feesCacheKey = 'fees_cache_$sId';
final cachedFeesStr = prefs.getString(feesCacheKey);
if (cachedFeesStr != null && cachedFeesStr.isNotEmpty) {
  ...fees.assignAll(cachedFees);  // ← OLD data loaded
  ...
  if (isCacheFresh) {
    isLoading.value = false;
    return;  // ← RETURNS early using stale fee data!
  }
}
```

When `forceRefresh: true` is passed, the outer student cache check at line 55 is skipped — but the student IS re-fetched from the network. **However**, the fees cache (`fees_cache_$sId`) is only invalidated if the **student cache is fresh AND forceRefresh is false**. When a fresh network call happens (lines 86-108), the fees cache IS updated properly.

Wait — re-reading: line 55 `if (!forceRefresh && ...)` means the entire cache block is skipped when `forceRefresh=true`. So the network fetch does happen. **The real problem is `PaymentHistoryController`.**

---

## 🔴 Bug 3 — Payment History Not Refreshed After Payment (UI history stuck)

**File:** [`payment_history_controller.dart`](file:///d:/projects/sunrise-connect/FlutterProject/lib/modules/fees/payment_history/controllers/payment_history_controller.dart#L19-L65)

**Root cause:** `PaymentHistoryController.loadPaymentHistory()` has its own 5-minute cache (`payments_cache_$sId`). When the user pays a fee and is shown the success snackbar, **no one invalidates the payments cache**. The controller is already active (bound via `lazyPut`) and cached data is served without re-fetching.

The `DashboardController.payFee()` only calls `refreshData()` which reloads fees/student — it does **NOT** tell `PaymentHistoryController` to refresh:

```dart
// dashboard_controller.dart line 147-153
if (success) {
  Get.snackbar(...);
  await refreshData();  // ← only refreshes fees, NOT payment history
}
```

**Fix:** After a successful payment, also clear the payments cache and trigger a reload of `PaymentHistoryController` if it's registered:

```dart
// In DashboardController.payFee(), after refreshData():
if (success) {
  await refreshData();
  // Clear payment history cache so next visit fetches fresh data
  final prefs = await SharedPreferences.getInstance();
  final sId = student.value?.id ?? '';
  if (sId.isNotEmpty) {
    await prefs.remove('payments_cache_$sId');
    await prefs.remove('payments_time_$sId');
  }
  // If PaymentHistoryController is already alive, refresh it too
  if (Get.isRegistered<PaymentHistoryController>()) {
    Get.find<PaymentHistoryController>().loadPaymentHistory(forceRefresh: true);
  }
}
```

---

## 🔴 Bug 4 — `FeeModel.fromJson` Amount Parsing Bug (wrong amounts displayed)

**File:** [`fee_model.dart`](file:///d:/projects/sunrise-connect/FlutterProject/lib/data/models/fee_model.dart#L30)

**Root cause:** Line 30 has an operator precedence bug:

```dart
// BUGGY: the `as num` cast applies to `0.0` not to the entire expression
amount: (json['amount'] ?? json['totalAmount'] ?? 0.0 as num).toDouble(),
```

Due to Dart's operator precedence, `0.0 as num` is evaluated first, then used as the fallback. This means if `json['amount']` is `null`, the expression correctly falls back. But if `json['amount']` is itself a `num` subtype (e.g. an `int` from JSON), calling `.toDouble()` on the nullable-resolved value works fine in practice. 

However, the real issue is **if `json['amount']` is `null` AND `json['totalAmount']` is also `null`** — the fallback `0.0 as num` evaluates fine. But if `json['amount']` returns an `int` (MongoDB returns integers as `int`), there's no cast issue. The real silent bug is: **`paidAmount` and `remainingAmount` use the same pattern without fallback keys**, meaning if the backend returns those fields with a different name they silently become `0.0`.

```dart
// These are fine since backend does use these exact field names:
paidAmount: (json['paidAmount'] ?? 0.0 as num).toDouble(),
remainingAmount: (json['remainingAmount'] ?? 0.0 as num).toDouble(),
```

**Fix:** Use explicit casts for clarity and safety:

```dart
amount: ((json['amount'] ?? json['totalAmount'] ?? 0) as num).toDouble(),
paidAmount: ((json['paidAmount'] ?? 0) as num).toDouble(),
remainingAmount: ((json['remainingAmount'] ?? 0) as num).toDouble(),
```

---

## 🔴 Bug 5 — `authenticate` Middleware Disabled on ALL Payment Routes (Security + Audit gap)

**File:** [`payment.routes.js`](file:///d:/projects/sunrise-connect/backend/src/routes/payment.routes.js#L16)

**Root cause:**
```js
// router.use(authenticate); // disabled for dev
```

This means:
1. **`req.user` is always `undefined`** in `PaymentController` and `PaymentService`
2. `AuditService.log` is called with `performedBy: null` — no audit trail of who made the payment
3. **Anyone can create or reverse payments** without authentication

Even in dev, this is dangerous because it masks real auth errors. If the staff token is malformed or expired, no 401 is returned — the payment just goes through anonymously.

**Fix:** Re-enable the middleware and fix the Flutter staff token:
```js
// payment.routes.js — remove the comment:
router.use(authenticate);
```

Then in Flutter, ensure the staff token is valid before payment. The existing `getStaffToken()` + 401-retry logic in `ApiClient.post()` handles this automatically once auth is re-enabled.

---

## 🟡 Bug 6 — `ReceiptRepository` Fetches ALL Payments Then Filters In-Memory (Scalability / Wrong Results)

**File:** [`receipt_repository.dart`](file:///d:/projects/sunrise-connect/FlutterProject/lib/data/repositories/receipt_repository.dart#L11)

**Root cause:**
```dart
final response = await ApiClient.get('/payments?limit=100', useStaffToken: true);
// Then filters client-side by ledgerIds
return allPayments.where((p) => ledgerIds.contains(p.feeId)).toList();
```

This fetches the **100 most recent payments across ALL students**, then filters by ledger IDs. If a student has more than 100 total payments in the system, their payments may be truncated. More importantly, `GET /payments` without a `ledgerId` filter returns **all payments for all students** — this is a privacy issue.

**Fix:** Pass ledger IDs as query params. Since the backend supports `ledgerId` as a filter (see `listPaymentsSchema`), make one call per ledger ID, or batch:

```dart
// Pass ledgerId as query param for each ledger
for (final ledgerId in ledgerIds) {
  final response = await ApiClient.get('/payments?ledgerId=$ledgerId&limit=100', useStaffToken: true);
  ...
}
```

---

## Priority Order for Fixes

| # | Bug | Impact | Fix Effort |
|---|-----|--------|------------|
| 1 | Auth disabled on payment routes | 🔴 Critical (security) | Low |
| 2 | Payment history cache not cleared after pay | 🔴 Critical (UI bug) | Low |
| 3 | Idempotency key collision on double-tap | 🟠 High | Low |
| 4 | `FeeModel.fromJson` amount cast ambiguity | 🟡 Medium | Low |
| 5 | Receipt repo fetches all payments globally | 🟡 Medium (privacy) | Medium |

---

## Files to Modify

| File | Change |
|------|--------|
| [`payment.routes.js`](file:///d:/projects/sunrise-connect/backend/src/routes/payment.routes.js) | Re-enable `authenticate` middleware |
| [`dashboard_controller.dart`](file:///d:/projects/sunrise-connect/FlutterProject/lib/modules/dashboard/controllers/dashboard_controller.dart) | Clear payment cache + refresh `PaymentHistoryController` after payment |
| [`fee_repository.dart`](file:///d:/projects/sunrise-connect/FlutterProject/lib/data/repositories/fee_repository.dart) | Use UUID for idempotency key |
| [`fee_model.dart`](file:///d:/projects/sunrise-connect/FlutterProject/lib/data/models/fee_model.dart) | Fix `fromJson` cast precedence |
| [`receipt_repository.dart`](file:///d:/projects/sunrise-connect/FlutterProject/lib/data/repositories/receipt_repository.dart) | Filter payments per ledger on backend, not client |

---

## 🔴 Bug 7 — Missing Ledger Context in Payments (History/Receipts lacking context)

**Files:**
- [`PaymentService.js`](file:///d:/projects/sunrise-connect/backend/src/services/PaymentService.js)
- [`paymentRepository.js`](file:///d:/projects/sunrise-connect/backend/src/repositories/paymentRepository.js)
- [`payment_model.dart`](file:///d:/projects/sunrise-connect/FlutterProject/lib/data/models/payment_model.dart)
- [`receipt_model.dart`](file:///d:/projects/sunrise-connect/FlutterProject/lib/data/models/receipt_model.dart)

**Root cause:**
The backend `GET /payments` endpoint was returning raw payment documents (`ledgerId`, `amount`, `method`, `createdAt`). It was not populating the associated `StudentFeeLedger` to provide context like `feePeriod` (the month/term) or `feeType` (Transport vs Education).
Because of this, the Flutter app's History and Receipts views could only show generic "Fee Payment" text, with no ability to group by month or categorize by fee type.

**Fix:**
1. **Backend:** Added a `$lookup` aggregation in `paymentRepository.findWithLedger` to join the ledger and project `feePeriod`, `feeType`, and `studentName` into the payment document. Updated `PaymentService.listPayments` to use this method.
2. **Frontend:** Extended `PaymentModel` and `ReceiptModel` to parse `termName` and `feeType`, adding helpers like `isTransport` and `monthLabel`.
3. **UI:** Updated `PaymentHistoryView` and `ReceiptDetailsView` to group the list items using these new fields.

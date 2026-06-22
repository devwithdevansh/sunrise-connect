# Review of Changes - Sunrise Connect

This document outlines all code changes made to resolve authorization, payment, and test suite issues in the project.

---

## 1. Backend Route Guard Restorations

Enabled authentication and role authorization checks across backend route files.

### 📄 [student.routes.js](file:///d:/projects/sunrise-connect/backend/src/routes/student.routes.js)
```diff
-// router.use(authenticate); // disabled for dev
+router.use(authenticate);
 
-router.post('/', validate(createStudentSchema), StudentController.createStudent);
-router.get('/',     validate(listStudentsSchema),  StudentController.listStudents);
-router.get('/:id',  StudentController.getStudent);
-router.patch('/:id', validate(updateStudentSchema), StudentController.updateStudent);
+router.post('/',     authorize('ADMIN', 'STAFF'), validate(createStudentSchema), StudentController.createStudent);
+router.get('/',      authorize('ADMIN', 'STAFF'), validate(listStudentsSchema),  StudentController.listStudents);
+router.get('/:id',   authorize('ADMIN', 'STAFF'), StudentController.getStudent);
+router.patch('/:id', authorize('ADMIN', 'STAFF'), validate(updateStudentSchema), StudentController.updateStudent);
```

### 📄 [ledger.routes.js](file:///d:/projects/sunrise-connect/backend/src/routes/ledger.routes.js)
```diff
-router.post('/', validate(createLedgerSchema), LedgerController.createLedger);
-router.get('/', validate(listLedgersSchema),  LedgerController.listLedgers);
-router.get('/:id', LedgerController.getLedger);
-router.post('/:id/payment', validate(addPaymentSchema),  LedgerController.addPayment);
-router.post('/:id/concession', validate(concessionSchema),            LedgerController.applyConcession);
-router.patch('/:id/mark-paid', LedgerController.markAsPaid);
+router.post('/',                authorize('ADMIN', 'STAFF'), validate(createLedgerSchema), LedgerController.createLedger);
+router.get('/',                 authorize('ADMIN', 'STAFF'), validate(listLedgersSchema),  LedgerController.listLedgers);
+router.get('/:id',              authorize('ADMIN', 'STAFF', 'parent'), LedgerController.getLedger);
+router.post('/:id/payment',     authorize('ADMIN', 'STAFF'), validate(addPaymentSchema),  LedgerController.addPayment);
+router.post('/:id/concession',  authorize('ADMIN'), validate(concessionSchema),            LedgerController.applyConcession);
+router.patch('/:id/mark-paid',  authorize('ADMIN', 'STAFF'), LedgerController.markAsPaid);
```

### 📄 [payment.routes.js](file:///d:/projects/sunrise-connect/backend/src/routes/payment.routes.js)
```diff
-router.post('/', idempotency, validate(createPaymentSchema), PaymentController.createPayment);
-router.get('/', validate(listPaymentsSchema), PaymentController.listPayments);
-router.get('/:id', PaymentController.getPayment);
-router.post('/:id/reverse', validate(reversePaymentSchema), PaymentController.reversePayment);
+router.post('/',           authorize('ADMIN', 'STAFF'), idempotency, validate(createPaymentSchema), PaymentController.createPayment);
+router.get('/',            authorize('ADMIN', 'STAFF'), validate(listPaymentsSchema), PaymentController.listPayments);
+router.get('/:id',         authorize('ADMIN', 'STAFF'), PaymentController.getPayment);
+router.post('/:id/reverse', authorize('ADMIN'), validate(reversePaymentSchema), PaymentController.reversePayment);
```

### 📄 [audit.routes.js](file:///d:/projects/sunrise-connect/backend/src/routes/audit.routes.js)
```diff
-// router.use(authenticate, authorize('ADMIN'));
+router.use(authenticate, authorize('ADMIN'));
```

---

## 2. Payment Concession Handling

Updated [PaymentService.js](file:///d:/projects/sunrise-connect/backend/src/services/PaymentService.js) to accept, apply, and save concessions when recording payments.

### 📄 [PaymentService.js](file:///d:/projects/sunrise-connect/backend/src/services/PaymentService.js)
```diff
   /** Create a payment and atomically update the ledger paidAmount */
-  static async createPayment({ ledgerId, amount, method, details = {}, performedBy = null }) {
+  static async createPayment({ ledgerId, amount, concessionAmount = 0, method, details = {}, performedBy = null }) {
     if (amount <= 0) throw new AppError('Payment amount must be positive', 400);
     const session = await mongoose.startSession();
     session.startTransaction();
@@ -21,23 +21,24 @@ class PaymentService {
       if (!ledger) throw new AppError('Ledger not found', 404);
 
       const newPaid = ledger.paidAmount + amount;
-      const remaining = ledger.totalAmount - newPaid - ledger.concessionAmount;
+      const newConcession = ledger.concessionAmount + concessionAmount;
+      const remaining = ledger.totalAmount - newPaid - newConcession;
       if (remaining < 0) throw new AppError('Over‑payment not allowed', 400);
 
       const status = remaining === 0 ? 'PAID' : 'PARTIAL';
       // Insert payment record
-      const payment = await paymentRepository.create({ ledgerId, amount, method, details }, { session });
+      const payment = await paymentRepository.create({ ledgerId, amount, concessionAmount, method, details }, { session });
 
       // Atomic OCC ledger update
       const updateResult = await ledgerRepository.updateOne(
         { _id: ledgerId, __v: ledger.__v },
-        { $set: { paidAmount: newPaid, remainingAmount: remaining, status }, $inc: { __v: 1 } },
+        { $set: { paidAmount: newPaid, concessionAmount: newConcession, remainingAmount: remaining, status }, $inc: { __v: 1 } },
         { session }
       );
       if (updateResult.modifiedCount !== 1) throw new AppError('Concurrency conflict', 409);
 
       await AuditService.log(
-        { performedBy, targetLedgerId: ledgerId, action: 'PAYMENT_CREATED', details: { paymentId: payment._id, amount, method } },
+        { performedBy, targetLedgerId: ledgerId, action: 'PAYMENT_CREATED', details: { paymentId: payment._id, amount, concessionAmount, method } },
         session
       );
```

---

## 3. Backend Test Fixes

Corrected mock parameters and registered parent models to enable successful execution of the Jest tests.

### 📄 [payment.routes.test.js](file:///d:/projects/sunrise-connect/backend/src/tests/payment.routes.test.js)
```diff
   it('calls reversePayment and returns 200 for ADMIN', async () => {
     spyReverse.mockResolvedValueOnce({ _id: 'rev1', amount: -100 });
     const res = await request(app)
       .post('/api/v1/payments/pay1/reverse')
       .set('Authorization', `Bearer ${adminToken}`)
       .send({ reason: 'Mistake' });
     expect(res.status).toBe(200);
-    expect(spyReverse).toHaveBeenCalledWith({ paymentId: 'pay1', reason: 'Mistake' });
+    expect(spyReverse).toHaveBeenCalledWith({ paymentId: 'pay1', reason: 'Mistake', performedBy: 'testuser' });
   });
```

### 📄 [studentRepository.test.js](file:///d:/projects/sunrise-connect/backend/src/tests/studentRepository.test.js)
```diff
 import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
 import mongoose from 'mongoose';
 import { connect, disconnect, clearCollections } from './helpers/dbHelper.js';
 import studentRepository from '../repositories/studentRepository.js';
+import Parent from '../models/Parent.js';
```

---

## 4. Frontend Integration

Updated login flow, added token authentication/rotation wrapper, and unified fee sync hooks.

### 📄 [store.tsx](file:///d:/projects/sunrise-connect/admin-frontend/src/store.tsx)
- Replaced direct `fetch` statements with `authFetch`, which inserts JWT authorization tokens.
- Implemented `/api/v1/auth/refresh` on token expiration to rotatively refresh sessions.
- Linked portal logins to target `/api/v1/auth/portal/login`.
- Restructured `logout` to hit backend `/api/v1/auth/logout` and empty state credentials.

### 📄 [Login.tsx](file:///d:/projects/sunrise-connect/admin-frontend/src/components/Login.tsx)
- Enabled `async / await` on portal login submissions to guarantee token generation before UI redirection.

### 📄 [CollectFee.tsx](file:///d:/projects/sunrise-connect/admin-frontend/src/components/CollectFee.tsx)
- Synchronized student details immediately following a transaction update via React `useEffect` hooks.

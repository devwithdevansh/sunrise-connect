# Sunrise Connect: Complete User Guide

Welcome to **Sunrise Connect**, a comprehensive School Management System designed to handle student registrations, fee configurations, ledger management, and payment collections. This guide will walk you through the proper workflow to use the system effectively.

---

## 1. Initial System Setup (The Foundation)

Before you can register students or collect fees, you must configure the core financial rules of the school. All of this is done in the **Setup** section of the admin panel.

### A. Academic Years
- **What it is**: Defines the current operational year of the school (e.g., `2026-2027`).
- **How to use**: Ensure you have an active academic year. Only one year can be active at a time. The active year dictates which ledger records are updated when payments are made.

### B. Fee Categories
- **What it is**: The different *types* of fees the school collects (e.g., Monthly Tuition Fee, Term Fee, Admission Fee, Transport Fee).
- **How to use**: You can view and manage these categories under the **Fee Categories** tab inside Setup. They are essential because they categorize every payment transaction in the system for accounting purposes.
- **Supported types**: `EDUCATION`, `TERM`, `TRANSPORT`, `ADMISSION`, `OTHER`.

> **Note:** `BAG_KIT` is a separate fee type used inside student ledgers for Bag & Kit charges. It is **not** a Fee Category type and should not be created as one.

### C. Master Fee Structures (Standards)
- **What it is**: The base pricing templates for every class and medium combination.
- **How to use**:
  1. Go to the **Fee Structure** tab under Setup.
  2. Each row represents a unique **Medium + Standard** combination (e.g., English – Std 5 is a separate record from Gujarati – Std 5).
  3. To add a new class, click the **"+ Add Standard"** button, select the medium, and enter the Annual Fee. The system will automatically calculate the monthly and term breakdowns.
  4. Click the **Pencil icon** to edit the exact breakdown of any existing class (e.g., adjust the Admission Fee, Bag & Kit Fee, Term Fee, or monthly Education Fee).

### D. Transport Configuration
- **What it is**: The fee charged to students who use the school bus, based on their pickup zone.
- **Supported Zones**: The system supports exactly **two transport zones**: `Railnagar` and `Outside Railnagar`. Custom zones cannot be added.
- **How to use**: Under the Transport section of the Fee Structure tab, set or update the monthly transport fee amount for each of the two zones. Only one active rate per zone is allowed at any time.

---

## 2. Student Registration

Once the Setup is complete, you can begin enrolling students.

1. Navigate to the **Students** section.
2. Click **Add Student**.
3. Fill in the student's personal details.
4. **Critical Fields**:
   - **Standard & Medium**: These determine exactly which `Fee Structure` is applied to the student.
   - **Transport Zone**: If the student uses the school bus, select `Railnagar` or `Outside Railnagar`. If they don't use transport, select `None` (this is the default).
   - **New Admission**: If this is a newly admitted student, tick the **New Admission** checkbox. This enables the Admission Fee and Bag & Kit fee tabs in the Collect Fee screen for that student.
5. **Ledger Generation**: When you click Save, the system automatically creates a financial `Ledger` for the student for the active Academic Year, generating all their pending invoices (12 months of tuition, 2 terms, admission fee, transport fees, etc.) based on the Master Fee Structures configured in Step 1.

---

## 3. Fee Collection & Ledgers

The core of Sunrise Connect is the financial engine.

### Viewing a Student's Ledger
1. Go to the **Collect Fee** section.
2. Search for a student by **name** or **student code** (the system code assigned at registration) in the left panel.
3. Click on the student to load their full fee breakdown on the right. You will see tabs for **Education & Term Fees**, **Transport Fee**, and — for new admissions only — **Admission** and **Bag & Kit** fees.

### Recording a Payment
1. Select the student from the left panel in **Collect Fee**.
2. Choose the fee tab you want to collect for (e.g., **Education & Term**).
3. Click the month or term tiles to select which periods the parent is paying. The system enforces sequential order — you cannot pay a later month without clearing earlier dues.
4. Use the quick-select shortcuts: **1 Pay**, **3 Pay**, **6 Pay**, or **Select All Due** to speed up selection.
5. Select the **Payment Method**:
   - **Cash** — physical cash received at counter
   - **Cheque** — enter Cheque No. and Bank Name when prompted
   - **Card** — 2% MDR surcharge note is displayed
   - **Online / UPI** — for UPI and online transfers
   - **Net Banking** — for direct bank transfers
6. Optionally enter a **Remark** (e.g., "June advance").
7. Review the **Fee Summary** cart at the bottom, which shows all selected fees and the total payable.
8. Click **Collect Payment** to confirm. The system records the payment, updates the ledger status, and adds the transaction to the dashboard.

### Adding Custom Fees (Temporary/Other Fees)
If you need to charge a student for a one-off temporary fee (like an "Event Fee", "Late Fine", or "Damage Penalty"):
1. In the **Collect Fee** screen, after selecting the student, click the blue **+ Add Custom Fee** button on the right.
2. A popup will appear. Enter the **Fee Name / Description** and the **Amount (₹)**.
3. Click **Save Fee**. The system will instantly create a temporary `OTHER` fee ledger for that student.
4. An **OTHER** tab will appear next to the other fee categories. You can click on this tab to see the newly generated custom fee, and add it to your payment cart just like any other fee.

### Concessions & Discounts
Concessions are applied **globally** during the payment flow, not per individual line item:
1. In the **Fee Summary** section at the bottom of the Collect Fee screen, find the **Global Concession** field.
2. Choose the concession type:
   - **Fixed Amount** — deducts a fixed rupee amount from the total.
   - **Percentage** — deducts a percentage of the total selected fees.
3. Enter the value. The **Total Payable** will update instantly.
4. Proceed to click **Collect Payment** — the concession is recorded alongside the payment in the database for accurate reporting.

---

## 4. Analytics and Dashboard

To see how the school is performing financially:
1. Navigate to the **Dashboard**.
2. **Today's Total Collection**: The banner card shows today's total cash collected, split by English Medium and Gujarati Medium, along with total concessions given today.
3. **Payment Mode Breakdown**: Five cards show today's collection broken down by method — Cash, Online/UPI, Cheque, Card, and Net Banking.
4. **Summary Statistics**: Four cards give a snapshot of:
   - Total students enrolled (with English/Gujarati split)
   - Unpaid ledger count and total outstanding amount
   - Transport students (Railnagar vs. Outside breakdown)
   - RTE students (government-funded, excluded from reminders)
5. **Recent Payments**: A live table of the latest payment transactions recorded by staff, searchable by student name or code.

---

## 5. Security & Auditing

Accountability is critical in financial systems.
- **Audit Logs**: Key business events are securely logged and visible in the **Audit Log** section.
- You can filter logs to see exactly *who* performed an action, *what* changed, and *when*.

**Events that are audited include:**
- Parent account created, updated, or password set/reset
- Student created or updated
- Ledger entry created
- Payment recorded against a ledger
- Concession applied to a ledger
- Ledger status updated manually
- Payment reversed
- Bulk migration executed

> **Note:** Fee structure configuration changes (creating or editing standards and transport rates) are **not** currently captured in the Audit Log.

---

## Quick Summary Workflow
1. **Setup** your Academic Year, Fee Categories, Class Pricing, and Transport Zone rates.
2. **Register** a student (which auto-generates their pending bills for the active year).
3. **Find** their record in Collect Fee by searching by name or student code.
4. **Select** the fees being paid and apply any concessions.
5. **Collect Payment** to clear their dues.
6. **Check the Dashboard** at the end of the day to reconcile collections by payment mode.

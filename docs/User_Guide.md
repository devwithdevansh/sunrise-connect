# Sunrise Connect: Complete User Guide

Welcome to **Sunrise Connect**, a comprehensive School Management System designed to handle student registrations, fee configurations, ledger management, and payment collections. This guide will walk you through the proper workflow to use the system effectively, including all the latest features.

---

## 1. Initial System Setup (The Foundation)

Before you can register students or collect fees, you must configure the core financial rules of the school. All of this is done in the **Setup** section of the admin panel, which now supports full **CRUD (Create, Read, Update, Delete)** operations.

### A. Academic Years
- **What it is**: Defines the current operational year of the school (e.g., `2026-2027`).
- **Single Active Year**: Only **one** academic year can be active at a time. The active year dictates which ledger records are updated when payments are made.
- **How to manage**:
  - **Create**: Click **"+ Add Year"** to add a new academic year.
  - **Activate**: Click **"Set Active"** on any year card. The system automatically deactivates all other academic years in the database to guarantee database consistency.
  - **Edit**: Click the **Pencil icon** on any academic year card to modify its name, start date, or end date in a modal.
  - **Delete**: Click the **Trash icon** to delete a year. Note that you cannot delete the currently active academic year; you must set another year active first.

### B. Fee Categories
- **What it is**: The different *types* of fees the school collects (e.g., Monthly Tuition Fee, Term Fee, Admission Fee, Transport Fee).
- **Supported types**: `EDUCATION`, `TERM`, `TRANSPORT`, `ADMISSION`, `OTHER`.
- **How to manage**:
  - **Create**: Click **"+ Add Category"** to define a new fee category.
  - **Edit**: Click the **Pencil icon** in the Actions column of a category row to edit its name, type, description, or toggle its status between Active and Inactive.
  - **Delete**: Click the **Trash icon** to remove a category.
  
> [!NOTE]
> `BAG_KIT` is a separate fee type used inside student ledgers for Bag & Kit charges. It is managed automatically by the system and should **not** be created manually as a standard Fee Category.

### C. Master Fee Structures (Standards)
- **What it is**: The base pricing templates for every class and medium combination.
- **How to manage**:
  - **Add Standard**: Click the **"+ Add Standard"** button, select the class level and medium (English or Gujarati), and enter the Annual Tuition Fee.
  - **Edit Breakdown**: Click the **Pencil icon** on the standard's card to adjust the monthly Education Fee, Term Fee, Admission Fee, or Bag & Kit Fee.
  - **Deactivate**: Click the **Trash icon** to deactivate the standard. Setting `isActive: false` immediately hides the standard from registration selectors while preserving historical records.

### D. Transport Configuration
- **What it is**: The fee charged to students who use the school bus, based on their pickup zone.
- **Supported Zones**: The system supports exactly **two transport zones**: `Railnagar` and `Outside Railnagar`.
- **How to manage**:
  - **Add Zone**: Click **"+ Add Zone"** to configure transport rates.
  - **Edit**: Click the **Pencil icon** to modify the monthly amount for a zone.
  - **Deactivate**: Click the **Trash icon** to soft-delete/deactivate a zone rate. Deactivated rates are hidden from student setup screens but preserve existing student ledger data.

---

## 2. Student Registration & Inline Details

Once the Setup is complete, you can begin enrolling and managing students under the **Students** section.

### A. Registering a Student
1. Navigate to the **Students** page and click **Add Student**.
2. Fill in the student's personal details.
3. **Critical Fields**:
   - **Standard & Medium**: Determines which `Fee Structure` is applied to the student.
   - **Transport Zone**: Select `Railnagar` or `Outside Railnagar` (or `None` if they don't use the bus).
   - **New Admission**: If ticked, this enables the Admission Fee and Bag & Kit Fee ledgers for the student.
4. **Ledger Generation**: Upon saving, the system automatically creates a financial `Ledger` for the active Academic Year, generating all pending monthly and term invoices.

### B. Interactive Student Cards (Inline Details)
Instead of navigating away or redirecting to different screens, student details are managed inline on the **Students** page:
- Click **"View"** on any student card to expand it. The card expands to full width, displaying a tabbed interface:
  - **Parent & Siblings Tab**: Displays parent names, primary and secondary contacts, and lists siblings registered under the same parent.
  - **Fee Balance Ledgers Tab**: Displays a detailed breakdown of all ledgers (Education, Transport, Admission, Bag & Kit, Custom) showing total fees, paid amounts, concessions, and outstanding balances, summed at the bottom.
  - **Payment History Tab**: Displays recent transaction records, including payment dates, methods, amounts, and statuses. It features an inline **Reverse** button to instantly reverse active payments.
- Click **"Collapse"** to restore the card to its standard compact grid size.
- Click **"Collect"** to store the student's ID, redirect to the **Collect Fee** page, and pre-select that student automatically.

---

## 3. Fee Collection & Ledgers

The **Collect Fee** section is where counter staff manage payments.

### Selecting a Student
- Staff can search for a student by **name** or **student code** in the left search panel.
- Clicking a student loads their due fees and payment panel. Alternatively, clicking **"Collect"** on the **Students** card pre-selects the student automatically.

### Recording a Payment
1. Select the student and choose the fee category tab (e.g. **Education & Term**).
2. Click the month or term tiles to select which periods are being paid. The system enforces sequential order (earlier months must be cleared first).
3. Use the quick-select shortcuts: **1 Pay**, **3 Pay**, **6 Pay**, or **Select All Due**.
4. Select the **Payment Method** (Cash, Cheque, Card, Online/UPI, Net Banking).
5. Optionally enter a **Remark** (e.g. "Paid by Uncle").
6. Click **Collect Payment** to confirm. The system records the payment, updates the ledger status, and adds the transaction to the database.

### Adding Custom Fees (Temporary Fees)
1. Click the blue **"+ Add Custom Fee"** button.
2. Enter the **Fee Name / Description** and the **Amount (₹)**.
3. Click **Save Fee**. The system instantly creates an `OTHER` fee ledger for that student, which can then be selected and collected like any other fee.

### Concessions & Discounts
- In the **Fee Summary** section at the bottom of the screen, select the **Global Concession** field.
- Choose between a **Fixed Amount** (flat discount in ₹) or a **Percentage** discount.
- Enter the value, and the total payable updates instantly before payment collection.

### Grouped Fee Collection History
At the bottom of the **Collect Fee** page, the **Fee Collection History** section organizes the student's payment records into three collapsible accordion sections:
1. **Other Fees** (Admission Fee, Bag & Kit Fee, and Custom/Other Fees)
2. **Education & Term Fees** (Education Fee and Term Fee)
3. **Transport Fees** (Transport Fee)

Each group displays the item count, total collected, status badge (`PAID` or `REVERSED`), and expands to show transaction details and the **Reverse** action.

---

## 4. Analytics and Dashboard

To monitor financial performance, the **Dashboard** displays:
- **Today's Total Collection**: Total cash collected today, split by English and Gujarati mediums, along with total concessions given today.
- **Payment Mode Breakdown**: Collection breakdown by Cash, Online/UPI, Cheque, Card, and Net Banking.
- **Summary Statistics**: Student enrollment count, unpaid ledgers, transport students, and RTE student stats.
- **Recent Payments**: A live, searchable list of the latest payment transactions.

---

## 5. Security & Auditing

Accountability is critical in financial systems. The **Audit Log** records key actions:
- Parent account creation, modification, or password resets.
- Student creation and updates.
- Ledger entry generation.
- Payment collections and concessions.
- Payment reversals.
- Bulk migration execution.

---

## Quick Summary Workflow
1. **Setup**: Configure your Academic Year (set active), Fee Categories, Master Class pricing, and Transport zone rates.
2. **Register**: Enroll a student, which auto-generates their bills for the active year.
3. **Find**: Search/select the student on the Collect Fee page.
4. **Pay**: Select the due fee tiles, choose a payment method, apply concessions, and click Collect.
5. **Dashboard**: Reconcile daily collections by payment mode.

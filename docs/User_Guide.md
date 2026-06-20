# Sunrise Connect: Complete User Guide

Welcome to **Sunrise Connect**, a comprehensive School Management System designed to handle student registrations, fee configurations, ledger management, and payment collections. This guide will walk you through the proper workflow to use the system effectively.

---

## 1. Initial System Setup (The Foundation)

Before you can register students or collect fees, you must configure the core financial rules of the school. All of this is done in the **Setup** section of the admin panel.

### A. Academic Years
- **What it is**: Defines the current operational year of the school (e.g., `2026-2027`).
- **How to use**: Ensure you have an active academic year. Only one year can be active at a time. The active year dictates which ledger records are updated when payments are made.

### B. Fee Categories
- **What it is**: The different *types* of fees the school collects (e.g., Monthly Tuition Fee, Term Fee, Admission Fee, Transport Fee, Bag & Kit Fee).
- **How to use**: You can view and manage these categories. They are essential because they categorize every single payment transaction in the system for accounting purposes.

### C. Master Fee Structures (Standards)
- **What it is**: The base pricing templates for every class and medium.
- **How to use**:
  1. Go to the **Fee Structure** tab under Setup.
  2. Select a Standard from the dropdown.
  3. You will see the base pricing for both **English Medium** and **Gujarati Medium**.
  4. **To add a new class** (like Nursery or 11th Grade), click the **"+ Add Standard"** button, select the medium, and enter the Annual Fee. The system will automatically calculate the monthly and term breakdowns.
  5. Click the **Pencil icon** to edit the exact breakdown of any existing class (e.g., adjust the Admission Fee or Monthly Education Fee).

### D. Transport Zones
- **What it is**: The monthly cost for students who use the school bus, based on their pickup location.
- **How to use**: Click **"+ Add Zone"** in the Transport Configuration area to add new routes (e.g., "Railnagar", "City Center") and set their monthly rates.

---

## 2. Student Registration

Once the Setup is complete, you can begin enrolling students.

1. Navigate to the **Students** section.
2. Click **Add Student**.
3. Fill in the student's personal details.
4. **Critical Fields**:
   - **Standard & Medium**: These determine exactly which `Fee Structure` is applied to the student.
   - **Transport Zone**: If the student takes the bus, selecting a zone automatically applies the transport fee to their account. If they don't, leave it blank.
5. **Ledger Generation**: When you click save, the system does heavy lifting in the background. It automatically creates a financial `Ledger` for the student for the active Academic Year, generating all their pending invoices (12 months of tuition, 2 terms, admission fee, transport fees, etc.) based on the Master Fee Structures you configured in Step 1!

---

## 3. Fee Collection & Ledgers

The core of Sunrise Connect is the financial engine.

### Viewing a Student's Ledger
1. Go to the **Ledgers** section.
2. Search for a student by name, GR Number, or Standard.
3. Click **View Ledger** to see a complete breakdown of what they owe. You will see sections for Monthly Fees, Term Fees, and One-Time Fees (Admission/Kit).

### Recording a Payment
1. From the Ledger view, click **Record Payment**.
2. Select exactly which fees the parent is paying for (e.g., April Tuition + Term 1 + Admission).
3. Select the **Payment Method** (Cash, Card, UPI, Bank Transfer).
4. Enter an optional **Reference Number** (like a UPI transaction ID).
5. Click **Submit Payment**.
6. The system will instantly generate a digital **Receipt**, update the student's ledger to mark those months as "PAID", and record the transaction in the database.

### Concessions & Discounts
If a student is granted a scholarship or discount on a specific fee:
1. Click **Apply Concession** next to the specific unpaid fee (e.g., April Tuition).
2. Enter the concession amount and a reason (e.g., "Sibling Discount").
3. The pending amount for that month will instantly decrease.

---

## 4. Analytics and Dashboard

To see how the school is performing financially:
1. Navigate to the **Dashboard**.
2. **Key Metrics**: View Total Revenue collected today, this month, and overall.
3. **Charts**: See visual breakdowns of revenue across different Fee Categories (e.g., how much came from Tuition vs. Transport) and Payment Methods (e.g., Cash vs. UPI).
4. **Recent Transactions**: A live feed of the latest payments recorded by your staff.

---

## 5. Security & Auditing

Accountability is critical in financial systems. 
- **Audit Logs**: Every single action taken in the system (Creating a student, updating a fee structure, recording a payment) is securely logged in the **Audit** section.
- You can filter these logs to see exactly *who* made a change, *what* they changed, and *when* they changed it. This ensures complete transparency and helps trace back any mistakes.

---

## Quick Summary Workflow
1. **Setup** your Academic Year, Classes, and Pricing.
2. **Register** a student (which auto-generates their pending bills).
3. **Search** for their Ledger when they come to pay.
4. **Record Payment** to clear their dues and hand them a receipt.
5. **Check the Dashboard** at the end of the day to reconcile your cash register.

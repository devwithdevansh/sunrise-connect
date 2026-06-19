# Sunrise Connect Database Schema Documentation

This document provides a comprehensive overview of the MongoDB database schema for the **Sunrise Connect** application. It is intended for frontend developers (Admin Web and Flutter Parent App) to understand the data structures, relationships, and constraints.

## 1. User (Admins & Staff)
Handles administrative and staff accounts for the admin portal.

| Field | Type | Required | Constraints / Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `name` | String | Yes | Max 100 chars | Full name of the user. |
| `email` | String | Yes | Unique, Valid Email | Email address used for login. |
| `passwordHash` | String | Yes | Select: false | Hashed password (not returned in API responses). |
| `role` | String | Yes | `ADMIN`, `STAFF` | User role for authorization. Defaults to `STAFF`. |
| `isActive` | Boolean | No | Default: `true` | Indicates if the account is active. |
| `lastLogin` | Date | No | Default: `null` | Timestamp of the last login. |

## 2. Parent
Handles parent accounts primarily used in the Flutter App.

| Field | Type | Required | Constraints / Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `parentName` | String | Yes | Max 100 chars | Full name of the parent/guardian. |
| `primaryMobileNumber` | String | Yes | Unique, 10-digits | Primary contact number used for login. |
| `secondaryMobileNumber` | String | No | Unique (if present) | Alternative contact number. |
| `email` | String | No | Valid Email | Optional email address. |
| `address` | String | No | Max 500 chars | Residential address. |
| `passwordHash` | String | No | Select: false | Hashed password for the app. |
| `isPasswordSet` | Boolean | No | Default: `false` | Whether the parent has set up their password. |
| `isActive` | Boolean | No | Default: `true` | Account status. |

## 3. Student
Represents students enrolled in the school.

| Field | Type | Required | Constraints / Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `parentId` | ObjectId | No | Ref: `Parent` | Link to the parent account. |
| `studentCode` | String | No | Unique | Unique identifier for the student. |
| `studentName` | String | Yes | Max 100 chars | Full name of the student. |
| `medium` | String | Yes | `English`, `Gujarati` | Medium of instruction. |
| `standard` | String | Yes | - | Standard/Grade of the student. |
| `division` | String | Yes | Uppercase | Division/Section (e.g., 'A'). |
| `transportType` | String | Yes | `Railnagar`, `Outside Railnagar`, `None` | Transport opted by student. |
| `isRTE` | Boolean | No | Default: `false` | Right to Education status. |
| `isActive` | Boolean | No | Default: `true` | Enrollment status. |

*(Note: Uniqueness enforced on `parentId` + `studentName` + `medium`)*

## 4. FeeCategory
Defines the types of fees applicable in the system.

| Field | Type | Required | Constraints / Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `name` | String | Yes | Unique, Max 100 chars | Name of the fee category. |
| `type` | String | Yes | `EDUCATION`, `TERM`, `TRANSPORT`, `ADMISSION`, `OTHER` | Category classification. |
| `description` | String | No | Max 250 chars | Details about the category. |
| `isActive` | Boolean | No | Default: `true` | Active status. |

## 5. FeeStructure
Master fee configuration based on Medium and Standard.

| Field | Type | Required | Constraints / Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `medium` | String | Yes | `English`, `Gujarati` | Target medium. |
| `standard` | String | Yes | Unique | Target standard. |
| `annualFee` | Number | Yes | Min: 0 | Total annual base fee. |
| `educationPartCount` | Number | Yes | Min: 1, Default: 12 | Number of education fee installments. |
| `termPartCount` | Number | Yes | Min: 0, Default: 2 | Number of term fee installments. |
| `admissionFee` | Number | No | Min: 0, Default: 0 | One-time admission fee. |
| `bagKitFee` | Number | No | Min: 0, Default: 0 | Bag & Kit charges. |
| `termFee` | Number | No | Min: 0, Default: 0 | Term fee amount. |
| `applicableFeeCategories`| [ObjectId] | Yes | Ref: `FeeCategory` | List of applicable fee categories. |
| `isActive` | Boolean | No | Default: `true` | Active status. |

*(Note: Compound unique index on `medium` + `standard`)*

## 6. TransportFeeStructure
Master configuration for transport fees.

| Field | Type | Required | Constraints / Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `transportType` | String | Yes | `Railnagar`, `Outside Railnagar` | Route/Area classification. |
| `amount` | Number | Yes | Min: 0 | Fee amount. |
| `frequency` | String | Yes | `MONTHLY`, `QUARTERLY`, `YEARLY` | Frequency of the fee (Default: `MONTHLY`). |
| `isActive` | Boolean | No | Default: `true` | Active status. Only 1 active per `transportType`. |

## 7. StudentFeeLedger
Core financial record representing a specific fee due for a student.

| Field | Type | Required | Constraints / Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `studentId` | ObjectId | Yes | Ref: `Student` | Associated student. |
| `academicYear` | String | Yes | e.g., `2025-26` | Target academic year. |
| `feeCategoryId` | ObjectId | Yes | Ref: `FeeCategory` | Type of fee category. |
| `feePeriod` | String | Yes | e.g., `June` or `Term 1` | Period this ledger covers. |
| `feeType` | String | Yes | `EDUCATION`, `TERM`, `TRANSPORT`, `ADMISSION`, `OTHER`, `BAG_KIT` | Specific fee type. |
| `ledgerNumber` | String | Yes | Unique | Unique identifier/invoice number. |
| `totalAmount` | Number | Yes | Min: 0 | Total billed amount. |
| `paidAmount` | Number | No | Default: 0 | Amount paid so far. |
| `concessionAmount` | Number | No | Default: 0 | Discount applied. |
| `remainingAmount` | Number | Yes | Min: 0 | Amount left to pay. |
| `status` | String | Yes | `PENDING`, `PARTIAL`, `PAID`, `WAIVED`, `CANCELLED` | Payment status. |
| `dueDate` | Date | Yes | - | Deadline for payment. |
| `source` | String | Yes | `GENERATED`, `MIGRATED`, `MANUAL` | How the ledger was created. |
| `generatedFrom` | String | Yes | `FEE_STRUCTURE`, `TRANSPORT_STRUCTURE`, `MIGRATION` | Origin of the ledger. |
| `remarks` | String | No | - | Optional notes. |
| `isArchived` | Boolean | No | Default: `false` | Used for historical data filtering. |
| `snapshot` | Object | Yes | Denormalized data | Contains `studentName`, `medium`, `standard`, `division`, `transportType`, `isRTE` for fast queries. |

*(Note: Unique on `studentId` + `feeCategoryId` + `feePeriod` + `academicYear`)*

## 8. Payment
Represents an individual payment or reversal transaction.

| Field | Type | Required | Constraints / Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `ledgerId` | ObjectId | Yes | Ref: `StudentFeeLedger` | The ledger this payment applies to. |
| `amount` | Number | Yes | - | Amount paid (negative for reversals). |
| `method` | String | Yes | `CASH`, `CHEQUE`, `ONLINE`, `UPI`, `REVERSAL` | Payment medium. |
| `details` | Mixed | No | Default: `{}` | Additional data (e.g., transaction IDs). |
| `isReversal` | Boolean | No | Default: `false` | True if this negates a previous payment. |

## 9. AuditLog
Stores business-state change events for auditing purposes.

| Field | Type | Required | Constraints / Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `performedBy` | ObjectId | No | Default: `null` | User/System that performed the action. |
| `targetParentId` | ObjectId | No | Ref: `Parent` | Affected parent account. |
| `targetStudentId` | ObjectId | No | Ref: `Student` | Affected student account. |
| `targetLedgerId` | ObjectId | No | Ref: `StudentFeeLedger`| Affected ledger. |
| `action` | String | Yes | Enumerated List | Type of action performed (e.g., `STUDENT_CREATED`, `LEDGER_PAYMENT_ADDED`). |
| `details` | Mixed | No | Default: `{}` | Additional context or payload diffs. |

## Shared Schema Behaviors
- **Timestamps**: Every collection automatically includes `createdAt` and `updatedAt` Date fields.
- **Soft Deletes vs Status**: Most collections use `isActive` or `isArchived` booleans instead of physical deletion.

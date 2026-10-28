# Backend Handoff

This document details the frontend API contracts that are currently mocked. When connecting to a real backend, replace the mock implementations inside these `*.api.js` files with real HTTP client calls. The signatures, parameter contracts, and returned data shapes should remain identical so UI components require no alterations.

---

## 1. Authentication

Accounts are company-provisioned (no public signup). School Admins manage Branch Admin credentials.

| Function | File | Parameters | Return Shape | Behavior |
| --- | --- | --- | --- | --- |
| `login` | `src/features/auth/auth.api.js` | `{ email: string, password: string }` | `Promise<User>` | Validates payload against Zod schema, checks credentials, returns authenticated user object without password. Throws `AppError(INVALID_CREDENTIALS)`. |

- **Model:** Documented in `src/models/people.js` (`User`: `id`, `name`, `email`, `role`, optional `branchId`).
- **Session:** Maintained in client memory / localStorage via `src/stores/authStore.js`.

---

## 2. Dashboard & Branch Workspace

| Function | File | Parameters | Return Shape | Behavior |
| --- | --- | --- | --- | --- |
| `getBranch` | `src/features/dashboard/branch.api.js` | `branchId: string` | `Promise<{ id, name, description }>` | Loads branch metadata for workspace headers and navigation. |
| `getBranchDashboard` | `src/features/dashboard/branch.api.js` | `branchId: string` | `Promise<{ stats, actionItems, classes }>` | Returns summary metrics (present, absent, late, rate), urgent action items, and class attendance rows. |

---

## 3. Students & Classes

| Function | File | Parameters | Return Shape | Behavior |
| --- | --- | --- | --- | --- |
| `getBranchClasses` | `src/features/classes/classes.api.js` | `branchId: string` | `Promise<Class[]>` | Returns class list with student and present counts for the branch. |
| `createClass` | `src/features/classes/classes.api.js` | `branchId: string, { grade, section, name? }` | `Promise<Class>` | Creates a new class with 0 students, validates unique grade/section in branch. |
| `updateClass` | `src/features/classes/classes.api.js` | `{ classId: string, grade?, section?, name? }` | `Promise<Class>` | Updates grade, section, or name of an existing class, checking uniqueness. |
| `getClassStudents` | `src/features/classes/classes.api.js` | `classId: string` | `Promise<Student[]>` | Loads student roster for a class with roll numbers, admission IDs, and attendance status. |
| `createStudent` | `src/features/classes/classes.api.js` | `branchId: string, { name, grade, section }` | `Promise<Student>` | Creates a single student, validates unique name in class/section, increments class student count. |
| `importStudents` | `src/features/classes/classes.api.js` | `branchId: string, records: Array<{ name, grade, section }>` | `Promise<{ importedCount: number }>` | Atomic batch import (up to 2000 rows). Rejects entire batch if any invalid section/class or duplicate found. |

---

## Error Contract

All API methods throw standard `AppError` instances from `src/lib/errors.js`:
```json
{
  "code": "ERROR_CODE_STRING",
  "message": "Human-readable description for UI",
  "fieldErrors": { "fieldName": "Field-specific validation issue" }
}
```

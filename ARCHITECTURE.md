# ARCHITECTURE.md — RuralAttend Frontend

> **Concise Architecture & Design Guide.**
> Single source of truth for the RuralAttend web frontend. For future system specifications and roadmaps, see [FUTURE.md](./FUTURE.md).

---

## 1. Scope & Product Context

RuralAttend is a frontend-only React web application built with JavaScript (no TypeScript, no backend server).
All data is served by an in-memory mock data layer with simulated latency.

- **Audience:** School Admin (organization overview) and Branch Admin (single branch management).
- **Core capabilities:**
  - Authenticated workspace with role-based routing.
  - Branch dashboard showing attendance metrics, daily class status, and action items.
  - Student and class management (class roster overview, single student creation, batch CSV/Excel import).
- **Hard boundaries:**
  - ❌ No backend or database code.
  - ❌ No attendance marking on web (teachers mark attendance on mobile).
  - ❌ No self-registration / public signup.

---

## 2. Roles & Permissions

| Role | Scope | Primary Capabilities |
|------|-------|----------------------|
| `SCHOOL_ADMIN` | Entire organization | View org-level dashboard, oversee branches, drill into branch data. |
| `BRANCH_ADMIN` | Exactly one branch | Manage branch classes, students, view attendance, review action items. |

### Access Control
- Defined in `src/lib/constants.js`: `ROLES.SCHOOL_ADMIN`, `ROLES.BRANCH_ADMIN`.
- Evaluated solely via `can(user, permission)` in `src/lib/permissions.js`. Never write hardcoded inline role comparisons in UI components.
- Routes guarded using `<RequireAuth role={...}>` in `src/features/auth/RequireAuth.jsx`.

### Demo Accounts
- School Admin: `school@demo.com` / `demo123`
- Branch Admin: `branch@demo.com` / `demo123`

---

## 3. Tech Stack

- **Runtime & Build:** React 18, Vite, JavaScript (ES2022 + JSX)
- **Routing:** React Router v6
- **Forms & Validation:** React Hook Form + Zod (`@hookform/resolvers/zod`)
- **Client State:** Zustand (`src/stores/authStore.js` for session management)
- **Icons:** `lucide-react`
- **File Parsing:** `@e965/xlsx` (CSV, XLS, XLSX parsing in browser)
- **Testing:** Vitest
- **Styling:** Vanilla CSS (`src/index.css`) with CSS custom properties

---

## 4. Project Structure

A clean, flat feature-based architecture avoiding premature nesting:

```
src/
├── app/
│   ├── App.jsx                     # Root router & route declarations
│   └── layouts/
│       ├── AuthLayout.jsx          # Public login layout
│       ├── BranchLayout.jsx        # Authenticated branch shell with sidebar & header
│       └── SchoolLayout.jsx        # Authenticated school admin shell with sidebar & header
│
├── features/                       # Flat domain feature modules
│   ├── auth/
│   │   ├── auth.api.js             # Mock authentication API
│   │   ├── auth.api.test.js
│   │   ├── AuthFields.jsx          # Email & password form fields
│   │   ├── AuthPage.jsx            # Sign-in page
│   │   ├── RequireAuth.jsx         # Route guard component
│   │   └── schemas.js              # Zod validation schemas
│   ├── school/
│   │   ├── school.api.js           # Org overview, branch CRUD, admin provisioning, analytics API
│   │   ├── school.api.test.js
│   │   ├── BranchesPage.jsx        # Campus directory & CRUD management
│   │   ├── BranchAdminsPage.jsx    # Branch administrator provisioning console
│   │   ├── SchoolAttendanceAnalyticsPage.jsx # Multi-branch attendance monitoring & CSV export
│   │   ├── SchoolSettingsPage.jsx  # Global institutional profile & settings
│   │   └── IssuedCredentialsModal.jsx # One-time credentials slip modal with Print/Copy
│   ├── dashboard/
│   │   ├── branch.api.js           # Dashboard metrics API
│   │   ├── branch.api.test.js
│   │   └── BranchDashboardPage.jsx # Branch overview page
│   ├── attendance/
│   │   ├── attendance.api.js       # Daily attendance & roll submission API
│   │   ├── attendance.api.test.js
│   │   └── AttendancePage.jsx      # Daily attendance overview & roll sheet modal
│   ├── classes/
│   │   ├── ClassesPage.jsx         # Classes and student management page
│   │   ├── classes.api.js          # Class & student roster API
│   │   ├── classes.api.test.js
│   │   ├── studentImport.js        # CSV/Excel parsing utility
│   │   └── studentImport.test.js
│   ├── teachers/
│   │   ├── TeachersPage.jsx        # Staff and mobile app credentials management
│   │   ├── teachers.api.js         # Teacher creation & allotment API
│   │   └── teachers.api.test.js
│   └── students/
│       └── StudentsPage.jsx        # Student roster overview
│
├── lib/
│   ├── constants.js                # ROLES, PERMISSIONS, limits
│   ├── errors.js                   # AppError standard class
│   └── permissions.js              # can(user, permission) helper
│
├── mocks/
│   ├── db.js                       # In-memory reactive mock data store
│   ├── delay.js                    # simulate() latency & failure helper
│   └── seed.js                     # Seed data for users, branches, classes, stats
│
├── models/
│   └── people.js                   # JSDoc entity typedefs (User, etc.)
│
├── stores/
│   └── authStore.js                # Zustand persistent user session store
│
├── index.css                       # Design system tokens and component styles
└── main.jsx                        # React root entry point
```

> **Rule on Subdirectories:** Features start flat. Only add subdirectories (e.g. `components/`) if an individual feature grows beyond 8 files.

---

## 5. Data Layer & Mock Architecture

- **Mock Isolation:** Only `*.api.js` modules inside `src/features/` may import from `src/mocks/`. Pages and components never touch mocks directly.
- **Async Simulation:** Every mock API function wraps execution with `simulate(() => { ... })` in `src/mocks/delay.js` to mirror real-world latency.
- **Error Handling:** APIs throw structured `AppError({ code, message, fieldErrors })`. Standard error codes include `INVALID_CREDENTIALS`, `BRANCH_NOT_FOUND`, `DUPLICATE_STUDENT`, `IMPORT_TOO_LARGE`.
- **Backend Swappability:** When a real backend is introduced, only the internals of `*.api.js` functions change to fetch from endpoints.

---

## 6. Routing Table

| Path | Layout | Guard | Component |
|------|--------|-------|-----------|
| `/login` | `AuthLayout` | Public | `AuthPage` |
| `/school` | `SchoolLayout` | `RequireAuth(SCHOOL_ADMIN)` | Redirects to `/school/branches` |
| `/school/branches` | `SchoolLayout` | `RequireAuth(SCHOOL_ADMIN)` | `BranchesPage` |
| `/school/admins` | `SchoolLayout` | `RequireAuth(SCHOOL_ADMIN)` | `BranchAdminsPage` |
| `/school/attendance` | `SchoolLayout` | `RequireAuth(SCHOOL_ADMIN)` | `SchoolAttendanceAnalyticsPage` |
| `/school/settings` | `SchoolLayout` | `RequireAuth(SCHOOL_ADMIN)` | `SchoolSettingsPage` |
| `/branch` | `BranchLayout` | `RequireAuth(BRANCH_ADMIN)` | Redirects to `/branch/dashboard` |
| `/branch/dashboard` | `BranchLayout` | `RequireAuth(BRANCH_ADMIN)` | `BranchDashboardPage` |
| `/branch/attendance` | `BranchLayout` | `RequireAuth(BRANCH_ADMIN)` | `AttendancePage` |
| `/branch/classes` | `BranchLayout` | `RequireAuth(BRANCH_ADMIN)` | `ClassesPage` |
| `/branch/teachers` | `BranchLayout` | `RequireAuth(BRANCH_ADMIN)` | `TeachersPage` |
| `/branch/students` | `BranchLayout` | `RequireAuth(BRANCH_ADMIN)` | `StudentsPage` |
| `*` | — | None | Redirects to `/login` |

---

## 7. Core Invariants & Conventions

1. **`not_received` ≠ `absent`:** A class whose attendance has not been submitted is marked "Not received", never "Absent".
2. **Standardized Role Names:** Always use `ROLES.SCHOOL_ADMIN` and `ROLES.BRANCH_ADMIN` from `src/lib/constants.js`.
3. **Branch Scoping:** Branch Admin queries must filter strictly by `branchId`.
4. **JSDoc Documentation:** Exported functions and components should include JSDoc comments with `@param` and `@returns`.
5. **UI States:** Data-fetching screens must handle loading, error, and content states cleanly.

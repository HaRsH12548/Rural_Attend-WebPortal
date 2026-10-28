# RuralAttend — Future System Specifications & Roadmap

This document captures specifications for features planned for future phases (beyond the initial frontend mock foundation).

---

## 1. Credential Issuance & Provisioning UX
Accounts are created top-down:
- School Admin provisions Branch Admins
- Branch Admin provisions Teachers (for mobile app)

When credentials are created or reset, the API returns a one-time `IssuedCredentials` object:
```javascript
/**
 * @typedef {Object} IssuedCredentials
 * @property {string} loginId
 * @property {string} temporaryPassword
 * @property {true} mustChangePassword
 */
```
- Temporary credentials must be shown once in a modal dialog with Print/Copy slip options.
- They must never be cached in TanStack Query, stores, or logs.

---

## 2. Audit Log System
An append-only audit trail for tracking sensitive operations across the organization:
- Entity creations/updates/deletions
- Credential issuances and password resets
- Account activations/disables
- Attendance corrections

```javascript
/**
 * @typedef {Object} AuditLogEntry
 * @property {string} id
 * @property {string} organizationId
 * @property {string} [branchId]
 * @property {string} actorId
 * @property {'SCHOOL_ADMIN'|'BRANCH_ADMIN'|'TEACHER'|'SYSTEM'} actorRole
 * @property {string} action
 * @property {string} entityType
 * @property {string} entityId
 * @property {string} summary
 * @property {Object} [before]
 * @property {Object} [after]
 * @property {string} createdAt
 */
```

---

## 3. Attendance Session & Revision Model
- Class attendance submissions are modeled as `AttendanceSession` records.
- If a class has not submitted attendance by the cutoff time, its status is `not_received` with `isOverdue: true` (never marked as `absent`).
- Corrections increment `revision` (`revision > 1`) and require an `editReason` and `lastEditedBy`.

---

## 4. Extended Roadmap (Phases 3 & 4)
- **School Admin Console**: Branch CRUD, compare branches, org-wide attendance analytics, view-as-branch read-only drilldown.
- **Reports & Exports**: CSV / PDF export generation for attendance records and summaries.
- **Teacher Assignments**: Full subject and class teacher management, temporary substitute coverage dates (`validFrom`/`validTo`).
- **Branch Settings**: Academic year definitions, weekly off days, holiday calendar, daily cutoff times.

---

## 5. Open Decisions
1. Weekly off days per branch (single Sunday vs Saturday + Sunday).
2. Report export formats (CSV only vs PDF generation in browser).
3. Student promotion and academic year rollover workflows.
4. In-app attendance correction workflows for Branch Admins.
5. Teacher mobile login identifiers (employee code vs mobile phone + PIN).

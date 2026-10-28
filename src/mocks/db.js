import {
  seededAcademicYears,
  seededAttendanceSessions,
  seededAuditLogs,
  seededBranchActionItems,
  seededBranchDashboardStats,
  seededBranches,
  seededClasses,
  seededOrganization,
  seededStudents,
  seededTeachers,
  seededUsers,
} from '@/mocks/seed';

export const db = {
  users: [...seededUsers],
  teachers: [...seededTeachers],
  branches: [...seededBranches],
  academicYears: [...seededAcademicYears],
  classes: [...seededClasses],
  students: [...seededStudents],
  branchDashboardStats: [...seededBranchDashboardStats],
  branchActionItems: [...seededBranchActionItems],
  attendanceSessions: [...seededAttendanceSessions],
  auditLogs: [...seededAuditLogs],
  organization: { ...seededOrganization },
};


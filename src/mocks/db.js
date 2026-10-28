import {
  seededAcademicYears,
  seededAttendanceSessions,
  seededBranchActionItems,
  seededBranchDashboardStats,
  seededBranches,
  seededClasses,
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
};

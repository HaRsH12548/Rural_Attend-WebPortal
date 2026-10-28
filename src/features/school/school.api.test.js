import { describe, expect, it, vi } from 'vitest';
import {
  createBranch,
  getAuditLogs,
  getBranchAdmins,
  getBranchDrilldown,
  getBranches,
  getOrganizationSettings,
  getSchoolAcademicYears,
  getSchoolAttendanceAnalytics,
  getSchoolOverview,
  provisionBranchAdmin,
  reassignBranchAdmin,
  resetBranchAdminPassword,
  toggleBranchStatus,
  updateBranch,
  updateOrganizationSettings,
  createSchoolAcademicYear,
} from './school.api';
import { db } from '@/mocks/db';

vi.mock('@/mocks/delay', () => ({
  simulate: (operation) => Promise.resolve().then(operation),
}));

describe('School Admin API', () => {
  it('loads school overview and calculates organization KPIs correctly', async () => {
    const overview = await getSchoolOverview();

    expect(overview).toHaveProperty('organization');
    expect(overview.organization.name).toBe('Rural Education Foundation');

    expect(overview.kpis).toMatchObject({
      totalBranches: expect.any(Number),
      activeBranches: expect.any(Number),
      totalStudents: expect.any(Number),
      totalTeachers: expect.any(Number),
      totalClassesToday: expect.any(Number),
      submittedClassesToday: expect.any(Number),
      pendingClassesToday: expect.any(Number),
      orgAttendanceRate: expect.any(Number),
    });

    expect(overview.kpis.totalBranches).toBeGreaterThanOrEqual(4);
    expect(overview.kpis.totalStudents).toBeGreaterThan(0);
    expect(overview.branchSummaries.length).toBeGreaterThanOrEqual(4);
  });

  it('retrieves all branches with aggregated metrics', async () => {
    const branches = await getBranches();
    expect(Array.isArray(branches)).toBe(true);
    expect(branches.length).toBeGreaterThanOrEqual(4);

    const northRift = branches.find((b) => b.id === 'branch-demo');
    expect(northRift).toBeDefined();
    expect(northRift.name).toBe('North Rift branch');
    expect(northRift.code).toBe('NRB-01');
    expect(northRift.classCount).toBe(4);
    expect(northRift.admin).toMatchObject({
      email: 'branch@demo.com',
    });
  });

  it('loads branch drilldown details in read-only mode', async () => {
    const drilldown = await getBranchDrilldown('branch-demo');
    expect(drilldown.branch.name).toBe('North Rift branch');
    expect(drilldown.classes.length).toBe(4);
    expect(drilldown.teachers.length).toBeGreaterThanOrEqual(3);
    expect(drilldown.classes[0]).toHaveProperty('status');
  });

  it('creates a new branch and provisions an admin with one-time credentials', async () => {
    const uniqueCode = `TST-${Date.now()}`;
    const result = await createBranch({
      name: 'Sunset Valley Branch',
      code: uniqueCode,
      location: 'Kitale, Trans-Nzoia',
      description: 'New model school',
      adminName: 'Alice Wekesa',
      adminEmail: `alice.${Date.now()}@school.demo`,
    });

    expect(result.branch).toBeDefined();
    expect(result.branch.name).toBe('Sunset Valley Branch');
    expect(result.branch.code).toBe(uniqueCode);
    expect(result.issuedCredentials).toBeDefined();
    expect(result.issuedCredentials.temporaryPassword).toBeDefined();
    expect(result.issuedCredentials.mustChangePassword).toBe(true);

    // Verify user exists in db
    const createdUser = db.users.find((u) => u.email === result.issuedCredentials.loginId);
    expect(createdUser).toBeDefined();
    expect(createdUser.role).toBe('BRANCH_ADMIN');
  });

  it('rejects creating a branch with a duplicate code', async () => {
    await expect(
      createBranch({
        name: 'Duplicate Branch',
        code: 'NRB-01', // already used by branch-demo
        location: 'Nowhere',
      }),
    ).rejects.toMatchObject({
      name: 'AppError',
      code: 'DUPLICATE_BRANCH_CODE',
    });
  });

  it('updates branch metadata and toggles status', async () => {
    const updated = await updateBranch({
      branchId: 'branch-valley',
      name: 'Eastern Valley Modern Campus',
      location: 'Machakos Town Center',
    });

    expect(updated.name).toBe('Eastern Valley Modern Campus');
    expect(updated.location).toBe('Machakos Town Center');

    const toggled = await toggleBranchStatus({ branchId: 'branch-valley' });
    expect(toggled.status).toBe('inactive');

    // Toggle back
    const restored = await toggleBranchStatus({ branchId: 'branch-valley' });
    expect(restored.status).toBe('active');
  });

  it('provisions a new branch admin and issues temporary credentials', async () => {
    const email = `newadmin.${Date.now()}@school.demo`;
    const result = await provisionBranchAdmin({
      name: 'Brian Kipkemboi',
      email,
      branchId: 'branch-highlands',
    });

    expect(result.user.name).toBe('Brian Kipkemboi');
    expect(result.issuedCredentials).toMatchObject({
      loginId: email,
      mustChangePassword: true,
      branchName: 'Central Highlands branch',
    });
    expect(result.issuedCredentials.temporaryPassword).toBeDefined();
  });

  it('resets a branch admin password and returns fresh temporary credentials', async () => {
    const admins = await getBranchAdmins();
    const admin = admins[0];

    const result = await resetBranchAdminPassword({ userId: admin.id });
    expect(result.issuedCredentials).toBeDefined();
    expect(result.issuedCredentials.loginId).toBe(admin.email);
    expect(result.issuedCredentials.mustChangePassword).toBe(true);
    expect(result.issuedCredentials.temporaryPassword).toBeTruthy();
  });

  it('loads multi-branch attendance analytics and respects invariant: not_received != absent', async () => {
    const analytics = await getSchoolAttendanceAnalytics();

    expect(analytics.summary).toHaveProperty('totalClasses');
    expect(analytics.summary).toHaveProperty('submittedClasses');
    expect(analytics.summary).toHaveProperty('notReceivedClasses');

    expect(Array.isArray(analytics.branchBreakdown)).toBe(true);
    expect(Array.isArray(analytics.classRecords)).toBe(true);

    // Verify there are unsubmitted classes, and they are strictly marked as 'not_received' with null counts
    const unsubmitted = analytics.classRecords.find((c) => c.status === 'not_received');
    if (unsubmitted) {
      expect(unsubmitted.presentCount).toBeNull();
      expect(unsubmitted.absentCount).toBeNull();
      expect(unsubmitted.attendanceRate).toBeNull();
    }
  });

  it('retrieves and filters audit logs', async () => {
    const allLogs = await getAuditLogs();
    expect(allLogs.length).toBeGreaterThan(0);

    const filtered = await getAuditLogs({ action: 'BRANCH_CREATED' });
    expect(filtered.every((log) => log.action === 'BRANCH_CREATED')).toBe(true);
  });

  it('loads and updates organization settings', async () => {
    const current = await getOrganizationSettings();
    expect(current).toHaveProperty('name');

    const updated = await updateOrganizationSettings({
      academicCycle: '2024–2025',
    });
    expect(updated.academicCycle).toBe('2024–2025');
  });

  it('loads organization academic years and allows creating a new academic session', async () => {
    const years = await getSchoolAcademicYears();
    expect(Array.isArray(years)).toBe(true);
    expect(years.length).toBeGreaterThanOrEqual(1);

    const activeYear = years.find((y) => y.isActive);
    expect(activeYear).toBeDefined();

    const created = await createSchoolAcademicYear({
      name: '2026–2027',
      startDate: '2026-06-01',
    });

    expect(created.name).toBe('2026–2027');
    expect(created.isActive).toBe(true);

    const refreshedYears = await getSchoolAcademicYears();
    expect(refreshedYears.some((y) => y.name === '2026–2027' && y.isActive)).toBe(true);
  });
});

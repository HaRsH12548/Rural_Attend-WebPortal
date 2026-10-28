import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getBranch, getBranchDashboard } from '@/features/dashboard/branch.api';
import { resetAcademicYears } from '@/features/academicYears/academicYears.api';

vi.mock('@/mocks/delay', () => ({
  simulate: (operation) => Promise.resolve().then(operation),
}));

describe('mock branch API', () => {
  beforeEach(() => {
    resetAcademicYears();
  });

  it('loads branch details and dashboard data by branch identifier', async () => {
    await expect(getBranch('branch-demo')).resolves.toMatchObject({
      id: 'branch-demo',
      name: 'North Rift branch',
    });

    const dashboard = await getBranchDashboard('branch-demo');
    expect(dashboard.stats).toHaveLength(4);
    expect(dashboard.actionItems).toHaveLength(3);
    expect(dashboard.classes).toHaveLength(4);
    expect(dashboard.classes[0]).toMatchObject({
      id: 'class-1a',
      studentCount: 36,
      presentToday: 32,
    });
  });

  it('returns an explicit error for an unknown branch', async () => {
    await expect(getBranchDashboard('missing-branch')).rejects.toMatchObject({
      name: 'AppError',
      code: 'BRANCH_NOT_FOUND',
    });
  });
});

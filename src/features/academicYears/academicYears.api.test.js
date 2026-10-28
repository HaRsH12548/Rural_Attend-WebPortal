import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createAcademicYear,
  getBranchAcademicYears,
  resetAcademicYears,
} from '@/features/academicYears/academicYears.api';
import { db } from '@/mocks/db';
import { seededBranches } from '@/mocks/seed';

vi.mock('@/mocks/delay', () => ({
  simulate: (operation) => Promise.resolve().then(operation),
}));

describe('academic years API', () => {
  beforeEach(() => {
    db.branches.splice(0, db.branches.length, ...seededBranches);
    resetAcademicYears();
  });

  it('loads academic years for a branch ordered by start date descending', async () => {
    const years = await getBranchAcademicYears('branch-demo');

    expect(years.length).toBeGreaterThanOrEqual(2);
    expect(years[0]).toMatchObject({
      name: '2024–2025',
      isActive: true,
      startDate: '2024-06-01',
      endDate: null,
    });
    expect(years[1]).toMatchObject({
      name: '2023–2024',
      isActive: false,
      startDate: '2023-06-01',
      endDate: '2024-05-31',
    });
  });

  it('starts a new academic year, closing the previous year with calculated end date', async () => {
    const newYear = await createAcademicYear({
      branchId: 'branch-demo',
      name: '2025–2026',
      startDate: '2025-06-01',
      carryOverClasses: true,
    });

    expect(newYear).toMatchObject({
      name: '2025–2026',
      startDate: '2025-06-01',
      endDate: null,
      isActive: true,
    });

    const years = await getBranchAcademicYears('branch-demo');
    const closedYear = years.find((y) => y.name === '2024–2025');
    expect(closedYear).toMatchObject({
      isActive: false,
      endDate: '2025-05-31',
    });

    // Verify carryover classes were copied
    const newClasses = db.classes.filter(
      (c) => c.branchId === 'branch-demo' && c.academicYearId === newYear.id,
    );
    expect(newClasses.length).toBe(4);
    expect(newClasses[0].studentCount).toBe(0);
  });

  it('prevents duplicate academic year names for the same branch', async () => {
    await expect(
      createAcademicYear({
        branchId: 'branch-demo',
        name: '2024–2025',
        startDate: '2025-06-01',
      }),
    ).rejects.toMatchObject({
      code: 'DUPLICATE_ACADEMIC_YEAR',
    });
  });

  it('validates start date format', async () => {
    await expect(
      createAcademicYear({
        branchId: 'branch-demo',
        name: '2026–2027',
        startDate: 'invalid-date',
      }),
    ).rejects.toMatchObject({
      code: 'INVALID_START_DATE',
    });
  });
});

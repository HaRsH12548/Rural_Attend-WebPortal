import { AppError } from '@/lib/errors';
import { db } from '@/mocks/db';
import { simulate } from '@/mocks/delay';

/**
 * Loads branch workspace details for a branch identifier.
 * @param {string} branchId Branch identifier.
 * @returns {Promise<{ id: string, name: string, description: string }>} Branch details.
 */
export function getBranch(branchId) {
  return simulate(() => {
    const branch = db.branches.find((item) => item.id === branchId);
    if (!branch) {
      throw new AppError({
        code: 'BRANCH_NOT_FOUND',
        message: 'The assigned branch could not be found.',
      });
    }

    return { ...branch };
  });
}

/**
 * Loads the dashboard data for a branch.
 * @param {string} branchId Branch identifier.
 * @returns {Promise<{ stats: typeof db.branchDashboardStats, actionItems: typeof db.branchActionItems, classes: typeof db.classes }>} Dashboard data.
 */
export function getBranchDashboard(branchId) {
  return simulate(() => {
    const branchExists = db.branches.some((item) => item.id === branchId);
    if (!branchExists) {
      throw new AppError({
        code: 'BRANCH_NOT_FOUND',
        message: 'Dashboard data for the assigned branch could not be found.',
      });
    }

    return {
      stats: db.branchDashboardStats
        .filter((stat) => stat.branchId === branchId)
        .map((stat) => ({ ...stat })),
      actionItems: db.branchActionItems
        .filter((item) => item.branchId === branchId)
        .map((item) => ({ ...item })),
      classes: db.classes
        .filter((classroom) => {
          if (classroom.branchId !== branchId) return false;
          const activeYear = db.academicYears?.find((ay) => ay.branchId === branchId && ay.isActive);
          return !activeYear || classroom.academicYearId === activeYear.id;
        })
        .map((classroom) => ({ ...classroom })),
    };
  });
}

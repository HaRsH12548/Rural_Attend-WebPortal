import { AppError } from '@/lib/errors';
import { db } from '@/mocks/db';
import { simulate } from '@/mocks/delay';
import { seededAcademicYears, seededClasses } from '@/mocks/seed';

let nextAcademicYearId = 1;

/**
 * Loads all academic years for a branch, ordered with newest start dates first.
 * @param {string} branchId Branch identifier.
 * @returns {Promise<Array<typeof db.academicYears[number]>>} List of academic years.
 */
export function getBranchAcademicYears(branchId) {
  return simulate(() => {
    const branchExists = db.branches.some((branch) => branch.id === branchId);
    if (!branchExists) {
      throw new AppError({
        code: 'BRANCH_NOT_FOUND',
        message: 'The branch could not be found.',
      });
    }

    return db.academicYears
      .filter((ay) => ay.branchId === branchId)
      .map((ay) => ({ ...ay }))
      .sort((a, b) => (b.startDate > a.startDate ? 1 : -1));
  });
}

/**
 * Starts a new academic year, automatically closing the previous active year.
 * The previous year's end date is set to the day before the new year's start date.
 * @param {{ branchId: string, name: string, startDate: string, carryOverClasses?: boolean }} input Academic year details.
 * @returns {Promise<typeof db.academicYears[number]>} The created academic year.
 */
export function createAcademicYear({ branchId, name, startDate, carryOverClasses = true }) {
  return simulate(() => {
    const branchExists = db.branches.some((branch) => branch.id === branchId);
    if (!branchExists) {
      throw new AppError({
        code: 'BRANCH_NOT_FOUND',
        message: 'The branch could not be found.',
      });
    }

    const trimmedName = (name ?? '').trim();
    const trimmedStartDate = (startDate ?? '').trim();

    if (!trimmedName) {
      throw new AppError({
        code: 'INVALID_ACADEMIC_YEAR',
        message: 'Academic year name is required (e.g. 2025–2026).',
      });
    }

    if (!trimmedStartDate || !/^\d{4}-\d{2}-\d{2}$/.test(trimmedStartDate)) {
      throw new AppError({
        code: 'INVALID_START_DATE',
        message: 'A valid start date is required (YYYY-MM-DD).',
      });
    }

    const nameExists = db.academicYears.some(
      (ay) => ay.branchId === branchId && ay.name.toLowerCase() === trimmedName.toLowerCase(),
    );
    if (nameExists) {
      throw new AppError({
        code: 'DUPLICATE_ACADEMIC_YEAR',
        message: `Academic year "${trimmedName}" already exists for this branch.`,
      });
    }

    // Calculate end date for previous active year (1 day before new start date)
    const startDateObj = new Date(trimmedStartDate);
    const dayBefore = new Date(startDateObj);
    dayBefore.setDate(dayBefore.getDate() - 1);
    const calculatedEndDate = dayBefore.toISOString().split('T')[0];

    // Find and close existing active academic year
    const previousActiveYear = db.academicYears.find(
      (ay) => ay.branchId === branchId && ay.isActive,
    );
    if (previousActiveYear) {
      previousActiveYear.endDate = calculatedEndDate;
      previousActiveYear.isActive = false;
    }

    const newYearId = `ay-${Date.now()}-${nextAcademicYearId++}`;
    const newAcademicYear = {
      id: newYearId,
      branchId,
      name: trimmedName,
      startDate: trimmedStartDate,
      endDate: null,
      isActive: true,
    };

    db.academicYears.push(newAcademicYear);

    // Carry over class definitions if requested
    if (carryOverClasses && previousActiveYear) {
      const sourceClasses = db.classes.filter(
        (c) => c.branchId === branchId && c.academicYearId === previousActiveYear.id,
      );

      sourceClasses.forEach((sourceClass, index) => {
        const newClass = {
          id: `class-${Date.now()}-${index + 1}`,
          branchId,
          academicYearId: newYearId,
          name: sourceClass.name,
          grade: sourceClass.grade,
          section: sourceClass.section,
          studentCount: 0,
          presentToday: 0,
        };
        db.classes.push(newClass);
      });
    }

    return { ...newAcademicYear };
  });
}

/**
 * Resets academic years and associated class states for testing.
 */
export function resetAcademicYears() {
  db.academicYears.splice(0, db.academicYears.length, ...seededAcademicYears.map((ay) => ({ ...ay })));
  db.classes.splice(0, db.classes.length, ...seededClasses.map((c) => ({ ...c })));
}

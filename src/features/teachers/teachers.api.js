import { ROLES } from '@/lib/constants';
import { AppError } from '@/lib/errors';
import { db } from '@/mocks/db';
import { simulate } from '@/mocks/delay';

/**
 * Validates basic email formatting.
 * @param {string} email Email string to validate.
 * @returns {boolean} Whether email is valid.
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

/**
 * Resolves allotted class details for a teacher.
 * @param {Array<string>} classIds Array of class IDs.
 * @returns {Array<object>} Resolved class objects.
 */
function resolveAllottedClasses(classIds = []) {
  if (!Array.isArray(classIds)) return [];
  return classIds
    .map((classId) => db.classes.find((c) => c.id === classId))
    .filter(Boolean)
    .map((c) => ({
      id: c.id,
      name: c.name,
      grade: c.grade,
      section: c.section,
      studentCount: c.studentCount || 0,
    }));
}

/**
 * Retrieves all teachers assigned to a branch with resolved class allotments.
 * @param {string} branchId Branch identifier.
 * @returns {Promise<Array<object>>} List of branch teachers.
 */
export function getBranchTeachers(branchId) {
  return simulate(() => {
    const branchExists = db.branches.some((branch) => branch.id === branchId);
    if (!branchExists) {
      throw new AppError({
        code: 'BRANCH_NOT_FOUND',
        message: 'The assigned branch could not be found.',
      });
    }

    const teachers = (db.teachers || []).filter((t) => t.branchId === branchId);

    return teachers.map((teacher) => ({
      ...teacher,
      allottedClasses: resolveAllottedClasses(teacher.allottedClassIds),
    }));
  });
}

/**
 * Creates a new teacher record, creates their mobile app credentials, and allots sections.
 * @param {{
 *   branchId: string,
 *   name: string,
 *   email: string,
 *   phone?: string,
 *   staffId: string,
 *   password?: string,
 *   designation?: string,
 *   allottedClassIds?: Array<string>,
 *   status?: 'active'|'inactive'
 * }} input Teacher creation details.
 * @returns {Promise<object>} Created teacher with resolved sections.
 */
export function createTeacher({
  branchId,
  name,
  email,
  phone = '',
  staffId,
  password = 'password123',
  designation = 'Class Teacher',
  allottedClassIds = [],
  status = 'active',
}) {
  return simulate(() => {
    const branchExists = db.branches.some((branch) => branch.id === branchId);
    if (!branchExists) {
      throw new AppError({
        code: 'BRANCH_NOT_FOUND',
        message: 'The assigned branch could not be found.',
      });
    }

    const cleanName = String(name || '').trim();
    const cleanEmail = String(email || '').toLowerCase().trim();
    const cleanStaffId = String(staffId || '').toUpperCase().trim();
    const cleanPhone = String(phone || '').trim();
    const cleanPassword = String(password || '').trim();

    if (!cleanName) {
      throw new AppError({
        code: 'INVALID_TEACHER',
        message: 'Teacher full name is required.',
      });
    }

    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      throw new AppError({
        code: 'INVALID_EMAIL',
        message: 'A valid email address is required for app login.',
      });
    }

    if (!cleanStaffId) {
      throw new AppError({
        code: 'INVALID_STAFF_ID',
        message: 'Staff ID is required.',
      });
    }

    if (!cleanPassword || cleanPassword.length < 6) {
      throw new AppError({
        code: 'INVALID_PASSWORD',
        message: 'Password must be at least 6 characters long.',
      });
    }

    // Check email uniqueness
    const emailExists =
      (db.users || []).some((u) => u.email.toLowerCase() === cleanEmail) ||
      (db.teachers || []).some((t) => t.email.toLowerCase() === cleanEmail);

    if (emailExists) {
      throw new AppError({
        code: 'DUPLICATE_EMAIL',
        message: `An account with email "${cleanEmail}" already exists.`,
      });
    }

    // Check staff ID uniqueness within branch
    const staffIdExists = (db.teachers || []).some(
      (t) => t.branchId === branchId && t.staffId.toUpperCase() === cleanStaffId,
    );

    if (staffIdExists) {
      throw new AppError({
        code: 'DUPLICATE_STAFF_ID',
        message: `A teacher with Staff ID "${cleanStaffId}" already exists in this branch.`,
      });
    }

    const teacherId = `teacher-${Date.now()}`;
    const userId = `user-teacher-${Date.now()}`;

    // Create user account for mobile app login
    const newUser = {
      id: userId,
      name: cleanName,
      email: cleanEmail,
      password: cleanPassword,
      role: ROLES.TEACHER,
      branchId,
      teacherId,
    };
    db.users = db.users || [];
    db.users.push(newUser);

    // Create teacher record
    const newTeacher = {
      id: teacherId,
      branchId,
      userId,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      staffId: cleanStaffId,
      designation: designation.trim() || 'Class Teacher',
      allottedClassIds: Array.isArray(allottedClassIds) ? allottedClassIds : [],
      status: status === 'inactive' ? 'inactive' : 'active',
      password: cleanPassword,
      createdAt: new Date().toISOString().split('T')[0],
    };

    db.teachers = db.teachers || [];
    db.teachers.push(newTeacher);

    return {
      ...newTeacher,
      allottedClasses: resolveAllottedClasses(newTeacher.allottedClassIds),
    };
  });
}

/**
 * Updates an existing teacher's profile, credentials, and section allotments.
 * @param {{
 *   teacherId: string,
 *   name?: string,
 *   email?: string,
 *   phone?: string,
 *   staffId?: string,
 *   password?: string,
 *   designation?: string,
 *   allottedClassIds?: Array<string>,
 *   status?: 'active'|'inactive'
 * }} input Teacher update payload.
 * @returns {Promise<object>} Updated teacher with resolved sections.
 */
export function updateTeacher({
  teacherId,
  name,
  email,
  phone,
  staffId,
  password,
  designation,
  allottedClassIds,
  status,
}) {
  return simulate(() => {
    const teacher = (db.teachers || []).find((t) => t.id === teacherId);
    if (!teacher) {
      throw new AppError({
        code: 'TEACHER_NOT_FOUND',
        message: 'The requested teacher could not be found.',
      });
    }

    if (name !== undefined) {
      const cleanName = String(name).trim();
      if (!cleanName) {
        throw new AppError({
          code: 'INVALID_TEACHER',
          message: 'Teacher name cannot be empty.',
        });
      }
      teacher.name = cleanName;
    }

    if (email !== undefined) {
      const cleanEmail = String(email).toLowerCase().trim();
      if (!cleanEmail || !isValidEmail(cleanEmail)) {
        throw new AppError({
          code: 'INVALID_EMAIL',
          message: 'A valid email address is required.',
        });
      }

      const duplicateEmail =
        (db.users || []).some(
          (u) => u.id !== teacher.userId && u.email.toLowerCase() === cleanEmail,
        ) ||
        (db.teachers || []).some(
          (t) => t.id !== teacherId && t.email.toLowerCase() === cleanEmail,
        );

      if (duplicateEmail) {
        throw new AppError({
          code: 'DUPLICATE_EMAIL',
          message: `An account with email "${cleanEmail}" already exists.`,
        });
      }

      teacher.email = cleanEmail;
    }

    if (staffId !== undefined) {
      const cleanStaffId = String(staffId).toUpperCase().trim();
      if (!cleanStaffId) {
        throw new AppError({
          code: 'INVALID_STAFF_ID',
          message: 'Staff ID cannot be empty.',
        });
      }

      const duplicateStaff = (db.teachers || []).some(
        (t) =>
          t.id !== teacherId &&
          t.branchId === teacher.branchId &&
          t.staffId.toUpperCase() === cleanStaffId,
      );

      if (duplicateStaff) {
        throw new AppError({
          code: 'DUPLICATE_STAFF_ID',
          message: `A teacher with Staff ID "${cleanStaffId}" already exists in this branch.`,
        });
      }

      teacher.staffId = cleanStaffId;
    }

    if (phone !== undefined) {
      teacher.phone = String(phone).trim();
    }

    if (designation !== undefined) {
      teacher.designation = String(designation).trim() || 'Class Teacher';
    }

    if (allottedClassIds !== undefined) {
      teacher.allottedClassIds = Array.isArray(allottedClassIds) ? allottedClassIds : [];
    }

    if (status !== undefined) {
      teacher.status = status === 'inactive' ? 'inactive' : 'active';
    }

    if (password !== undefined && String(password).trim()) {
      const cleanPass = String(password).trim();
      if (cleanPass.length < 6) {
        throw new AppError({
          code: 'INVALID_PASSWORD',
          message: 'Password must be at least 6 characters long.',
        });
      }
      teacher.password = cleanPass;
    }

    // Synchronize corresponding user account in db.users
    const userAccount = (db.users || []).find((u) => u.id === teacher.userId);
    if (userAccount) {
      userAccount.name = teacher.name;
      userAccount.email = teacher.email;
      if (teacher.password) {
        userAccount.password = teacher.password;
      }
    }

    return {
      ...teacher,
      allottedClasses: resolveAllottedClasses(teacher.allottedClassIds),
    };
  });
}

/**
 * Resets the app password for a teacher.
 * @param {{ teacherId: string, newPassword: string }} input Password reset parameters.
 * @returns {Promise<{ success: boolean, teacherId: string }>} Result.
 */
export function resetTeacherPassword({ teacherId, newPassword }) {
  return simulate(() => {
    const teacher = (db.teachers || []).find((t) => t.id === teacherId);
    if (!teacher) {
      throw new AppError({
        code: 'TEACHER_NOT_FOUND',
        message: 'The requested teacher could not be found.',
      });
    }

    const cleanPass = String(newPassword || '').trim();
    if (cleanPass.length < 6) {
      throw new AppError({
        code: 'INVALID_PASSWORD',
        message: 'Password must be at least 6 characters long.',
      });
    }

    teacher.password = cleanPass;

    const userAccount = (db.users || []).find((u) => u.id === teacher.userId);
    if (userAccount) {
      userAccount.password = cleanPass;
    }

    return { success: true, teacherId };
  });
}

/**
 * Deletes a teacher and removes their app login credentials.
 * @param {{ teacherId: string }} input Teacher identifier.
 * @returns {Promise<{ success: boolean, teacherId: string }>} Result.
 */
export function deleteTeacher({ teacherId }) {
  return simulate(() => {
    const teacherIndex = (db.teachers || []).findIndex((t) => t.id === teacherId);
    if (teacherIndex < 0) {
      throw new AppError({
        code: 'TEACHER_NOT_FOUND',
        message: 'The requested teacher could not be found.',
      });
    }

    const teacher = db.teachers[teacherIndex];
    db.teachers.splice(teacherIndex, 1);

    // Also remove from db.users
    const userIndex = (db.users || []).findIndex((u) => u.id === teacher.userId);
    if (userIndex >= 0) {
      db.users.splice(userIndex, 1);
    }

    return { success: true, teacherId };
  });
}

/**
 * Computes display initials for a teacher name, omitting common titles/honorifics.
 * E.g., "Mrs. Aditi Rao" -> "AR", "Mr. David Kiprotich" -> "DK", "Dr. A. Sharma" -> "AS".
 * @param {string} name Full teacher name.
 * @returns {string} Two-letter uppercase initials.
 */
export function getTeacherInitials(name = '') {
  if (!name || typeof name !== 'string') return 'T';

  // Common titles to ignore when generating avatar initials
  const titles = new Set([
    'mr', 'mr.', 'mrs', 'mrs.', 'ms', 'ms.', 'miss', 'dr', 'dr.',
    'prof', 'prof.', 'sir', 'madam', 'shri', 'smt', 'smt.', 'tr', 'tr.'
  ]);

  const cleanParts = name
    .trim()
    .split(/\s+/)
    .filter((word) => !titles.has(word.toLowerCase().replace(/[,:]/g, '')));

  if (cleanParts.length === 0) {
    const rawParts = name.trim().split(/\s+/).filter(Boolean);
    return rawParts[0] ? rawParts[0][0].toUpperCase() : 'T';
  }

  if (cleanParts.length === 1) {
    return cleanParts[0].slice(0, 2).toUpperCase();
  }

  // First letter of first name + first letter of last name
  const first = cleanParts[0][0];
  const last = cleanParts[cleanParts.length - 1][0];
  return (first + last).toUpperCase();
}


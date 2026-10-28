import { PERMISSIONS, ROLES } from '@/lib/constants';

/**
 * Checks whether a user can access a role-specific area.
 * @param {import('@/models/people').User|null} user Authenticated user, if any.
 * @param {string} action Permission identifier.
 * @returns {boolean} Whether the user has the requested access.
 */
export function can(user, action) {
  if (!user) {
    return false;
  }

  if (action === PERMISSIONS.SCHOOL_ACCESS) {
    return user.role === ROLES.SCHOOL_ADMIN;
  }

  if (action === PERMISSIONS.BRANCH_ACCESS) {
    return user.role === ROLES.BRANCH_ADMIN;
  }

  if (action === PERMISSIONS.TEACHER_ACCESS) {
    return user.role === ROLES.TEACHER;
  }

  return false;
}

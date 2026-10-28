import { Navigate } from 'react-router-dom';
import { PERMISSIONS, ROLES } from '@/lib/constants';
import { can } from '@/lib/permissions';
import { useAuthStore } from '@/stores/authStore';

/**
 * Redirects unauthenticated users to sign-in.
 * @param {{ children: import('react').ReactNode, role?: string }} props Route guard options.
 * @returns {import('react').ReactElement} The guarded route or a redirect.
 */
export function RequireAuth({ children, role }) {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const permission =
    role === ROLES.SCHOOL_ADMIN
      ? PERMISSIONS.SCHOOL_ACCESS
      : PERMISSIONS.BRANCH_ACCESS;
  if (role && !can(user, permission)) {
    return (
      <Navigate
        to={can(user, PERMISSIONS.SCHOOL_ACCESS) ? '/school/dashboard' : '/branch/attendance'}
        replace
      />
    );
  }

  return <>{children}</>;
}

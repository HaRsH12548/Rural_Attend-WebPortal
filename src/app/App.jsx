import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/app/layouts/AuthLayout';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { ROLES } from '@/lib/constants';
import { useAuthStore } from '@/stores/authStore';

const LandingPage = lazy(() => import('@/features/landing/LandingPage'));
const AuthPage = lazy(() => import('@/features/auth/AuthPage'));
const BranchLayout = lazy(() =>
  import('@/app/layouts/BranchLayout').then((module) => ({
    default: module.BranchLayout,
  })),
);
const AttendancePage = lazy(() => import('@/features/attendance/AttendancePage'));
const ClassesPage = lazy(() => import('@/features/classes/ClassesPage'));
const TeachersPage = lazy(() => import('@/features/teachers/TeachersPage'));
const StudentsPage = lazy(() => import('@/features/students/StudentsPage'));

function SchoolWorkspacePlaceholder() {
  const clearUser = useAuthStore((state) => state.clearUser);
  const navigate = useNavigate();

  function handleSignOut() {
    clearUser();
    navigate('/login', { replace: true });
  }

  return (
    <main className="workspace-placeholder">
      <div className="workspace-placeholder-card">
        <p className="eyebrow-text">RuralAttend</p>
        <h1>School workspace coming soon</h1>
        <p>A dedicated school administration workspace for this account is being prepared.</p>
        <button className="primary-button" type="button" onClick={handleSignOut}>
          Sign out
        </button>
      </div>
    </main>
  );
}

/**
 * Provides the application route tree.
 * @returns {import('react').ReactElement} The routed application.
 */
export function App() {
  return (
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route
          path="/"
          element={
            <Suspense fallback={<div className="route-loading" role="status">Loading RuralAttend…</div>}>
              <LandingPage />
            </Suspense>
          }
        />
        <Route element={<AuthLayout />}>
          <Route
            path="/login"
            element={
              <Suspense fallback={<div className="route-loading" role="status">Loading sign in…</div>}>
                <AuthPage />
              </Suspense>
            }
          />
        </Route>
        <Route
          path="/school/dashboard"
          element={
            <RequireAuth role={ROLES.SCHOOL_ADMIN}>
              <SchoolWorkspacePlaceholder />
            </RequireAuth>
          }
        />
        <Route
          path="/branch"
          element={
            <RequireAuth role={ROLES.BRANCH_ADMIN}>
              <Suspense fallback={<div className="route-loading" role="status">Loading workspace…</div>}>
                <BranchLayout />
              </Suspense>
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="attendance" replace />} />
          <Route path="dashboard" element={<Navigate to="/branch/attendance" replace />} />
          <Route
            path="attendance"
            element={
              <Suspense fallback={<div className="route-loading" role="status">Loading attendance…</div>}>
                <AttendancePage />
              </Suspense>
            }
          />
          <Route
            path="classes"
            element={
              <Suspense fallback={<div className="route-loading" role="status">Loading classes…</div>}>
                <ClassesPage />
              </Suspense>
            }
          />
          <Route
            path="teachers"
            element={
              <Suspense fallback={<div className="route-loading" role="status">Loading teachers…</div>}>
                <TeachersPage />
              </Suspense>
            }
          />
          <Route
            path="students"
            element={
              <Suspense fallback={<div className="route-loading" role="status">Loading students…</div>}>
                <StudentsPage />
              </Suspense>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

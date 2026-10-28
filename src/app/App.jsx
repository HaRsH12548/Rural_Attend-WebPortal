import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/app/layouts/AuthLayout';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { ROLES } from '@/lib/constants';
import { useAuthStore } from '@/stores/authStore';

const LandingPage = lazy(() => import('@/features/landing/LandingPage'));
const AuthPage = lazy(() => import('@/features/auth/AuthPage'));
const SchoolLayout = lazy(() =>
  import('@/app/layouts/SchoolLayout').then((module) => ({
    default: module.SchoolLayout,
  })),
);
const BranchesPage = lazy(() => import('@/features/school/BranchesPage'));
const BranchAdminsPage = lazy(() => import('@/features/school/BranchAdminsPage'));
const SchoolAttendanceAnalyticsPage = lazy(() => import('@/features/school/SchoolAttendanceAnalyticsPage'));
const SchoolSettingsPage = lazy(() => import('@/features/school/SchoolSettingsPage'));

const BranchLayout = lazy(() =>
  import('@/app/layouts/BranchLayout').then((module) => ({
    default: module.BranchLayout,
  })),
);
const AttendancePage = lazy(() => import('@/features/attendance/AttendancePage'));
const ClassesPage = lazy(() => import('@/features/classes/ClassesPage'));
const TeachersPage = lazy(() => import('@/features/teachers/TeachersPage'));
const StudentsPage = lazy(() => import('@/features/students/StudentsPage'));

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
          path="/school"
          element={
            <RequireAuth role={ROLES.SCHOOL_ADMIN}>
              <Suspense fallback={<div className="route-loading" role="status">Loading school portal…</div>}>
                <SchoolLayout />
              </Suspense>
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="branches" replace />} />
          <Route path="dashboard" element={<Navigate to="/school/branches" replace />} />
          <Route
            path="branches"
            element={
              <Suspense fallback={<div className="route-loading" role="status">Loading branches…</div>}>
                <BranchesPage />
              </Suspense>
            }
          />
          <Route
            path="admins"
            element={
              <Suspense fallback={<div className="route-loading" role="status">Loading branch admins…</div>}>
                <BranchAdminsPage />
              </Suspense>
            }
          />
          <Route
            path="attendance"
            element={
              <Suspense fallback={<div className="route-loading" role="status">Loading attendance analytics…</div>}>
                <SchoolAttendanceAnalyticsPage />
              </Suspense>
            }
          />
          <Route
            path="settings"
            element={
              <Suspense fallback={<div className="route-loading" role="status">Loading settings…</div>}>
                <SchoolSettingsPage />
              </Suspense>
            }
          />
        </Route>
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

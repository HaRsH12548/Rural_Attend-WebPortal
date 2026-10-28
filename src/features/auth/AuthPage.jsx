import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { LockKeyhole } from 'lucide-react';
import { login } from '@/features/auth/auth.api';
import { loginSchema } from '@/features/auth/schemas';
import { AuthFields } from '@/features/auth/AuthFields';
import { PERMISSIONS } from '@/lib/constants';
import { AppError } from '@/lib/errors';
import { can } from '@/lib/permissions';
import { useAuthStore } from '@/stores/authStore';

/**
 * Sign-in screen for company-provisioned school admin accounts.
 * @returns {import('react').ReactElement} The login form.
 */
export default function AuthPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [formError, setFormError] = useState('');
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  if (user) {
    return (
      <Navigate
        to={can(user, PERMISSIONS.SCHOOL_ACCESS) ? '/school/dashboard' : '/branch/attendance'}
        replace
      />
    );
  }

  /**
   * Validates credentials, then starts a persisted mock session.
   * @param {{ email: string, password: string }} values Validated form values.
   * @returns {Promise<void>} Resolves after navigation or an inline error.
   */
  async function onSubmit(values) {
    setFormError('');
    try {
      const authenticatedUser = await login(values);
      setUser(authenticatedUser);
      navigate(
        can(authenticatedUser, PERMISSIONS.SCHOOL_ACCESS)
          ? '/school/dashboard'
          : '/branch/attendance',
        { replace: true },
      );
    } catch (error) {
      if (error instanceof AppError && error.fieldErrors) {
        Object.entries(error.fieldErrors).forEach(([field, message]) => {
          if (field === 'email' || field === 'password') {
            setError(field, { type: 'server', message });
          } else {
            setFormError(message);
          }
        });
        return;
      }
      setFormError(
        error instanceof AppError
          ? error.message
          : 'We could not complete your request. Please try again.',
      );
    }
  }

  return (
    <div className="auth-form-wrap">
      <div className="auth-heading">
        <span className="auth-kicker">RURAL SCHOOL ATTENDANCE</span>
        <h2>Welcome back</h2>
        <p>A calmer, clearer school day starts here.</p>
      </div>

      {formError && (
        <div className="form-alert" role="alert">
          {formError}
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <AuthFields register={register} errors={errors} />

        <button className="primary-button" type="submit" disabled={isSubmitting}>
          <LockKeyhole className="login-button-icon" size={16} aria-hidden="true" />
          {isSubmitting ? 'Signing in…' : 'Sign in to your workspace'}
        </button>
      </form>

      <p className="password-help">
        <span>Forgot password?</span> Contact your organization administrator.
      </p>

      {import.meta.env.DEV && (
        <div className="demo-hint">
          <span className="demo-hint-icon" aria-hidden="true">
            <span className="demo-hint-dot" />
          </span>
          <span className="demo-hint-copy">
            <strong>Project evaluation mode</strong>
            <span>
              Demo accounts: school@demo.com or branch@demo.com · password: demo123
            </span>
          </span>
        </div>
      )}
    </div>
  );
}

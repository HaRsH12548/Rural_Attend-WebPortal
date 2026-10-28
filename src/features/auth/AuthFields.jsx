import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Renders the email and password inputs for admin sign-in.
 * @param {{
 *   register: import('react-hook-form').UseFormRegister<{ email: string, password: string }>,
 *   errors: import('react-hook-form').FieldErrors<{ email: string, password: string }>
 * }} props Login form configuration.
 * @returns {import('react').ReactElement} The authentication inputs.
 */
export function AuthFields({ register, errors }) {
  const [visiblePassword, setVisiblePassword] = useState(false);

  return (
    <>
      <div className="form-field">
        <label htmlFor="email">Email address</label>
        <div className={`input-wrap ${errors.email ? 'input-error' : ''}`}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="name@school.edu.in"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
            {...register('email')}
          />
        </div>
        {errors.email && (
          <span className="field-error" id="email-error">{errors.email.message}</span>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="password">Password</label>
        <div className={`input-wrap ${errors.password ? 'input-error' : ''}`}>
          <input
            id="password"
            type={visiblePassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Enter your password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'password-error' : undefined}
            {...register('password')}
          />
          <button
            className="visibility-button"
            type="button"
            aria-label={visiblePassword ? 'Hide password' : 'Show password'}
            onClick={() => setVisiblePassword((visible) => !visible)}
          >
            {visiblePassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
        {errors.password && (
          <span className="field-error" id="password-error">{errors.password.message}</span>
        )}
      </div>
    </>
  );
}

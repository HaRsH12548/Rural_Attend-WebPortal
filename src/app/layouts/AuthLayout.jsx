import { BookOpenCheck } from 'lucide-react';
import { Outlet } from 'react-router-dom';

/**
 * Split-screen login frame with a rural school illustration.
 * @returns {import('react').ReactElement} The authentication layout.
 */
export function AuthLayout() {
  return (
    <main className="auth-shell">
      <section className="auth-panel" aria-label="Administrator sign in">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">
            <BookOpenCheck size={22} strokeWidth={2.1} />
          </span>
          <span className="brand-name">RuralAttend</span>
        </div>

        <Outlet />
        <footer className="auth-footer">
          <span>© {new Date().getFullYear()} RuralAttend</span>
          <span>Demo data · no production accounts</span>
        </footer>
      </section>

      <section className="auth-story" aria-label="Rural school attendance">
        <p className="story-topline">A better school day, together</p>
        <svg
          className="school-landscape"
          viewBox="0 0 1000 900"
          preserveAspectRatio="xMidYMid slice"
          role="img"
          aria-label="A small school beneath a warm sun in a green rural landscape"
        >
          <defs>
            <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#dcebe3" />
              <stop offset="100%" stopColor="#e9ecdd" />
            </linearGradient>
          </defs>
          <rect width="1000" height="900" fill="url(#sky)" />
          <circle cx="735" cy="160" r="82" fill="#e9dfb7" opacity=".5" />
          <circle cx="735" cy="160" r="57" fill="#efcc78" />
          <path
            d="M0 427c164-66 333-94 527-106 183-12 331 0 473 43v536H0Z"
            fill="#a1c2ad"
          />
          <path
            d="m276 451 218-56c137-35 304-28 506 25v480H205Z"
            fill="#6da083"
          />
          <path d="m0 786 394-46 286 28 320 56v130H0Z" fill="#f2efdf" />
          <g
            className="school-building"
            transform="translate(0 23) scale(1 .85)"
            stroke="#355966"
            strokeWidth="3"
          >
            <path d="m410 535 128-86 129 86Z" fill="#355966" />
            <path d="M418 535h241v151H418z" fill="#f5f1df" />
            <path d="M446 587h38v49h-38z" fill="#96bca7" />
            <path d="M518 578h42v80h-42z" fill="#ddc37c" />
            <path d="M593 587h38v49h-38z" fill="#96bca7" />
          </g>
        </svg>
        <div className="story-copy">
          <h1>Every learner is accounted for.</h1>
          <p className="story-description">
            A calmer, clearer school day for administrators and communities.
          </p>
        </div>
      </section>
    </main>
  );
}

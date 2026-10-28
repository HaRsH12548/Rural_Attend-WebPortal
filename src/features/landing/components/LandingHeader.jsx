import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpenCheck, LogIn, Menu, X, ArrowUpRight } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { can } from '@/lib/permissions';
import { PERMISSIONS } from '@/lib/constants';

/**
 * Navigation bar for the RuralAttend public landing page.
 * @returns {import('react').ReactElement} The header component.
 */
export function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const user = useAuthStore((state) => state.user);

  const destinationPath = user
    ? can(user, PERMISSIONS.SCHOOL_ACCESS)
      ? '/school/dashboard'
      : '/branch/attendance'
    : '/login';

  const destinationLabel = user ? 'Go to Workspace' : 'Administrator Sign In';

  return (
    <header className="lp-header">
      <div className="landing-container">
        <div className="lp-header-inner">
          <Link to="/" className="lp-brand-lockup" aria-label="RuralAttend Home">
            <div className="lp-brand-mark">
              <BookOpenCheck size={22} strokeWidth={2.2} />
            </div>
            <div className="lp-brand-text">
              <span className="lp-brand-title">RuralAttend</span>
              <span className="lp-brand-tagline">RURAL SCHOOL ATTENDANCE SYSTEM</span>
            </div>
          </Link>

          <nav aria-label="Landing Page Navigation">
            <ul className="lp-nav-links">
              <li>
                <a href="#about" className="lp-nav-link">
                  Who We Are
                </a>
              </li>
              <li>
                <a href="#services" className="lp-nav-link">
                  Platform Services
                </a>
              </li>
              <li>
                <a href="#impact" className="lp-nav-link">
                  School Impact
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="lp-nav-link">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#faq" className="lp-nav-link">
                  FAQ
                </a>
              </li>
            </ul>
          </nav>

          <div className="lp-header-actions">
            <a href="#book-session" className="lp-btn-outline">
              Book a Session
            </a>
            <Link to={destinationPath} className="lp-btn-primary" id="landing-login-btn">
              {user ? (
                <>
                  {destinationLabel}
                  <ArrowUpRight size={16} aria-hidden="true" />
                </>
              ) : (
                <>
                  <LogIn size={16} aria-hidden="true" />
                  Sign In
                </>
              )}
            </Link>
            <button
              type="button"
              className="lp-mobile-menu-btn"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div className={`lp-mobile-drawer ${mobileMenuOpen ? 'open' : ''}`}>
        <a href="#about" onClick={() => setMobileMenuOpen(false)}>
          Who We Are
        </a>
        <a href="#services" onClick={() => setMobileMenuOpen(false)}>
          Platform Services
        </a>
        <a href="#impact" onClick={() => setMobileMenuOpen(false)}>
          School Impact
        </a>
        <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>
          How It Works
        </a>
        <a href="#book-session" onClick={() => setMobileMenuOpen(false)}>
          Book a Session
        </a>
        <Link to={destinationPath} className="lp-btn-primary" style={{ marginTop: 8 }}>
          {destinationLabel}
        </Link>
      </div>
    </header>
  );
}

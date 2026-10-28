import { Link } from 'react-router-dom';
import { BookOpenCheck, Mail, LogIn, ArrowUpRight } from 'lucide-react';

/**
 * Footer component for the landing page.
 * @returns {import('react').ReactElement} The landing footer component.
 */
export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="lp-footer">
      <div className="landing-container">
        <div className="lp-footer-top">
          {/* Brand & Mission */}
          <div className="lp-footer-brand">
            <h4>
              <div
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: '#2f8b6d',
                  color: '#fff',
                }}
              >
                <BookOpenCheck size={18} />
              </div>
              RuralAttend
            </h4>
            <p>
              Dedicated to ensuring that geographic distance never results in educational
              invisibility. High-resilience attendance tracking for rural schools.
            </p>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span className="landing-pill teal" style={{ fontSize: 11, padding: '3px 10px' }}>
                Operational Resilience v0.1
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lp-footer-col">
            <h5>Explore</h5>
            <ul className="lp-footer-links">
              <li>
                <a href="#about">Who We Are</a>
              </li>
              <li>
                <a href="#services">Platform Services</a>
              </li>
              <li>
                <a href="#impact">Savings Calculator</a>
              </li>
              <li>
                <a href="#how-it-works">Implementation</a>
              </li>
              <li>
                <a href="#faq">Frequently Asked Questions</a>
              </li>
            </ul>
          </div>

          {/* Workspaces & Sign In */}
          <div className="lp-footer-col">
            <h5>Access</h5>
            <ul className="lp-footer-links">
              <li>
                <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <LogIn size={14} />
                  <span>Admin Sign In</span>
                </Link>
              </li>
              <li>
                <a href="#book-session">Book a Discovery Session</a>
              </li>
              <li>
                <a
                  href="mailto:team@ruralattend.org?subject=RuralAttend%20Inquiry"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Mail size={14} />
                  <span>team@ruralattend.org</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Demo & Evaluation Note */}
          <div className="lp-footer-col">
            <h5>Evaluation</h5>
            <p style={{ fontSize: 12.5, color: '#829bb0', lineHeight: 1.6, margin: 0 }}>
              RuralAttend is prepared for live district pilots. Demo credentials for branch and school
              admins are available on the sign in page.
            </p>
            <div style={{ marginTop: 14 }}>
              <Link to="/login" className="lp-btn-outline" style={{ fontSize: 12, padding: '6px 12px', color: '#cbe4d8', borderColor: 'rgba(255,255,255,0.2)' }}>
                <span>Open Login Portal</span>
                <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>
        </div>

        <div className="lp-footer-bottom">
          <div>
            © {currentYear} RuralAttend. Dedicated to rural educational clarity and student
            retention.
          </div>
          <div>Built with offline-first principles · No production tracking</div>
        </div>
      </div>
    </footer>
  );
}

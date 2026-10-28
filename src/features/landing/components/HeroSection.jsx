import { Link } from 'react-router-dom';
import { WifiOff, ShieldCheck, FileSpreadsheet, ArrowRight, Calendar, Sparkles } from 'lucide-react';
import { DashboardMockup } from './DashboardMockup';

/**
 * Hero section for the RuralAttend landing page.
 * @returns {import('react').ReactElement} The hero section component.
 */
export function HeroSection() {
  return (
    <section className="lp-hero-section">
      {/* Background artwork & atmospheric glow */}
      <div className="lp-hero-bg-art">
        <svg
          viewBox="0 0 1440 600"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '100%', height: '100%' }}
        >
          <path
            d="M0 450C320 380 640 490 960 410C1280 330 1360 400 1440 420V600H0V450Z"
            fill="#2f8b6d"
            fillOpacity="0.3"
          />
          <path
            d="M0 490C400 440 760 520 1100 460C1320 420 1380 470 1440 480V600H0V490Z"
            fill="#a1c2ad"
            fillOpacity="0.2"
          />
        </svg>
      </div>
      <div className="lp-hero-sun" />

      <div className="landing-container">
        <div className="lp-hero-grid">
          {/* Left Column: Mission & Call to Action */}
          <div className="lp-hero-copy">
            <div className="landing-pill white">
              <span className="pulse-dot" />
              <span>Next-Gen Rural Education Infrastructure</span>
            </div>

            <h1 className="lp-hero-headline">
              Every learner accounted for. <br />
              <span className="highlight-sun">Zero-friction attendance</span> for rural schools.
            </h1>

            <p className="lp-hero-subhead">
              RuralAttend bridges the digital divide for remote classrooms, branch headmasters, and
              district administrators. Take rolls offline, prevent student dropouts, and automate
              audit compliance without paper registers.
            </p>

            <div className="lp-hero-actions">
              <a href="#book-session" className="lp-btn-primary" style={{ padding: '12px 24px', fontSize: 15 }}>
                <Calendar size={18} />
                Book a Session with Our Team
              </a>
              <Link to="/login" className="lp-btn-secondary" style={{ padding: '12px 22px', fontSize: 15 }}>
                <span>Access Admin Portal</span>
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="lp-hero-badges">
              <div className="lp-badge-item">
                <WifiOff size={16} className="lp-badge-icon" />
                <span>100% Offline-Resilient Sync</span>
              </div>
              <div className="lp-badge-item">
                <FileSpreadsheet size={16} className="lp-badge-icon" />
                <span>Batch Excel Roster Upload</span>
              </div>
              <div className="lp-badge-item">
                <ShieldCheck size={16} className="lp-badge-icon" />
                <span>Government Audit Compliant</span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Simulated Dashboard */}
          <DashboardMockup />
        </div>
      </div>
    </section>
  );
}

import { useState } from 'react';
import { Sparkles, Clock, FileText, ArrowRight, ShieldCheck } from 'lucide-react';

/**
 * Interactive school time and resource savings calculator.
 * @returns {import('react').ReactElement} The impact calculator component.
 */
export function ImpactCalculator() {
  const [branches, setBranches] = useState(3);
  const [studentsPerBranch, setStudentsPerBranch] = useState(400);

  const totalStudents = branches * studentsPerBranch;
  const hoursSavedPerMonth = Math.round(branches * 22 * 0.75); // ~45 mins per day saved across 22 working days
  const registersEliminatedYear = Math.round(branches * Math.ceil(studentsPerBranch / 35) * 2);
  const auditReportSpeed = '< 15 sec';

  return (
    <section className="lp-impact-section" id="impact">
      <div className="landing-container">
        <div className="lp-section-header">
          <span className="landing-pill gold">Measurable Efficiency</span>
          <h2 className="lp-section-title">See how much time your schools will save.</h2>
          <p className="lp-section-subtitle">
            Calculate the administrative hours recovered and paper friction eliminated across your
            rural school cluster or district.
          </p>
        </div>

        <div className="lp-calculator-container">
          {/* Controls */}
          <div className="lp-calc-inputs">
            <div className="lp-calc-field">
              <div className="lp-calc-label-row">
                <label htmlFor="calc-branches" className="lp-calc-label">
                  School Branches in Your Trust / District
                </label>
                <span className="lp-calc-badge">{branches} Branches</span>
              </div>
              <input
                id="calc-branches"
                type="range"
                min="1"
                max="25"
                step="1"
                value={branches}
                onChange={(e) => setBranches(Number(e.target.value))}
                className="lp-range-slider"
              />
              <span style={{ fontSize: 11, color: '#7a8f9c' }}>Slide to adjust branch count (1 to 25)</span>
            </div>

            <div className="lp-calc-field">
              <div className="lp-calc-label-row">
                <label htmlFor="calc-students" className="lp-calc-label">
                  Average Students per School Branch
                </label>
                <span className="lp-calc-badge">{studentsPerBranch.toLocaleString()} Learners</span>
              </div>
              <input
                id="calc-students"
                type="range"
                min="50"
                max="1200"
                step="25"
                value={studentsPerBranch}
                onChange={(e) => setStudentsPerBranch(Number(e.target.value))}
                className="lp-range-slider"
              />
              <span style={{ fontSize: 11, color: '#7a8f9c' }}>Total active cohort: ~{totalStudents.toLocaleString()} enrolled learners</span>
            </div>

            <div style={{ padding: '14px 18px', background: '#f4fbf7', border: '1px solid #d7ece2', borderRadius: 8, fontSize: 13, color: '#27624d' }}>
              <strong>Zero-setup trial:</strong> We assist in converting your existing district student roster spreadsheets free of charge during onboarding.
            </div>
          </div>

          {/* Dynamic Impact Output */}
          <div className="lp-calc-results">
            <h3 className="lp-calc-results-title">Estimated Annual Impact</h3>

            <div className="lp-calc-metric-grid">
              <div className="lp-calc-metric-item">
                <div className="lp-calc-metric-num">{hoursSavedPerMonth} hrs</div>
                <div className="lp-calc-metric-lbl">Headmaster & teacher time saved per month</div>
              </div>

              <div className="lp-calc-metric-item">
                <div className="lp-calc-metric-num">{registersEliminatedYear}</div>
                <div className="lp-calc-metric-lbl">Physical paper attendance books eliminated/yr</div>
              </div>

              <div className="lp-calc-metric-item">
                <div className="lp-calc-metric-num">99.8%</div>
                <div className="lp-calc-metric-lbl">Mid-day meal allocation headcount accuracy</div>
              </div>

              <div className="lp-calc-metric-item">
                <div className="lp-calc-metric-num">{auditReportSpeed}</div>
                <div className="lp-calc-metric-lbl">Export audit-ready CSV reports (was 3–5 days)</div>
              </div>
            </div>

            <p className="lp-calc-cta-note">
              Based on operational metrics from pilot schools replacing dual paper registers with
              RuralAttend daily roll tracking.
            </p>

            <a href="#book-session" className="lp-btn-primary" style={{ alignSelf: 'flex-start' }}>
              <span>Request Custom Impact Assessment</span>
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

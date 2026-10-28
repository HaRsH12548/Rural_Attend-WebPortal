import { Wifi, CheckCircle2, AlertCircle, Clock, Users, ArrowUpRight } from 'lucide-react';

/**
 * Interactive preview of the branch administrator attendance dashboard.
 * @returns {import('react').ReactElement} The dashboard simulation mockup.
 */
export function DashboardMockup() {
  return (
    <div className="lp-mockup-wrapper">
      <div className="lp-mockup-card">
        {/* Top bar */}
        <div className="lp-mockup-topbar">
          <div className="lp-mockup-dots">
            <span className="lp-mockup-dot red" />
            <span className="lp-mockup-dot yellow" />
            <span className="lp-mockup-dot green" />
          </div>
          <div className="lp-mockup-badge">
            <Wifi size={12} strokeWidth={2.5} />
            <span>Branch Local Sync: Live</span>
          </div>
        </div>

        {/* Mockup Body */}
        <div className="lp-mockup-body">
          <div className="lp-mockup-header-info">
            <div>
              <div className="lp-mockup-branch-name">Singhania Rural Vidya Mandir</div>
              <div className="lp-mockup-branch-sub">Branch #04 · Session 2026-27</div>
            </div>
            <span className="landing-pill teal" style={{ fontSize: 11, padding: '3px 8px' }}>
              Cutoff 10:30 AM
            </span>
          </div>

          {/* Key Metrics */}
          <div className="lp-mockup-stats-grid">
            <div className="lp-mockup-stat-box">
              <div className="lp-mockup-stat-val teal">96.4%</div>
              <div className="lp-mockup-stat-lbl">Roll Submitted</div>
            </div>
            <div className="lp-mockup-stat-box">
              <div className="lp-mockup-stat-val">412</div>
              <div className="lp-mockup-stat-lbl">Present Today</div>
            </div>
            <div className="lp-mockup-stat-box">
              <div className="lp-mockup-stat-val">18/20</div>
              <div className="lp-mockup-stat-lbl">Classes Marked</div>
            </div>
          </div>

          {/* Live Submissions Status */}
          <div className="lp-mockup-classes-list">
            <div className="lp-mockup-class-row">
              <span className="lp-mockup-class-name">Grade 8 · Section A</span>
              <span className="lp-mockup-class-stat">
                <CheckCircle2 size={13} style={{ display: 'inline', marginRight: 4 }} />
                34 / 35 Present
              </span>
            </div>
            <div className="lp-mockup-class-row">
              <span className="lp-mockup-class-name">Grade 9 · Section B</span>
              <span className="lp-mockup-class-stat">
                <CheckCircle2 size={13} style={{ display: 'inline', marginRight: 4 }} />
                39 / 40 Present
              </span>
            </div>
            <div className="lp-mockup-class-row" style={{ background: '#fff9ed', borderColor: '#faebd1' }}>
              <span className="lp-mockup-class-name" style={{ color: '#8d5d14' }}>
                Grade 10 · Section A
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#a46d12' }}>
                <Clock size={12} style={{ display: 'inline', marginRight: 3 }} />
                Submitting Roll…
              </span>
            </div>
          </div>

          {/* Sync alert banner */}
          <div className="lp-mockup-sync-alert">
            <CheckCircle2 size={15} style={{ flexShrink: 0, color: '#2f8b6d' }} />
            <span>
              <strong>Zero-loss offline sync:</strong> 18 roll sheets verified with nutritional meal count.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

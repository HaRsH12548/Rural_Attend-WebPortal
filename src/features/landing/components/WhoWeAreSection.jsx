import { School, HeartHandshake, CloudOff, FileCheck2, Award } from 'lucide-react';

/**
 * "Who We Are & The Rural Mission" section.
 * @returns {import('react').ReactElement} The WhoWeAre component.
 */
export function WhoWeAreSection() {
  return (
    <>
      {/* High-impact trust & metric strip */}
      <section className="lp-stats-strip" aria-label="Key Performance Indicators">
        <div className="landing-container">
          <div className="lp-stats-strip-grid">
            <div className="lp-stat-unit">
              <div className="lp-stat-num">99.8%</div>
              <div className="lp-stat-desc">Daily Roll Submission Rate</div>
            </div>
            <div className="lp-stat-unit">
              <div className="lp-stat-num">45 min</div>
              <div className="lp-stat-desc">Saved Daily per Branch Headmaster</div>
            </div>
            <div className="lp-stat-unit">
              <div className="lp-stat-num">12,500+</div>
              <div className="lp-stat-desc">Students Reliably Monitored</div>
            </div>
            <div className="lp-stat-unit">
              <div className="lp-stat-num">100%</div>
              <div className="lp-stat-desc">Offline Resilience with Zero Data Loss</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Who We Are Story */}
      <section className="lp-who-section" id="about">
        <div className="landing-container">
          <div className="lp-who-grid">
            {/* Left Column: Mission Narrative */}
            <div className="lp-who-copy">
              <div>
                <span className="landing-pill teal">Our Roots & Purpose</span>
                <h2 className="lp-section-title">
                  Built for classrooms where connectivity is scarce, but every child counts.
                </h2>
              </div>

              <p className="lp-who-paragraph">
                In thousands of rural and semi-remote schools, physical paper attendance registers
                remain fragile single points of failure. They suffer wear-and-tear during monsoon
                seasons, require arduous manual calculation at the end of each month, and delay
                essential mid-day meal allocations.
              </p>

              <p className="lp-who-paragraph">
                <strong>RuralAttend</strong> was founded by educators and systems engineers to give
                rural school administrators the exact same speed, precision, and visibility enjoyed
                by top-tier urban institutions—without demanding fast 5G broadband or expensive IT
                infrastructure.
              </p>

              <p className="lp-who-paragraph">
                We believe that accurate daily attendance is more than a record: it is a safeguard
                against student dropouts, a guarantee that nutritional meal subsidies reach actual
                enrolled learners, and a foundation of dignity for teachers.
              </p>
            </div>

            {/* Right Column: Three Core Commitments */}
            <div className="lp-who-cards">
              <div className="lp-story-card">
                <div className="lp-story-icon-box">
                  <CloudOff size={22} />
                </div>
                <div>
                  <h4>Zero-Connectivity First</h4>
                  <p>
                    Built so school mornings never stall when mobile network towers go down.
                    Teachers complete rolls in seconds, and records reconcile automatically.
                  </p>
                </div>
              </div>

              <div className="lp-story-card">
                <div className="lp-story-icon-box gold">
                  <HeartHandshake size={22} />
                </div>
                <div>
                  <h4>Designed for Teacher Simplicity</h4>
                  <p>
                    Requires zero training or tech expertise. Clean, distraction-free interfaces
                    let educators focus entirely on teaching rather than administrative paperwork.
                  </p>
                </div>
              </div>

              <div className="lp-story-card">
                <div className="lp-story-icon-box">
                  <Award size={22} />
                </div>
                <div>
                  <h4>Audit-Ready Accountability</h4>
                  <p>
                    Automatic compliance summaries for government inspections, mid-day meal audits,
                    and district scholarship verifications with tamper-resistant records.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

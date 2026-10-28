import { UploadCloud, CheckCheck, RefreshCw, BarChart2 } from 'lucide-react';

/**
 * 4-Step "How It Works" implementation workflow.
 * @returns {import('react').ReactElement} The HowItWorks component.
 */
export function HowItWorksSection() {
  const steps = [
    {
      num: 'STEP 01',
      title: 'Import School Rosters in Minutes',
      desc: 'Upload your existing student and class lists directly from Excel (.xlsx) or CSV files. Our parser validates data formats and catches duplicates automatically.',
    },
    {
      num: 'STEP 02',
      title: 'One-Touch Morning Roll Call',
      desc: 'Class teachers open their class roster and mark present, absent, or late in seconds. Designed with high-contrast touch targets for any smartphone or tablet.',
    },
    {
      num: 'STEP 03',
      title: 'Offline-Resilient Background Sync',
      desc: 'No signal? No problem. Rolls are encrypted and cached locally on the device, syncing seamlessly to the central web portal as soon as a connection is detected.',
    },
    {
      num: 'STEP 04',
      title: 'Actionable Governance & Auditing',
      desc: 'School administrators immediately receive consolidated counts for mid-day meals, export government attendance records, and identify at-risk student absenteeism.',
    },
  ];

  return (
    <section className="lp-how-section" id="how-it-works">
      <div className="landing-container">
        <div className="lp-section-header">
          <span className="landing-pill teal">Frictionless Adoption</span>
          <h2 className="lp-section-title">Up and running in days, not months.</h2>
          <p className="lp-section-subtitle">
            Engineered specifically to avoid complicated software rollouts, IT overhead, or steep
            learning curves.
          </p>
        </div>

        <div className="lp-steps-grid">
          {steps.map((step, idx) => (
            <div key={idx} className="lp-step-card">
              <span className="lp-step-num">{step.num}</span>
              <h3 className="lp-step-title">{step.title}</h3>
              <p className="lp-step-desc">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

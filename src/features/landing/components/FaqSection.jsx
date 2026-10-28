import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Frequently Asked Questions accordion section.
 * @returns {import('react').ReactElement} The FAQ component.
 */
export function FaqSection() {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: 'Does RuralAttend work in remote areas with zero cellular reception?',
      a: 'Yes, absolutely. RuralAttend is built with an offline-first architecture. Teachers can take morning attendance and review rosters completely disconnected from the internet. All records are safely encrypted in local storage and synchronize automatically whenever a data connection or Wi-Fi hotspot becomes available.',
    },
    {
      q: 'How do we migrate our existing student lists into the portal?',
      a: 'You can import your entire student body in under 60 seconds using our batch Excel (.xlsx, .xls) and CSV importer. The system automatically verifies names, roll numbers, genders, and section assignments, highlighting any formatting anomalies before saving.',
    },
    {
      q: 'How does RuralAttend help with Mid-Day Meal (MDM) audits?',
      a: 'Physical paper counts often lead to discrepancies between recorded attendance and meal rations. RuralAttend records an immutable daily headcount stamp at the morning cutoff time, generating an audit-ready summary that matches government ration schemas.',
    },
    {
      q: 'Do teachers or school staff need extensive technical training?',
      a: 'No. The user interface was specifically designed for simplicity and ease of use, prioritizing high-contrast buttons and minimal steps. Teachers can mark an entire class roll in less than 30 seconds with zero prior training.',
    },
    {
      q: 'How do teachers and administrators get their login credentials?',
      a: 'For security and governance, RuralAttend does not allow public self-registration. School Admins provision Branch Admins, who in turn generate one-time credentials for teachers. This top-down hierarchy preserves institutional integrity across branches.',
    },
  ];

  function toggle(idx) {
    setOpenIndex((prev) => (prev === idx ? -1 : idx));
  }

  return (
    <section className="lp-faq-section" id="faq">
      <div className="landing-container">
        <div className="lp-section-header">
          <span className="landing-pill teal">Got Questions?</span>
          <h2 className="lp-section-title">Frequently Asked Questions</h2>
          <p className="lp-section-subtitle">
            Everything you need to know about adopting RuralAttend in your schools.
          </p>
        </div>

        <div className="lp-faq-list">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className={`lp-faq-item ${isOpen ? 'active' : ''}`}>
                <button
                  type="button"
                  className="lp-faq-question"
                  onClick={() => toggle(idx)}
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <ChevronDown size={18} className="lp-faq-chevron" />
                </button>
                {isOpen && <div className="lp-faq-answer">{faq.a}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

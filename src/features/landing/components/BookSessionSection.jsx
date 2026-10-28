import { useState } from 'react';
import { Mail, Copy, Check, Send, CalendarCheck, PhoneCall, CheckCircle2 } from 'lucide-react';

/**
 * "Book a Session with our Team" & Direct Email Section.
 * @returns {import('react').ReactElement} The session booking component.
 */
export function BookSessionSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    role: 'Principal / Headmaster',
    scale: '1 - 3 Branches',
    preferredTime: 'Morning (09:00 - 12:00)',
    notes: '',
  });

  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const directEmail = 'team@ruralattend.org';

  function handleCopyEmail() {
    navigator.clipboard.writeText(directEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate responsive booking submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 800);
  }

  // Pre-formatted mailto link for direct emailing
  const mailtoUrl = `mailto:${directEmail}?subject=${encodeURIComponent(
    `Book a Session: ${formData.organization || 'School Platform Inquiry'}`,
  )}&body=${encodeURIComponent(
    `Hello RuralAttend Team,\n\nI would like to schedule a session to learn more about the RuralAttend platform.\n\nMy Details:\n- Name: ${
      formData.name || 'N/A'
    }\n- Organization: ${formData.organization || 'N/A'}\n- Role: ${
      formData.role
    }\n- School Scale: ${formData.scale}\n- Preferred Time: ${
      formData.preferredTime
    }\n\nQuestions/Notes:\n${formData.notes || 'Looking forward to seeing the platform.'}\n\nBest regards,`,
  )}`;

  return (
    <section className="lp-book-section" id="book-session">
      <div className="landing-container">
        <div className="lp-section-header">
          <span className="landing-pill white">Connect With Specialists</span>
          <h2 className="lp-section-title">Book a 1-on-1 walkthrough with our team.</h2>
          <p className="lp-section-subtitle">
            See how RuralAttend adapts to your exact district policies, branch setups, and offline
            constraints. Submit the form below or email us directly.
          </p>
        </div>

        <div className="lp-book-wrapper">
          {/* Left Column: Direct Email & Benefits */}
          <div className="lp-book-sidebar">
            <div className="lp-book-sidebar-top">
              <h3>What to expect in your session</h3>
              <p>
                A personalized 20-minute demonstration tailored specifically to your schools,
                roster structures, and local connectivity conditions.
              </p>

              <ul className="lp-sidebar-perks">
                <li>
                  <CheckCircle2 size={18} />
                  <span>Interactive demonstration of the Headmaster & Teacher workflow</span>
                </li>
                <li>
                  <CheckCircle2 size={18} />
                  <span>Offline simulation showing zero-signal roll recording and sync</span>
                </li>
                <li>
                  <CheckCircle2 size={18} />
                  <span>Complimentary review of your current student roster format</span>
                </li>
                <li>
                  <CheckCircle2 size={18} />
                  <span>Roadmap discussion for Mid-Day Meal and government audit exports</span>
                </li>
              </ul>
            </div>

            {/* Direct Email Card */}
            <div className="lp-email-direct-box">
              <div className="lp-email-direct-label">Prefer direct email?</div>
              <div className="lp-email-row">
                <a href={mailtoUrl} className="lp-email-address">
                  {directEmail}
                </a>
                <button
                  type="button"
                  className="lp-copy-email-btn"
                  onClick={handleCopyEmail}
                  title="Copy email to clipboard"
                >
                  {copied ? (
                    <>
                      <Check size={13} />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: '#a0c9b9' }}>
                We reply within 24 hours on all school working days.
              </div>
            </div>
          </div>

          {/* Right Column: Booking Form */}
          <div className="lp-book-form-pane">
            {submitted ? (
              <div className="lp-form-success-card">
                <div className="lp-success-icon-wrap">
                  <CalendarCheck size={36} />
                </div>
                <h3 style={{ fontSize: 24, color: '#142f42' }}>Session Request Received!</h3>
                <p style={{ maxWidth: 420, color: '#5f7887', fontSize: 15, margin: 0 }}>
                  Thank you, <strong>{formData.name || 'Educator'}</strong>. Our rural education
                  specialist will reach out to <strong>{formData.email}</strong> to confirm your
                  calendar invite.
                </p>

                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                  <a href={mailtoUrl} className="lp-btn-outline" style={{ fontSize: 13 }}>
                    <Mail size={15} />
                    Open in Email App
                  </a>
                  <button
                    type="button"
                    className="lp-btn-primary"
                    style={{ fontSize: 13 }}
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        name: '',
                        email: '',
                        organization: '',
                        role: 'Principal / Headmaster',
                        scale: '1 - 3 Branches',
                        preferredTime: 'Morning (09:00 - 12:00)',
                        notes: '',
                      });
                    }}
                  >
                    Submit Another Request
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <div className="lp-form-grid">
                  <div className="lp-form-field">
                    <label htmlFor="book-name" className="lp-form-label">
                      Your Full Name *
                    </label>
                    <input
                      id="book-name"
                      name="name"
                      type="text"
                      required
                      placeholder="e.g. Ramesh Patel"
                      value={formData.name}
                      onChange={handleChange}
                      className="lp-form-input"
                    />
                  </div>

                  <div className="lp-form-field">
                    <label htmlFor="book-email" className="lp-form-label">
                      Official / Work Email *
                    </label>
                    <input
                      id="book-email"
                      name="email"
                      type="email"
                      required
                      placeholder="e.g. admin@schooltrust.org"
                      value={formData.email}
                      onChange={handleChange}
                      className="lp-form-input"
                    />
                  </div>

                  <div className="lp-form-field">
                    <label htmlFor="book-org" className="lp-form-label">
                      School, Trust, or District Name *
                    </label>
                    <input
                      id="book-org"
                      name="organization"
                      type="text"
                      required
                      placeholder="e.g. Navodaya Rural Trust"
                      value={formData.organization}
                      onChange={handleChange}
                      className="lp-form-input"
                    />
                  </div>

                  <div className="lp-form-field">
                    <label htmlFor="book-role" className="lp-form-label">
                      Your Role
                    </label>
                    <select
                      id="book-role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="lp-form-select"
                    >
                      <option value="Principal / Headmaster">Principal / Headmaster</option>
                      <option value="District Education Officer">District Education Officer</option>
                      <option value="Trustee / NGO Director">Trustee / NGO Director</option>
                      <option value="School IT / Admin Staff">School IT / Admin Staff</option>
                      <option value="Teacher / Faculty">Teacher / Faculty</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="lp-form-field">
                    <label htmlFor="book-scale" className="lp-form-label">
                      Schools / Branches
                    </label>
                    <select
                      id="book-scale"
                      name="scale"
                      value={formData.scale}
                      onChange={handleChange}
                      className="lp-form-select"
                    >
                      <option value="1 Branch (Single School)">1 Branch (Single School)</option>
                      <option value="2 - 5 Branches">2 - 5 Branches</option>
                      <option value="6 - 15 Branches">6 - 15 Branches</option>
                      <option value="15+ District Network">15+ District Network</option>
                    </select>
                  </div>

                  <div className="lp-form-field">
                    <label htmlFor="book-time" className="lp-form-label">
                      Preferred Time Slot
                    </label>
                    <select
                      id="book-time"
                      name="preferredTime"
                      value={formData.preferredTime}
                      onChange={handleChange}
                      className="lp-form-select"
                    >
                      <option value="Morning (09:00 - 12:00)">Morning (09:00 - 12:00)</option>
                      <option value="Afternoon (12:00 - 16:00)">Afternoon (12:00 - 16:00)</option>
                      <option value="Evening (16:00 - 19:00)">Evening (16:00 - 19:00)</option>
                    </select>
                  </div>

                  <div className="lp-form-field full-width">
                    <label htmlFor="book-notes" className="lp-form-label">
                      Specific Requirements or Questions (Optional)
                    </label>
                    <textarea
                      id="book-notes"
                      name="notes"
                      rows={2}
                      placeholder="Tell us about your school locations, connectivity challenges, or rollout timeline…"
                      value={formData.notes}
                      onChange={handleChange}
                      className="lp-form-textarea"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <button
                    type="submit"
                    className="lp-form-submit-btn"
                    disabled={isSubmitting || !formData.email || !formData.name}
                  >
                    {isSubmitting ? (
                      'Submitting Request…'
                    ) : (
                      <>
                        <Send size={16} />
                        Request Walkthrough Session
                      </>
                    )}
                  </button>

                  <div style={{ textAlign: 'center', fontSize: 12, color: '#7a8f9c' }}>
                    Or{' '}
                    <a
                      href={mailtoUrl}
                      style={{ color: '#2f8b6d', fontWeight: 700, textDecoration: 'underline' }}
                    >
                      click here to email your request directly
                    </a>{' '}
                    from your default email app.
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

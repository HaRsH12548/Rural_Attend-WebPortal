import { useEffect, useState } from 'react';
import {
  Check,
  Eye,
  EyeOff,
  GraduationCap,
  Key,
  RefreshCw,
  Shield,
  User,
  Users,
  X,
} from 'lucide-react';

/**
 * Generates a memorable, secure temporary password.
 * @returns {string} Generated password.
 */
function generateRandomPassword() {
  const words = ['Rural', 'Teach', 'Attend', 'School', 'Alpha', 'Beta', 'North'];
  const word = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${word}@${num}`;
}

/**
 * Modal dialog for creating and editing teachers, setting app credentials, and allotting sections.
 */
export default function TeacherFormModal({
  isOpen,
  onClose,
  onSave,
  teacher = null,
  availableClasses = [],
  allTeachers = [],
  onResetPassword,
}) {
  const isEditing = Boolean(teacher);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [staffId, setStaffId] = useState('');
  const [designation, setDesignation] = useState('Class Teacher');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('active');
  const [selectedClassIds, setSelectedClassIds] = useState([]);

  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Populate or reset form whenever modal opens or active teacher changes
  useEffect(() => {
    if (teacher) {
      setName(teacher.name || '');
      setEmail(teacher.email || '');
      setPhone(teacher.phone || '');
      setStaffId(teacher.staffId || '');
      setDesignation(teacher.designation || 'Class Teacher');
      setPassword(teacher.password || '');
      setStatus(teacher.status || 'active');
      setSelectedClassIds(teacher.allottedClassIds || []);
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setStaffId(`TCH-${String(allTeachers.length + 1).padStart(3, '0')}`);
      setDesignation('Class Teacher');
      setPassword(generateRandomPassword());
      setStatus('active');
      setSelectedClassIds([]);
    }
    setFormError('');
    setShowPassword(false);
  }, [teacher, allTeachers.length, isOpen]);

  if (!isOpen) return null;

  function toggleClassSelection(classId) {
    setSelectedClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId],
    );
  }

  function handleSelectAllClasses() {
    if (selectedClassIds.length === availableClasses.length) {
      setSelectedClassIds([]);
    } else {
      setSelectedClassIds(availableClasses.map((c) => c.id || c.classId));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Please enter teacher full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setFormError('Please enter a valid login email address.');
      return;
    }
    if (!staffId.trim()) {
      setFormError('Staff ID is required.');
      return;
    }
    if (!isEditing && (!password.trim() || password.trim().length < 6)) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        staffId: staffId.trim().toUpperCase(),
        designation: designation.trim(),
        status,
        allottedClassIds: selectedClassIds,
      };
      if (!isEditing) {
        payload.password = password.trim();
      }
      await onSave(payload);
      onClose({ saved: true });
    } catch (err) {
      setFormError(err?.message || 'Failed to save teacher details.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      className="students-dialog-backdrop teacher-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && !isSaving) onClose();
      }}
    >
      <section
        className="students-dialog teacher-form-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="teacher-modal-title"
      >
        <div className="students-dialog-header">
          <div>
            <h2 id="teacher-modal-title">
              {isEditing ? `Edit Teacher: ${teacher.name}` : 'Add New Teacher & App Access'}
            </h2>
          </div>
          <button
            id="close-teacher-modal-btn"
            className="icon-button"
            type="button"
            aria-label="Close dialog"
            disabled={isSaving}
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {formError && (
          <p className="form-alert" role="alert" style={{ margin: '14px 24px 0' }}>
            {formError}
          </p>
        )}

        <form className="teacher-form" onSubmit={handleSubmit}>
          <div className="teacher-form-body">
            {/* Section 1: Staff Details */}
            <div className="form-section-card">
              <div className="form-section-header">
                <User size={15} className="form-section-icon" aria-hidden="true" />
                <h3>Staff Profile Details</h3>
              </div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label htmlFor="teacher-name">
                    Full Name <span className="required-star">*</span>
                  </label>
                  <input
                    id="teacher-name"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Mrs. Aditi Rao"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="teacher-staff-id">
                    Staff ID <span className="required-star">*</span>
                  </label>
                  <input
                    id="teacher-staff-id"
                    type="text"
                    className="form-input"
                    placeholder="e.g. TCH-005"
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value)}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="teacher-designation">Role / Designation</label>
                  <select
                    id="teacher-designation"
                    className="form-select"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                  >
                    <option value="Class Teacher">Class Teacher</option>
                    <option value="Subject Teacher">Subject Teacher</option>
                    <option value="Senior Teacher">Senior Teacher</option>
                    <option value="Assistant Teacher">Assistant Teacher</option>
                    <option value="Head Teacher">Head Teacher</option>
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="teacher-phone">Phone Number (Optional)</label>
                  <input
                    id="teacher-phone"
                    type="tel"
                    className="form-input"
                    placeholder="e.g. +254 712 345 678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: App Login Credentials */}
            <div className="form-section-card credentials-section-card">
              <div className="form-section-header">
                <Shield size={15} className="form-section-icon" aria-hidden="true" />
                <h3>Mobile App Login Credentials</h3>
                <span className="section-note">Used by teacher to take attendance on phone/tablet</span>
              </div>

              {isEditing ? (
                <div className="form-grid-2">
                  <div className="form-field">
                    <label htmlFor="teacher-email">
                      Login Email / Username <span className="required-star">*</span>
                    </label>
                    <input
                      id="teacher-email"
                      type="email"
                      className="form-input"
                      placeholder="e.g. aditi.rao@school.demo"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="teacher-status">Account Status</label>
                    <select
                      id="teacher-status"
                      className="form-select"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="active">Active (Access Enabled)</option>
                      <option value="inactive">Inactive (Suspended)</option>
                    </select>
                  </div>

                  <div className="form-field teacher-cred-reset-field">
                    <label>App Password</label>
                    <div className="teacher-cred-reset-row">
                      <div className="teacher-cred-encrypted-hint">
                        <Key size={13} className="cred-lock-icon" aria-hidden="true" />
                        <span className="cred-dots">••••••••••••</span>
                        <span className="cred-text-muted">(Encrypted &amp; Protected)</span>
                      </div>
                      <button
                        type="button"
                        className="secondary-button secondary-button--small teacher-reset-pass-btn"
                        onClick={() => {
                          if (onResetPassword) {
                            onResetPassword(teacher);
                          }
                        }}
                        title="Reset teacher's app password"
                      >
                        <RefreshCw size={12} aria-hidden="true" />
                        <span>Reset Password</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="form-grid-2">
                  <div className="form-field">
                    <label htmlFor="teacher-email">
                      Login Email / Username <span className="required-star">*</span>
                    </label>
                    <input
                      id="teacher-email"
                      type="email"
                      className="form-input"
                      placeholder="e.g. aditi.rao@school.demo"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-field">
                    <div className="field-label-with-action">
                      <label htmlFor="teacher-password">
                        App Password <span className="required-star">*</span>
                      </label>
                      <button
                        type="button"
                        className="quick-text-action"
                        onClick={() => setPassword(generateRandomPassword())}
                      >
                        <RefreshCw size={11} aria-hidden="true" />
                        <span>Generate</span>
                      </button>
                    </div>
                    <div className="password-input-wrap">
                      <Key size={13} className="password-input-icon" aria-hidden="true" />
                      <input
                        id="teacher-password"
                        type={showPassword ? 'text' : 'password'}
                        className="form-input password-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-field">
                    <label htmlFor="teacher-status">Account Status</label>
                    <select
                      id="teacher-status"
                      className="form-select"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="active">Active (Access Enabled)</option>
                      <option value="inactive">Inactive (Suspended)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Section 3: Allot Sections */}
            <div className="form-section-card allotments-section-card">
              <div className="form-section-header">
                <GraduationCap size={16} className="form-section-icon" aria-hidden="true" />
                <div style={{ flex: 1 }}>
                  <h3>Allot Classroom Sections</h3>
                  <p className="section-note">
                    Select sections this teacher can access and mark roll calls for in the app.
                  </p>
                </div>
                {availableClasses.length > 0 && (
                  <button
                    type="button"
                    className="secondary-button secondary-button--small"
                    onClick={handleSelectAllClasses}
                  >
                    {selectedClassIds.length === availableClasses.length ? 'Deselect All' : 'Select All'}
                  </button>
                )}
              </div>

              {availableClasses.length === 0 ? (
                <div className="no-classes-notice">
                  <p>No classes found in the current academic year. Please add classes first.</p>
                </div>
              ) : (
                <div className="classes-allotment-grid" role="group" aria-label="Section allotments">
                  {availableClasses.map((cls) => {
                    const cid = cls.id || cls.classId;
                    const isSelected = selectedClassIds.includes(cid);

                    // Check if another teacher is currently assigned to this class
                    const otherTeachers = allTeachers.filter(
                      (t) => t.id !== teacher?.id && (t.allottedClassIds || []).includes(cid),
                    );

                    return (
                      <label
                        key={cid}
                        htmlFor={`class-allot-${cid}`}
                        className={`class-allot-card${isSelected ? ' class-allot-card--selected' : ''}`}
                      >
                        <input
                          id={`class-allot-${cid}`}
                          type="checkbox"
                          className="class-allot-checkbox"
                          checked={isSelected}
                          onChange={() => toggleClassSelection(cid)}
                        />
                        <div className="class-allot-info">
                          <strong className="class-allot-name">{cls.name}</strong>
                          <span className="class-allot-meta">
                            {cls.grade} · Sec {cls.section} ({cls.studentCount || 0} students)
                          </span>
                          {otherTeachers.length > 0 && (
                            <span className="class-other-teacher-tag" title="Already assigned to another teacher">
                              Assigned: {otherTeachers.map((t) => t.name).join(', ')}
                            </span>
                          )}
                        </div>
                        {isSelected && (
                          <div className="class-allot-check-badge">
                            <Check size={12} aria-hidden="true" />
                          </div>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}

              <div className="allotments-summary-bar">
                <span>
                  <strong>{selectedClassIds.length}</strong> section(s) allotted to this teacher
                </span>
              </div>
            </div>
          </div>

          <div className="students-dialog-actions teacher-dialog-actions">
            <button
              id="save-teacher-submit-btn"
              type="submit"
              className="primary-button"
              disabled={isSaving}
            >
              {isSaving ? 'Saving Teacher…' : isEditing ? 'Save Changes' : 'Create Teacher & Credentials'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

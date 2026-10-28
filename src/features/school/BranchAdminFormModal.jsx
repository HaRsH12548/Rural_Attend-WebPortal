import { useEffect, useState } from 'react';
import {
  Building2,
  Check,
  Eye,
  EyeOff,
  Key,
  RefreshCw,
  Shield,
  ShieldCheck,
  User,
  Users,
  X,
} from 'lucide-react';

/**
 * Generates a memorable, secure temporary password.
 * @returns {string} Generated password.
 */
function generateRandomPassword() {
  const words = ['Rural', 'Admin', 'Branch', 'School', 'Lead', 'Trust', 'North'];
  const word = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${word}@${num}`;
}

/**
 * Modal dialog for provisioning or editing branch administrators, setting credentials, and assigning campuses.
 * Directly modeled after TeacherFormModal.
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   onSave: (payload: object) => Promise<void>,
 *   admin?: object|null,
 *   branches?: Array<object>,
 *   allAdmins?: Array<object>,
 * }} props
 * @returns {import('react').ReactElement|null}
 */
export default function BranchAdminFormModal({
  isOpen,
  onClose,
  onSave,
  admin = null,
  branches = [],
  allAdmins = [],
}) {
  const isEditing = Boolean(admin);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [staffId, setStaffId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('active');

  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Populate or reset form whenever modal opens or active admin changes
  useEffect(() => {
    if (admin) {
      setName(admin.name || '');
      setEmail(admin.email || '');
      setPhone(admin.phone || '');
      setStaffId(admin.staffId || `ADM-${admin.id.slice(-3).toUpperCase()}`);
      setBranchId(admin.branchId || branches[0]?.id || '');
      setPassword('');
      setStatus(admin.status || 'active');
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setStaffId(`ADM-${String(allAdmins.length + 1).padStart(3, '0')}`);
      setBranchId(branches[0]?.id || '');
      setPassword(generateRandomPassword());
      setStatus('active');
    }
    setFormError('');
    setShowPassword(false);
  }, [admin, allAdmins.length, branches, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Please enter administrator full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setFormError('Please enter a valid login email address.');
      return;
    }
    if (!branchId) {
      setFormError('Please select an assigned campus.');
      return;
    }
    if (!isEditing && (!password.trim() || password.trim().length < 6)) {
      setFormError('Temporary password must be at least 6 characters long.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        staffId: staffId.trim().toUpperCase(),
        branchId,
        status,
      };
      if (!isEditing) {
        payload.password = password.trim();
      }
      await onSave(payload);
      onClose();
    } catch (err) {
      setFormError(err?.message || 'Failed to save administrator details.');
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
      role="presentation"
    >
      <section
        className="students-dialog teacher-form-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="branch-admin-form-title"
      >
        <div className="students-dialog-header">
          <div>
            <p className="eyebrow-text">Campus Leadership</p>
            <h2 id="branch-admin-form-title">
              {isEditing ? 'Edit Administrator Profile' : 'Provision Branch Administrator'}
            </h2>
          </div>
          <button
            id="close-branch-admin-form-btn"
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
          <p className="form-alert" role="alert" style={{ margin: '14px 20px 0' }}>
            {formError}
          </p>
        )}

        <form className="student-form teacher-form-content" onSubmit={handleSubmit} style={{ padding: '20px' }}>
          {/* Identity Fields */}
          <div className="student-form-row">
            <label className="student-form-field">
              <span>Full Name *</span>
              <input
                id="branch-admin-name-input"
                autoFocus
                required
                placeholder="e.g. David Koech"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSaving}
              />
            </label>

            <label className="student-form-field">
              <span>Admin ID *</span>
              <input
                id="branch-admin-staff-id-input"
                required
                placeholder="e.g. ADM-001"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value.toUpperCase())}
                disabled={isSaving}
              />
            </label>
          </div>

          <div className="student-form-row">
            <label className="student-form-field">
              <span>Login Email Address *</span>
              <input
                id="branch-admin-email-input"
                type="email"
                required
                placeholder="e.g. david.koech@school.demo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSaving}
              />
            </label>

            <label className="student-form-field">
              <span>Contact Phone</span>
              <input
                id="branch-admin-phone-input"
                type="tel"
                placeholder="e.g. +254 712 345 678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isSaving}
              />
            </label>
          </div>

          <div className="student-form-row">
            <label className="student-form-field">
              <span>Assigned Campus *</span>
              <select
                id="branch-admin-campus-select"
                required
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                disabled={isSaving}
              >
                <option value="" disabled>Select campus…</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </label>

            <label className="student-form-field">
              <span>Account Status</span>
              <select
                id="branch-admin-status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={isSaving}
              >
                <option value="active">Active (Permitted login)</option>
                <option value="inactive">Inactive (Suspended)</option>
              </select>
            </label>
          </div>

          {/* Initial Password Generation for New Administrators */}
          {!isEditing && (
            <div className="teacher-credentials-box" style={{ marginTop: '6px' }}>
              <div className="credentials-box-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Key size={14} color="#155e47" aria-hidden="true" />
                  <strong style={{ fontSize: '12px', color: '#163342' }}>Temporary Password *</strong>
                </div>
                <button
                  type="button"
                  className="quick-text-action"
                  onClick={() => setPassword(generateRandomPassword())}
                  disabled={isSaving}
                  style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <RefreshCw size={11} aria-hidden="true" />
                  <span>Generate New</span>
                </button>
              </div>

              <div style={{ position: 'relative', marginTop: '8px' }}>
                <input
                  id="branch-admin-password-input"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSaving}
                  style={{
                    width: '100%',
                    paddingRight: '36px',
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    letterSpacing: '1px',
                  }}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#65808d',
                  }}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              <small style={{ display: 'block', marginTop: '6px', fontSize: '11px', color: '#57717d' }}>
                A one-time printable credential slip will be issued upon completing provisioning.
              </small>
            </div>
          )}

          <div
            className="students-dialog-actions"
            style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #edf2f4', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}
          >
            <button
              type="button"
              className="secondary-button secondary-button--small"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              id="submit-branch-admin-form-btn"
              type="submit"
              className="primary-button primary-button--small"
              disabled={isSaving}
            >
              <ShieldCheck size={14} aria-hidden="true" />
              <span>{isSaving ? 'Saving…' : isEditing ? 'Save Changes' : 'Provision Administrator'}</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

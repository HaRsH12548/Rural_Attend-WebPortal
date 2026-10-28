import {
  Building2,
  Check,
  KeyRound,
  Mail,
  Pencil,
  Phone,
  RefreshCw,
  Shield,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';

/**
 * Returns initials from an administrator's name.
 * @param {string} name
 * @returns {string} 2-letter uppercase initials.
 */
function getAdminInitials(name) {
  if (!name) return 'BA';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Branch Administrator Details Overlay Modal.
 * Directly modeled after TeacherDetailsModal to inspect full profile, credentials, and campus assignment.
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   admin: object,
 *   onEdit: (admin: object) => void,
 *   onResetPassword: (admin: object) => void,
 *   onReassign: (admin: object) => void,
 * }} props
 * @returns {import('react').ReactElement|null}
 */
export default function BranchAdminDetailsModal({
  isOpen,
  onClose,
  admin,
  onEdit,
  onResetPassword,
  onReassign,
}) {
  if (!isOpen || !admin) return null;

  const isAssigned = Boolean(admin.branchId && admin.branchName && admin.branchName !== 'Unassigned');

  return (
    <div
      className="students-dialog-backdrop teacher-details-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
      role="presentation"
    >
      <section
        className="students-dialog teacher-details-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="branch-admin-details-title"
      >
        {/* Modal Header */}
        <div className="students-dialog-header teacher-details-header">
          <div className="teacher-details-hero">
            <div className="teacher-avatar-wrap">
              <div className="teacher-avatar teacher-avatar--large">
                <span>{getAdminInitials(admin.name)}</span>
              </div>
              <span
                className={`teacher-status-dot ${
                  admin.status === 'active'
                    ? 'teacher-status-dot--active'
                    : 'teacher-status-dot--inactive'
                }`}
                title={admin.status === 'active' ? 'Active Account' : 'Inactive Account'}
              />
            </div>

            <div className="teacher-details-title-group">
              <div className="teacher-details-title-row">
                <h2 id="branch-admin-details-title">{admin.name}</h2>
                <span className="teacher-staff-badge">{admin.staffId || 'ADM-LEAD'}</span>
                <span
                  className={`status-pill ${
                    admin.status === 'active' ? 'status-pill--present' : 'status-pill--absent'
                  }`}
                >
                  {admin.status === 'active' ? 'Active Account' : 'Inactive Account'}
                </span>
              </div>
              <p className="teacher-designation-label">
                Branch Administrator · RuralAttend Leadership
              </p>
            </div>
          </div>

          <button
            id="close-branch-admin-details-btn"
            className="icon-button"
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="teacher-details-body">
          {/* Assigned Regional Campus Section */}
          <div className="teacher-details-section">
            <div className="section-title-row">
              <Building2 size={15} className="section-title-icon" aria-hidden="true" />
              <h3>Assigned Regional Campus</h3>
            </div>

            {!isAssigned ? (
              <div className="no-allotments-notice">
                <p>No regional campus currently assigned to this administrator.</p>
                <button
                  type="button"
                  className="quick-text-action"
                  onClick={() => {
                    onClose();
                    onReassign(admin);
                  }}
                >
                  Assign campus now
                </button>
              </div>
            ) : (
              <div className="details-classes-grid">
                <div className="details-class-pill-card" style={{ padding: '14px 16px' }}>
                  <div className="details-class-dot" aria-hidden="true" />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <strong style={{ fontSize: '14px', color: '#163342' }}>{admin.branchName}</strong>
                      <span className="teacher-staff-badge" style={{ background: '#eaf8f1', color: '#155e47', fontWeight: '700' }}>
                        {admin.branchCode || 'CAMPUS'}
                      </span>
                    </div>
                    <span className="details-class-meta" style={{ display: 'block', marginTop: '4px' }}>
                      Operating Campus · Full Administrative Authority · Active Term
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Administrator Profile Information */}
          <div className="teacher-details-section">
            <div className="section-title-row">
              <User size={15} className="section-title-icon" aria-hidden="true" />
              <h3>Administrator Profile Information</h3>
            </div>

            <div className="details-info-grid">
              <div className="info-item">
                <span className="info-label">Full Name</span>
                <span className="info-value">{admin.name}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Admin ID</span>
                <span className="info-value">{admin.staffId || 'ADM-LEAD'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Designation</span>
                <span className="info-value">Branch Administrator</span>
              </div>
              <div className="info-item">
                <span className="info-label">Login Email</span>
                <span className="info-value" style={{ wordBreak: 'break-all' }}>{admin.email}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Contact Phone</span>
                <span className="info-value">{admin.phone || '+254 700 000 123'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Access Authority</span>
                <span className="info-value" style={{ color: '#17664f', fontWeight: '600' }}>
                  Full Campus Management
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="teacher-details-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="secondary-button secondary-button--small"
              onClick={() => {
                onClose();
                onResetPassword(admin);
              }}
              title="Generate new temporary password and print credential slip"
            >
              <KeyRound size={13} aria-hidden="true" />
              <span>Reset Password</span>
            </button>
            <button
              type="button"
              className="secondary-button secondary-button--small"
              onClick={() => {
                onClose();
                onReassign(admin);
              }}
              title="Transfer administrator to another campus"
            >
              <RefreshCw size={13} aria-hidden="true" />
              <span>Reassign Campus</span>
            </button>
          </div>

          <button
            type="button"
            className="primary-button primary-button--small"
            onClick={() => {
              onClose();
              onEdit(admin);
            }}
          >
            <Pencil size={13} aria-hidden="true" />
            <span>Edit Profile</span>
          </button>
        </div>
      </section>
    </div>
  );
}

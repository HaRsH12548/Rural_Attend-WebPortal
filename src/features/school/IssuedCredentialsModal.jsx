import { useState } from 'react';
import {
  AlertTriangle,
  Building2,
  Check,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Printer,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';

/**
 * Modal dialog displaying a one-time temporary credentials slip for newly provisioned
 * or password-reset Branch Admins. Offers Copy and Print slip capabilities.
 * Per FUTURE.md, temporary credentials must never be stored in persistent stores or query cache.
 *
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {object|null} props.credentials
 * @param {string} props.credentials.loginId
 * @param {string} props.credentials.temporaryPassword
 * @param {boolean} props.credentials.mustChangePassword
 * @param {string} [props.credentials.userName]
 * @param {string} [props.credentials.branchName]
 * @param {string} [props.credentials.issuedAt]
 * @returns {import('react').ReactElement|null}
 */
export default function IssuedCredentialsModal({ isOpen, onClose, credentials }) {
  const [showPassword, setShowPassword] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  if (!isOpen || !credentials) return null;

  const {
    loginId,
    temporaryPassword,
    userName = 'Branch Administrator',
    branchName = 'Assigned Branch',
    issuedAt = new Date().toISOString(),
  } = credentials;

  const formattedDate = new Date(issuedAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const fullSlipText = `=========================================
RURALATTEND — TEMPORARY ACCESS SLIP
=========================================
Issued To:       ${userName}
Assigned Branch: ${branchName}
Login Identifier: ${loginId}
Temporary Key:   ${temporaryPassword}
Issued At:       ${formattedDate}
Notice:          Mandatory password update required upon first sign-in.
=========================================`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(fullSlipText);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2500);
    } catch {
      // Fallback
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div
      className="students-dialog-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
      role="presentation"
    >
      <section
        className="students-dialog credentials-slip-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="slip-dialog-title"
      >
        <div className="students-dialog-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                display: 'grid',
                placeItems: 'center',
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: '#eef6f3',
                color: '#155e47',
              }}
            >
              <ShieldCheck size={20} strokeWidth={2.2} />
            </span>
            <div>
              <p className="eyebrow-text">Top-Down Provisioning</p>
              <h2 id="slip-dialog-title" style={{ margin: '2px 0 0', fontSize: '20px' }}>
                Issued Credentials Slip
              </h2>
            </div>
          </div>
          <button
            className="icon-button"
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* The Printable Slip Box */}
        <div className="credentials-slip-box">
          <div className="slip-header-row">
            <div>
              <div className="slip-brand">RuralAttend Portal</div>
              <small style={{ color: '#5b766a', fontSize: '11px' }}>
                Branch Management Security Slip
              </small>
            </div>
            <div className="slip-date">{formattedDate}</div>
          </div>

          <div className="slip-field-group">
            <div className="slip-field">
              <label>Administrator</label>
              <div className="slip-value-row">
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', color: '#16382a' }}>
                  <User size={15} color="#2f8b6d" /> {userName}
                </span>
                <span style={{ fontSize: '11px', color: '#668074' }}>Branch Admin</span>
              </div>
            </div>

            <div className="slip-field">
              <label>Assigned Branch</label>
              <div className="slip-value-row">
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', color: '#16382a' }}>
                  <Building2 size={15} color="#2f8b6d" /> {branchName}
                </span>
              </div>
            </div>

            <div className="slip-field">
              <label>Login Identifier (Email)</label>
              <div className="slip-value-row">
                <code>{loginId}</code>
                <button
                  type="button"
                  className="slip-copy-btn"
                  onClick={() => navigator.clipboard.writeText(loginId)}
                  title="Copy Login ID"
                >
                  <Copy size={12} /> Copy
                </button>
              </div>
            </div>

            <div className="slip-field">
              <label>One-Time Temporary Password</label>
              <div className="slip-value-row">
                <code>{showPassword ? temporaryPassword : '••••••••••••'}</code>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    className="slip-copy-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                  <button
                    type="button"
                    className="slip-copy-btn"
                    onClick={() => navigator.clipboard.writeText(temporaryPassword)}
                    title="Copy Temporary Password"
                  >
                    <KeyRound size={12} /> Copy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Warning Notice */}
        <div className="credentials-warning-box">
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Important Security Notice</strong>
            <span>
              This temporary password is provided only once. Ensure you securely convey this slip or credentials to the branch administrator. The administrator will be required to change their password upon initial sign-in.
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div
          className="students-dialog-actions"
          style={{
            marginTop: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="secondary-button"
              onClick={handleCopy}
            >
              {hasCopied ? (
                <>
                  <Check size={14} color="#177359" /> Slip Copied!
                </>
              ) : (
                <>
                  <Copy size={14} /> Copy Slip Text
                </>
              )}
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={handlePrint}
            >
              <Printer size={14} /> Print Slip
            </button>
          </div>

          <button
            type="button"
            className="primary-button primary-button--small"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </section>
    </div>
  );
}

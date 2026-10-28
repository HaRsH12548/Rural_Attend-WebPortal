import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Building2,
  Check,
  ChevronDown,
  ChevronUp,
  MapPin,
  Save,
} from 'lucide-react';
import {
  getOrganizationSettings,
  updateOrganizationSettings,
  getBranches,
  updateBranchProfile,
} from './school.api';
import { AppError } from '@/lib/errors';

// ─── Branch Profile Accordion Item ────────────────────────────────────────────

/**
 * A single collapsible branch profile editor card.
 * @param {{ branch: object, onSaved: (updated: object) => void }} props
 */
function BranchProfileCard({ branch, onSaved }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [name, setName] = useState(branch.name);
  const [code, setCode] = useState(branch.code);
  const [location, setLocation] = useState(branch.location || '');
  const [description, setDescription] = useState(branch.description || '');
  const [status, setStatus] = useState(branch.status || 'active');

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);
    try {
      const updated = await updateBranchProfile(branch.id, { name, code, location, description, status });
      setSuccess('Branch profile saved.');
      onSaved(updated);
    } catch (err) {
      setError(err instanceof AppError ? err.message : 'Could not save branch profile.');
    } finally {
      setIsSaving(false);
    }
  }

  const isActive = branch.status === 'active';

  return (
    <div
      style={{
        border: '1px solid #e1e8e9',
        borderRadius: '10px',
        overflow: 'hidden',
        background: '#fff',
        boxShadow: '0 1px 4px rgba(20,47,66,0.04)',
      }}
    >
      {/* Accordion Header */}
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '16px 22px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span
          style={{
            flexShrink: 0,
            display: 'grid',
            placeItems: 'center',
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            background: '#eef6f3',
            color: '#155e47',
          }}
        >
          <MapPin size={16} />
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, fontSize: '14px', color: '#163342' }}>{branch.name}</span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 9px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 600,
                background: isActive ? '#eef6f3' : '#fef2f2',
                color: isActive ? '#155e47' : '#991b1b',
              }}
            >
              {isActive ? '● Active' : '● Inactive'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '2px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: '#68828f', fontFamily: 'monospace' }}>{branch.code}</span>
            {branch.location && (
              <span style={{ fontSize: '12px', color: '#68828f' }}>📍 {branch.location}</span>
            )}
          </div>
        </div>

        <span style={{ color: '#68828f', flexShrink: 0 }}>
          {isOpen ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
        </span>
      </button>

      {/* Accordion Body */}
      {isOpen && (
        <form onSubmit={handleSave} style={{ padding: '4px 22px 22px', borderTop: '1px solid #edf2f2' }}>
          {error && (
            <div className="data-error" role="alert" style={{ margin: '14px 0' }}>
              <AlertCircle size={13} style={{ display: 'inline', marginRight: '5px' }} />
              {error}
            </div>
          )}
          {success && (
            <div className="data-success" role="status" style={{ margin: '14px 0' }}>
              <Check size={13} style={{ display: 'inline', marginRight: '5px' }} />
              {success}
            </div>
          )}

          <div className="student-form" style={{ marginTop: '14px' }}>
            <div className="student-form-row">
              <label className="student-form-field">
                <span>Branch Name *</span>
                <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. North Rift branch" />
              </label>
              <label className="student-form-field">
                <span>Branch Code *</span>
                <input required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. NRB-01" />
              </label>
            </div>

            <div className="student-form-row">
              <label className="student-form-field">
                <span>Location</span>
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Eldoret, Rift Valley" />
              </label>
              <label className="student-form-field">
                <span>Status</span>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
            </div>

            <label className="student-form-field">
              <span>Description</span>
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description of this campus" />
            </label>

            <div style={{ marginTop: '12px', paddingTop: '14px', borderTop: '1px solid #edf2f2', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="primary-button primary-button--small" disabled={isSaving}>
                <Save size={13} aria-hidden="true" />
                <span>{isSaving ? 'Saving…' : 'Save Branch'}</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

/**
 * School Organization Profile Configuration Page.
 * Enables editing institutional details, branch profiles, and organization metadata.
 * @returns {import('react').ReactElement}
 */
export default function SchoolSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Org form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [tagline, setTagline] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [headquarters, setHeadquarters] = useState('');
  const [academicCycle, setAcademicCycle] = useState('2024–2025');

  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);

    Promise.all([getOrganizationSettings(), getBranches()])
      .then(([orgData, branchList]) => {
        if (isCurrent) {
          setSettings(orgData);
          setName(orgData.name || '');
          setCode(orgData.code || '');
          setTagline(orgData.tagline || '');
          setContactEmail(orgData.contactEmail || '');
          setContactPhone(orgData.contactPhone || '');
          setHeadquarters(orgData.headquarters || '');
          setAcademicCycle(orgData.academicCycle || '2024–2025');
          setBranches(branchList);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isCurrent) {
          setErrorMessage(err instanceof AppError ? err.message : 'Failed to load organization settings.');
          setIsLoading(false);
        }
      });

    return () => { isCurrent = false; };
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSaving(true);

    try {
      const updated = await updateOrganizationSettings({ name, code, tagline, contactEmail, contactPhone, headquarters, academicCycle });
      setSettings(updated);
      setSuccessMessage('Organization profile updated successfully.');
    } catch (err) {
      setErrorMessage(err instanceof AppError ? err.message : 'Could not save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  function handleBranchSaved(updated) {
    setBranches((prev) => prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b)));
  }

  if (isLoading) {
    return <p className="data-loading" role="status">Loading settings…</p>;
  }

  return (
    <>
      <section className="hero-strip">
        <div className="hero-copy">
          <p className="eyebrow-text">System Administration</p>
          <h2>Organization Settings</h2>
        </div>
      </section>

      {successMessage && (
        <div style={{ margin: '14px 34px 0' }} className="data-success" role="status">
          <Check size={14} style={{ display: 'inline', marginRight: '6px' }} />
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div style={{ margin: '14px 34px 0' }} className="data-error" role="alert">
          <AlertCircle size={14} style={{ display: 'inline', marginRight: '6px' }} />
          {errorMessage}
        </div>
      )}

      {/* ── Institutional Profile ─────────────────────────────────── */}
      <form onSubmit={handleSave} style={{ margin: '22px 34px 0' }}>
        <div
          style={{
            padding: '32px 36px',
            background: '#fff',
            border: '1px solid #e1e8e9',
            borderRadius: '10px',
            boxShadow: '0 2px 6px rgba(20, 47, 66, 0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
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
              <Building2 size={19} />
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#163342' }}>Institutional Profile</h3>
              <small style={{ color: '#68828f', fontSize: '12px' }}>
                Core identity, regional campus registration code, and contact information
              </small>
            </div>
          </div>

          <div className="student-form">
            <div className="student-form-row">
              <label className="student-form-field">
                <span>Organization Name *</span>
                <input required value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <label className="student-form-field">
                <span>Organization Code *</span>
                <input required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
              </label>
            </div>

            <div className="student-form-row">
              <label className="student-form-field">
                <span>Active Academic Cycle</span>
                <input value={academicCycle} onChange={(e) => setAcademicCycle(e.target.value)} />
              </label>
              <label className="student-form-field">
                <span>Central Headquarters Location</span>
                <input value={headquarters} onChange={(e) => setHeadquarters(e.target.value)} />
              </label>
            </div>

            <div className="student-form-row">
              <label className="student-form-field">
                <span>Primary Admin Contact Email</span>
                <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
              </label>
              <label className="student-form-field">
                <span>Emergency Contact Phone</span>
                <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
              </label>
            </div>

            <label className="student-form-field">
              <span>Mission / Tagline</span>
              <input value={tagline} onChange={(e) => setTagline(e.target.value)} />
            </label>

            <div
              style={{
                marginTop: '12px',
                paddingTop: '18px',
                borderTop: '1px solid #edf2f2',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <button type="submit" className="primary-button primary-button--small" disabled={isSaving}>
                <Save size={14} aria-hidden="true" />
                <span>{isSaving ? 'Saving…' : 'Save Settings'}</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* ── Branch Profiles ───────────────────────────────────────── */}
      <div style={{ margin: '28px 34px 48px' }}>
        <div
          style={{
            padding: '28px 36px',
            background: '#fff',
            border: '1px solid #e1e8e9',
            borderRadius: '10px',
            boxShadow: '0 2px 6px rgba(20, 47, 66, 0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
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
              <MapPin size={19} />
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#163342' }}>Branch Profiles</h3>
              <small style={{ color: '#68828f', fontSize: '12px' }}>
                Edit campus details — name, code, location, description, and operational status
              </small>
            </div>
            <span
              style={{
                marginLeft: 'auto',
                background: '#f0f4f5',
                color: '#163342',
                borderRadius: '20px',
                padding: '3px 12px',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              {branches.length} {branches.length === 1 ? 'campus' : 'campuses'}
            </span>
          </div>

          {branches.length === 0 ? (
            <p style={{ color: '#68828f', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>
              No branches found.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {branches.map((branch) => (
                <BranchProfileCard
                  key={branch.id}
                  branch={branch}
                  onSaved={handleBranchSaved}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

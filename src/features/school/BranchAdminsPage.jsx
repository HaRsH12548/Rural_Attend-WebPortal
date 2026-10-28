import { useEffect, useId, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  Check,
  Eye,
  Filter,
  KeyRound,
  Mail,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import {
  getBranchAdmins,
  getBranches,
  provisionBranchAdmin,
  reassignBranchAdmin,
  resetBranchAdminPassword,
  updateBranchAdmin,
} from './school.api';
import BranchAdminDetailsModal from './BranchAdminDetailsModal';
import BranchAdminFormModal from './BranchAdminFormModal';
import IssuedCredentialsModal from './IssuedCredentialsModal';
import { AppError } from '@/lib/errors';

/**
 * Returns initials from an administrator's full name.
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
 * Branch Administrator Management & Assignment Console for School Administrators.
 * Features unified card grid, campus assignments, profile management, and credential generation.
 * @returns {import('react').ReactElement}
 */
export default function BranchAdminsPage() {
  const searchInputId = useId();

  // Primary data states
  const [admins, setAdmins] = useState([]);
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [campusFilter, setCampusFilter] = useState('all'); // 'all' | branchId

  // Modals state
  const [viewingAdmin, setViewingAdmin] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [editPreviousAdmin, setEditPreviousAdmin] = useState(null);

  // Quick Reassignment State
  const [reassigningAdmin, setReassigningAdmin] = useState(null);
  const [targetBranchId, setTargetBranchId] = useState('');
  const [isReassigning, setIsReassigning] = useState(false);

  // Quick Password Reset State
  const [resettingAdmin, setResettingAdmin] = useState(null);
  const [isResetting, setIsResetting] = useState(false);

  // One-time issued credentials slip modal
  const [issuedCredentials, setIssuedCredentials] = useState(null);

  function loadData() {
    setIsLoading(true);
    setErrorMessage('');
    Promise.all([getBranchAdmins(), getBranches()])
      .then(([adminsData, branchesData]) => {
        setAdmins(adminsData);
        setBranches(branchesData);
        setIsLoading(false);
      })
      .catch((err) => {
        setErrorMessage(
          err instanceof AppError ? err.message : 'Could not load branch administrators.',
        );
        setIsLoading(false);
      });
  }

  useEffect(() => {
    loadData();
  }, []);

  // Open Provisioning Modal (Add Admin)
  function handleOpenProvision() {
    setEditPreviousAdmin(null);
    setEditingAdmin(null);
    setIsFormModalOpen(true);
  }

  // Open Edit Profile Modal
  function handleOpenEdit(admin, fromDetails = false) {
    if (fromDetails) {
      setEditPreviousAdmin(admin);
    } else {
      setEditPreviousAdmin(null);
    }
    setViewingAdmin(null);
    setEditingAdmin(admin);
    setIsFormModalOpen(true);
  }

  // Handle closing form modal
  function handleCloseFormModal(options = {}) {
    setIsFormModalOpen(false);
    const prev = editPreviousAdmin;
    setEditPreviousAdmin(null);
    setEditingAdmin(null);
    if (prev && !options?.saved) {
      const current = admins.find((a) => a.id === prev.id) || prev;
      setViewingAdmin(current);
    }
  }

  // Handle Save (Create or Update Admin)
  async function handleSaveAdmin(payload) {
    if (editingAdmin) {
      const updated = await updateBranchAdmin({
        id: editingAdmin.id,
        ...payload,
      });

      setAdmins((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setSuccessMessage(`Updated administrator profile for ${updated.name}.`);

      if (editPreviousAdmin) {
        setViewingAdmin(updated);
        setEditPreviousAdmin(null);
      }
      return updated;
    } else {
      const result = await provisionBranchAdmin(payload);
      setAdmins((prev) => [...prev, result.user]);
      setSuccessMessage(`Provisioned branch administrator account for ${result.user.name}.`);

      // Immediately display the one-time printable credentials slip
      setIssuedCredentials(result.issuedCredentials);
      return result.user;
    }
  }

  // Handle Confirm Reset Password
  async function handleConfirmResetPassword() {
    if (!resettingAdmin) return;
    setIsResetting(true);

    try {
      const result = await resetBranchAdminPassword({ userId: resettingAdmin.id });
      setSuccessMessage(`Password reset successfully for ${resettingAdmin.name}.`);
      setResettingAdmin(null);

      // Trigger one-time credentials slip modal
      setIssuedCredentials(result.issuedCredentials);
    } catch (err) {
      setErrorMessage(err?.message || 'Could not reset administrator password.');
      setResettingAdmin(null);
    } finally {
      setIsResetting(false);
    }
  }

  // Handle Reassignment Submit
  async function handleReassignSubmit(e) {
    e.preventDefault();
    if (!reassigningAdmin || !targetBranchId) return;
    setIsReassigning(true);

    try {
      const updated = await reassignBranchAdmin({
        userId: reassigningAdmin.id,
        branchId: targetBranchId,
      });

      setAdmins((prev) =>
        prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)),
      );

      setSuccessMessage(`Reassigned ${reassigningAdmin.name} to ${updated.branchName}.`);
      setReassigningAdmin(null);

      // If user had details open, update viewingAdmin as well
      if (viewingAdmin && viewingAdmin.id === updated.id) {
        setViewingAdmin((prev) => ({ ...prev, ...updated }));
      }
    } catch (err) {
      setErrorMessage(err?.message || 'Could not reassign branch administrator.');
    } finally {
      setIsReassigning(false);
    }
  }

  // Calculate Overview Statistics
  const totalAdminsCount = admins.length;
  const activeAdminsCount = admins.filter((a) => a.status === 'active').length;
  const assignedBranchIds = new Set(admins.map((a) => a.branchId).filter(Boolean));
  const assignedCampusesCount = assignedBranchIds.size;
  const totalCampusesCount = branches.length;
  const unassignedCampusesCount = Math.max(0, totalCampusesCount - assignedCampusesCount);

  // Filtered Administrators List
  const filteredAdmins = admins.filter((admin) => {
    if (statusFilter !== 'all' && admin.status !== statusFilter) {
      return false;
    }
    if (campusFilter !== 'all' && admin.branchId !== campusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchesName = admin.name?.toLowerCase().includes(q);
      const matchesEmail = admin.email?.toLowerCase().includes(q);
      const matchesStaffId = admin.staffId?.toLowerCase().includes(q);
      const matchesBranch = admin.branchName?.toLowerCase().includes(q);
      return matchesName || matchesEmail || matchesStaffId || matchesBranch;
    }
    return true;
  });

  return (
    <>
      {/* Hero Strip */}
      <section className="hero-strip teachers-hero-strip">
        <div className="hero-copy">
          <h2>Branch Administrators</h2>
          <p className="hero-subtext">
            Provision branch administrator roles, issue portal login credentials, and assign regional campuses.
          </p>
        </div>

        <div className="teachers-hero-actions">
          <button
            id="provision-branch-admin-btn"
            type="button"
            className="primary-button"
            onClick={handleOpenProvision}
          >
            <Plus size={15} aria-hidden="true" />
            <span>Provision Branch Admin</span>
          </button>
        </div>
      </section>

      <section className="teachers-page" aria-label="Branch administrators management">
        {/* Notifications */}
        {errorMessage && (
          <p className="data-error" role="alert">
            <AlertCircle size={14} style={{ display: 'inline', marginRight: '6px' }} />
            {errorMessage}
          </p>
        )}
        {successMessage && (
          <p className="data-success" role="status">
            <Check size={14} style={{ display: 'inline', marginRight: '6px' }} />
            {successMessage}
          </p>
        )}

        {/* KPI Summary Stat Cards */}
        <section
          className="stats-grid teachers-stats-grid"
          aria-label="Branch administrators overview statistics"
        >
          <article className="stat-card">
            <div className="stat-header">
              <span>Total Administrators</span>
              <span className="stat-trend positive">{activeAdminsCount} Active</span>
            </div>
            <strong>{totalAdminsCount}</strong>
            <small className="stat-subtext">appointed campus leaders</small>
          </article>

          <article className="stat-card">
            <div className="stat-header">
              <span>Assigned Campuses</span>
              <span className="stat-trend positive">
                {assignedCampusesCount} / {totalCampusesCount}
              </span>
            </div>
            <strong>
              {assignedCampusesCount} of {totalCampusesCount}
            </strong>
            <small className="stat-subtext">regional campuses with active leadership</small>
          </article>

          <article className="stat-card">
            <div className="stat-header">
              <span>Pending Campuses</span>
              <span
                className={`stat-trend ${
                  unassignedCampusesCount === 0 ? 'positive' : 'neutral'
                }`}
              >
                {unassignedCampusesCount === 0 ? 'Fully staffed' : 'Action needed'}
              </span>
            </div>
            <strong>{unassignedCampusesCount}</strong>
            <small className="stat-subtext">
              {unassignedCampusesCount > 0
                ? 'campuses needing branch administrators'
                : 'All regional campuses have assigned leadership'}
            </small>
          </article>

          <article className="stat-card">
            <div className="stat-header">
              <span>Portal Access Issued</span>
              <span className="stat-trend positive">100% Ready</span>
            </div>
            <strong>{activeAdminsCount}</strong>
            <small className="stat-subtext">administrators with active credentials</small>
          </article>
        </section>

        {/* Filter and Search Bar */}
        <div className="attendance-filter-bar teachers-filter-bar">
          <div
            className="attendance-status-tabs"
            role="tablist"
            aria-label="Administrator status filter"
          >
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === 'all'}
              className={`attendance-tab${statusFilter === 'all' ? ' attendance-tab--active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All Admins ({admins.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === 'active'}
              className={`attendance-tab${statusFilter === 'active' ? ' attendance-tab--active' : ''}`}
              onClick={() => setStatusFilter('active')}
            >
              Active ({activeAdminsCount})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === 'inactive'}
              className={`attendance-tab${statusFilter === 'inactive' ? ' attendance-tab--active' : ''}`}
              onClick={() => setStatusFilter('inactive')}
            >
              Inactive ({admins.length - activeAdminsCount})
            </button>
          </div>

          <div className="attendance-filters-secondary">
            {branches.length > 0 && (
              <div className="attendance-grade-select-wrap">
                <Filter size={13} className="filter-select-icon" aria-hidden="true" />
                <select
                  id="filter-by-campus"
                  className="attendance-grade-select"
                  aria-label="Filter by assigned campus"
                  value={campusFilter}
                  onChange={(e) => setCampusFilter(e.target.value)}
                >
                  <option value="all">All Campuses</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="attendance-search-box">
              <Search size={14} className="search-box-icon" aria-hidden="true" />
              <input
                id={searchInputId}
                type="text"
                className="attendance-search-input"
                placeholder="Search admins by name, ID, email, campus…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  aria-label="Clear search"
                  onClick={() => setSearchQuery('')}
                >
                  <X size={12} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Administrators Card Grid */}
        {isLoading ? (
          <p className="data-loading" role="status">
            Loading branch administrators and assignments…
          </p>
        ) : filteredAdmins.length === 0 ? (
          <div className="data-empty-card">
            <Users size={36} aria-hidden="true" />
            <p className="data-empty-title">No branch administrators found</p>
            <p className="data-empty">
              {admins.length === 0
                ? 'Provision branch administrators to grant access and assign leadership to individual campuses.'
                : 'Try adjusting your search query or campus filter.'}
            </p>
            {admins.length === 0 && (
              <button
                type="button"
                className="primary-button primary-button--small"
                onClick={handleOpenProvision}
                style={{ marginTop: '12px' }}
              >
                <Plus size={14} aria-hidden="true" />
                <span>Provision First Administrator</span>
              </button>
            )}
          </div>
        ) : (
          <div className="teachers-grid">
            {filteredAdmins.map((admin) => {
              const hasCampus = Boolean(admin.branchId && admin.branchName && admin.branchName !== 'Unassigned');

              return (
                <article key={admin.id} className="teacher-card">
                  {/* Card Header with Avatar & Badge */}
                  <div
                    className="teacher-card-header"
                    onClick={() => setViewingAdmin(admin)}
                    title="Click to view details and campus assignments"
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="teacher-avatar-wrap">
                      <div className="teacher-avatar">
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

                    <div className="teacher-header-info">
                      <div className="teacher-title-row">
                        <h3 className="teacher-name">{admin.name}</h3>
                        <span className="teacher-staff-badge">{admin.staffId || 'ADM-LEAD'}</span>
                      </div>
                      <p className="teacher-designation-label">
                        {admin.designation || 'Branch Administrator'}
                      </p>
                    </div>

                    <span
                      className={`status-pill ${
                        admin.status === 'active' ? 'status-pill--present' : 'status-pill--absent'
                      }`}
                    >
                      {admin.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Contact details */}
                  <div className="teacher-contact-row">
                    <div className="teacher-contact-item" title={admin.email}>
                      <Mail size={12} className="teacher-contact-icon" aria-hidden="true" />
                      <span className="teacher-contact-text">{admin.email}</span>
                    </div>
                    {admin.phone && (
                      <div className="teacher-contact-item" title={admin.phone}>
                        <Phone size={12} className="teacher-contact-icon" aria-hidden="true" />
                        <span className="teacher-contact-text">{admin.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Assigned Campus Section */}
                  <div className="teacher-allotments-block">
                    <div className="allotments-header">
                      <div className="allotments-title-group">
                        <Building2 size={13} className="allotments-icon" aria-hidden="true" />
                        <strong>Assigned Campus</strong>
                      </div>
                      <span className="allotments-count-badge">
                        {hasCampus ? admin.branchCode || 'Campus' : 'Unassigned'}
                      </span>
                    </div>

                    {!hasCampus ? (
                      <div className="no-allotments-warning">
                        <AlertTriangle size={12} aria-hidden="true" />
                        <span>No regional campus assigned yet</span>
                      </div>
                    ) : (
                      <div className="teacher-sections-pills">
                        <span className="teacher-section-pill">
                          <strong>{admin.branchName}</strong>
                          <small>({admin.branchCode || 'Primary Campus'})</small>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Actions Footer */}
                  <div className="teacher-card-actions">
                    <button
                      type="button"
                      className="primary-button primary-button--small teacher-action-btn"
                      onClick={() => setViewingAdmin(admin)}
                    >
                      <Eye size={13} aria-hidden="true" />
                      <span>View Details</span>
                    </button>

                    <button
                      type="button"
                      className="secondary-button secondary-button--small"
                      onClick={() => {
                        setReassigningAdmin(admin);
                        setTargetBranchId(admin.branchId || branches[0]?.id || '');
                      }}
                      title="Reassign to another branch campus"
                    >
                      <RefreshCw size={12} aria-hidden="true" />
                      <span>Reassign</span>
                    </button>

                    <button
                      type="button"
                      className="secondary-button secondary-button--small"
                      onClick={() => setResettingAdmin(admin)}
                      title="Reset password and issue one-time slip"
                    >
                      <KeyRound size={12} aria-hidden="true" />
                      <span>Reset Key</span>
                    </button>

                    <button
                      type="button"
                      className="icon-button teacher-icon-action"
                      onClick={() => handleOpenEdit(admin, false)}
                      title="Edit Administrator Profile"
                      aria-label="Edit administrator"
                    >
                      <Pencil size={14} aria-hidden="true" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Details Modal */}
      <BranchAdminDetailsModal
        isOpen={Boolean(viewingAdmin)}
        admin={viewingAdmin}
        onClose={() => setViewingAdmin(null)}
        onEdit={(admin) => handleOpenEdit(admin, true)}
        onResetPassword={(admin) => setResettingAdmin(admin)}
        onReassign={(admin) => {
          setReassigningAdmin(admin);
          setTargetBranchId(admin.branchId || branches[0]?.id || '');
        }}
      />

      {/* Form Modal (Provision / Edit) */}
      <BranchAdminFormModal
        isOpen={isFormModalOpen}
        admin={editingAdmin}
        branches={branches}
        allAdmins={admins}
        onClose={handleCloseFormModal}
        onSave={handleSaveAdmin}
      />

      {/* Password Reset Confirmation Dialog */}
      {resettingAdmin && (
        <div
          className="students-dialog-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isResetting) setResettingAdmin(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && !isResetting) setResettingAdmin(null);
          }}
          role="presentation"
        >
          <section
            className="students-dialog"
            style={{ width: 'min(100%, 460px)' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-modal-title"
          >
            <div className="students-dialog-header">
              <div>
                <p className="eyebrow-text">Security Reset</p>
                <h2 id="reset-modal-title">Reset Administrator Password</h2>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="Close dialog"
                disabled={isResetting}
                onClick={() => setResettingAdmin(null)}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#3b5463', lineHeight: '1.5' }}>
              Are you sure you want to reset credentials for{' '}
              <strong>{resettingAdmin.name}</strong> ({resettingAdmin.email})?
            </p>
            <p style={{ fontSize: '12px', color: '#687e8a', lineHeight: '1.4' }}>
              A fresh temporary password will be generated immediately and presented as a printable slip. Any existing session for this administrator will be invalidated.
            </p>

            <div className="students-dialog-actions" style={{ marginTop: '16px' }}>
              <button
                type="button"
                className="secondary-button"
                disabled={isResetting}
                onClick={() => setResettingAdmin(null)}
              >
                Cancel
              </button>
              <button
                className="primary-button primary-button--small"
                type="button"
                disabled={isResetting}
                onClick={handleConfirmResetPassword}
              >
                {isResetting ? 'Resetting…' : 'Generate New Key'}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Reassign Campus Modal Dialog */}
      {reassigningAdmin && (
        <div
          className="students-dialog-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isReassigning) setReassigningAdmin(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && !isReassigning) setReassigningAdmin(null);
          }}
          role="presentation"
        >
          <section
            className="students-dialog"
            style={{ width: 'min(100%, 460px)' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reassign-modal-title"
          >
            <div className="students-dialog-header">
              <div>
                <p className="eyebrow-text">Campus Reassignment</p>
                <h2 id="reassign-modal-title">Reassign {reassigningAdmin.name}</h2>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="Close dialog"
                disabled={isReassigning}
                onClick={() => setReassigningAdmin(null)}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <form className="student-form" onSubmit={handleReassignSubmit}>
              <label className="student-form-field">
                <span>Select Target Branch Campus *</span>
                <select
                  required
                  value={targetBranchId}
                  onChange={(e) => setTargetBranchId(e.target.value)}
                  style={{
                    height: '42px',
                    padding: '0 12px',
                    border: '1px solid #dce4e5',
                    borderRadius: '8px',
                    background: '#fff',
                    fontSize: '12px',
                    color: '#263f4d',
                  }}
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code}) - {b.location}
                    </option>
                  ))}
                </select>
              </label>

              <div className="students-dialog-actions" style={{ marginTop: '14px' }}>
                <button
                  type="button"
                  className="secondary-button"
                  disabled={isReassigning}
                  onClick={() => setReassigningAdmin(null)}
                >
                  Cancel
                </button>
                <button
                  className="primary-button primary-button--small"
                  type="submit"
                  disabled={isReassigning}
                >
                  {isReassigning ? 'Reassigning…' : 'Save Reassignment'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* One-Time Issued Credentials Slip Modal */}
      {issuedCredentials && (
        <IssuedCredentialsModal
          isOpen={Boolean(issuedCredentials)}
          onClose={() => setIssuedCredentials(null)}
          credentials={issuedCredentials}
        />
      )}
    </>
  );
}

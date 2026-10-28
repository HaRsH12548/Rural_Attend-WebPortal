import { useEffect, useId, useState } from 'react';
import {
  AlertCircle,
  Building2,
  Calendar,
  Check,
  ChevronRight,
  Eye,
  Filter,
  GraduationCap,
  MapPin,
  Pencil,
  Plus,
  Power,
  Search,
  ShieldCheck,
  User,
  Users,
  X,
} from 'lucide-react';
import {
  createBranch,
  getBranchDrilldown,
  getBranches,
  toggleBranchStatus,
  updateBranch,
} from './school.api';
import IssuedCredentialsModal from './IssuedCredentialsModal';
import { AppError } from '@/lib/errors';

/**
 * Branch Directory and Management page for School Administrators.
 * Enables creating new branches, editing details, toggling active status, and drilldown inspection.
 * @returns {import('react').ReactElement}
 */
export default function BranchesPage() {
  const searchInputId = useId();

  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Filtering
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [drilldownBranch, setDrilldownBranch] = useState(null);
  const [drilldownData, setDrilldownData] = useState(null);
  const [isLoadingDrilldown, setIsLoadingDrilldown] = useState(false);
  const [drilldownError, setDrilldownError] = useState('');

  // One-time credentials slip modal
  const [issuedCredentials, setIssuedCredentials] = useState(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formAdminName, setFormAdminName] = useState('');
  const [formAdminEmail, setFormAdminEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  function loadBranchesData() {
    setIsLoading(true);
    getBranches()
      .then((res) => {
        setBranches(res);
        setIsLoading(false);
      })
      .catch((err) => {
        setErrorMessage(
          err instanceof AppError ? err.message : 'Failed to load branches. Please try again.',
        );
        setIsLoading(false);
      });
  }

  useEffect(() => {
    loadBranchesData();
  }, []);

  function handleOpenCreate() {
    setEditingBranch(null);
    setFormName('');
    setFormCode(`BR-${String(branches.length + 1).padStart(2, '0')}`);
    setFormLocation('');
    setFormDescription('');
    setFormAdminName('');
    setFormAdminEmail('');
    setFormError('');
    setIsFormModalOpen(true);
  }

  function handleOpenEdit(branch) {
    setEditingBranch(branch);
    setFormName(branch.name || '');
    setFormCode(branch.code || '');
    setFormLocation(branch.location || '');
    setFormDescription(branch.description || '');
    setFormAdminName('');
    setFormAdminEmail('');
    setFormError('');
    setIsFormModalOpen(true);
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    setFormError('');
    setIsSaving(true);

    try {
      if (editingBranch) {
        const updated = await updateBranch({
          branchId: editingBranch.id,
          name: formName,
          code: formCode,
          location: formLocation,
          description: formDescription,
        });

        setBranches((prev) =>
          prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b)),
        );
        setSuccessMessage(`Updated details for branch "${updated.name}".`);
        setIsFormModalOpen(false);
      } else {
        const result = await createBranch({
          name: formName,
          code: formCode,
          location: formLocation,
          description: formDescription,
          adminName: formAdminName,
          adminEmail: formAdminEmail,
        });

        setBranches((prev) => [...prev, result.branch]);
        setSuccessMessage(`Created new branch "${result.branch.name}".`);
        setIsFormModalOpen(false);

        // If credentials were generated, immediately open the one-time slip
        if (result.issuedCredentials) {
          setIssuedCredentials(result.issuedCredentials);
        }
      }
    } catch (err) {
      setFormError(
        err instanceof AppError
          ? err.message
          : 'Could not complete branch request. Please check inputs and try again.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleStatus(branch) {
    try {
      const updated = await toggleBranchStatus({ branchId: branch.id });
      setBranches((prev) =>
        prev.map((b) => (b.id === updated.id ? { ...b, status: updated.status } : b)),
      );
      setSuccessMessage(
        `Branch "${branch.name}" is now ${updated.status === 'active' ? 'activated' : 'deactivated'}.`,
      );
    } catch (err) {
      setErrorMessage(err?.message || 'Could not change branch status.');
    }
  }

  async function handleOpenDrilldown(branch) {
    setDrilldownBranch(branch);
    setIsLoadingDrilldown(true);
    setDrilldownError('');
    setDrilldownData(null);

    try {
      const details = await getBranchDrilldown(branch.id);
      setDrilldownData(details);
    } catch (err) {
      setDrilldownError(err?.message || 'Could not load branch drilldown records.');
    } finally {
      setIsLoadingDrilldown(false);
    }
  }

  // Filtered list
  const filteredBranches = branches.filter((branch) => {
    if (statusFilter !== 'all' && branch.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchesName = branch.name?.toLowerCase().includes(q);
      const matchesCode = branch.code?.toLowerCase().includes(q);
      const matchesLocation = branch.location?.toLowerCase().includes(q);
      const matchesAdmin = branch.admin?.name?.toLowerCase().includes(q);
      return matchesName || matchesCode || matchesLocation || matchesAdmin;
    }
    return true;
  });

  const activeCount = branches.filter((b) => b.status === 'active').length;
  const inactiveCount = branches.length - activeCount;

  return (
    <>
      <section className="hero-strip">
        <div className="hero-copy">
          <p className="eyebrow-text">Campus Directory</p>
          <h2>Branches & Centers</h2>
        </div>

        <button
          type="button"
          className="primary-button primary-button--small"
          onClick={handleOpenCreate}
        >
          <Plus size={14} aria-hidden="true" />
          <span>New Branch</span>
        </button>
      </section>

      {/* Notifications */}
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

      {/* Filter and Search Bar */}
      <div className="attendance-filter-bar" style={{ margin: '20px 34px 0' }}>
        <div className="attendance-status-tabs" role="tablist" aria-label="Branch status filter">
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === 'all'}
            className={`attendance-tab${statusFilter === 'all' ? ' attendance-tab--active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All Campuses ({branches.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === 'active'}
            className={`attendance-tab${statusFilter === 'active' ? ' attendance-tab--active' : ''}`}
            onClick={() => setStatusFilter('active')}
          >
            Active ({activeCount})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === 'inactive'}
            className={`attendance-tab${statusFilter === 'inactive' ? ' attendance-tab--active' : ''}`}
            onClick={() => setStatusFilter('inactive')}
          >
            Inactive ({inactiveCount})
          </button>
        </div>

        <div className="attendance-filters-secondary">
          <div className="attendance-search-box">
            <Search size={14} className="search-box-icon" aria-hidden="true" />
            <input
              id={searchInputId}
              type="text"
              className="attendance-search-input"
              placeholder="Search branches by name, code, region…"
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

      {/* Branches Grid */}
      {isLoading ? (
        <p className="data-loading" role="status">Loading branches…</p>
      ) : filteredBranches.length === 0 ? (
        <div className="data-empty-card" style={{ margin: '24px 34px' }}>
          <Building2 size={36} aria-hidden="true" />
          <p className="data-empty-title">No branches found</p>
          <p className="data-empty">
            {branches.length === 0
              ? 'Get started by creating your organization’s first branch campus.'
              : 'Try adjusting your search criteria or status filter.'}
          </p>
          {branches.length === 0 && (
            <button
              type="button"
              className="primary-button primary-button--small"
              onClick={handleOpenCreate}
              style={{ marginTop: '12px' }}
            >
              <Plus size={14} aria-hidden="true" /> Create Branch
            </button>
          )}
        </div>
      ) : (
        <div className="school-branches-grid">
          {filteredBranches.map((branch) => {
            const isInactive = branch.status === 'inactive';
            return (
              <article
                key={branch.id}
                className={`school-branch-card${isInactive ? ' branch-card-inactive' : ''}`}
              >
                <div>
                  <div className="branch-card-top">
                    <div className="branch-card-identity">
                      <span className="branch-card-avatar" aria-hidden="true">
                        <Building2 size={22} />
                      </span>
                      <div className="branch-card-title">
                        <h3>{branch.name}</h3>
                        <div className="branch-card-meta">
                          <span className="branch-code-pill">{branch.code}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={11} /> {branch.location}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className={`branch-status-pill status-${branch.status}`}>
                      {branch.status}
                    </span>
                  </div>

                  <p className="branch-card-description">{branch.description || 'Regional education center'}</p>

                  <div className="branch-metrics-row">
                    <div className="branch-metric-cell">
                      <span>Classes</span>
                      <strong>{branch.classCount}</strong>
                    </div>
                    <div className="branch-metric-cell">
                      <span>Students</span>
                      <strong>{branch.studentCount}</strong>
                    </div>
                    <div className="branch-metric-cell">
                      <span>Teachers</span>
                      <strong>{branch.teacherCount}</strong>
                    </div>
                  </div>

                  <div className="branch-admin-row">
                    <div className="branch-admin-info">
                      <ShieldCheck size={14} color="#2f8b6d" />
                      <span>
                        Admin: <strong>{branch.admin?.name || 'Unassigned'}</strong>
                      </span>
                    </div>

                    {branch.attendanceRate !== null && (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: '#eaf8f1',
                          color: '#177359',
                        }}
                      >
                        {branch.attendanceRate}% Present
                      </span>
                    )}
                  </div>
                </div>

                <div className="branch-card-actions">
                  <button
                    type="button"
                    className="secondary-button secondary-button--small"
                    onClick={() => handleOpenDrilldown(branch)}
                    title="View class roster & teacher allocations"
                  >
                    <Eye size={13} aria-hidden="true" /> Drilldown
                  </button>

                  <button
                    type="button"
                    className="secondary-button secondary-button--small"
                    onClick={() => handleOpenEdit(branch)}
                    title="Edit branch details"
                  >
                    <Pencil size={13} aria-hidden="true" /> Edit
                  </button>

                  <button
                    type="button"
                    className="secondary-button secondary-button--small"
                    onClick={() => handleToggleStatus(branch)}
                    title={isInactive ? 'Activate branch' : 'Deactivate branch'}
                  >
                    <Power size={13} color={isInactive ? '#2f8b6d' : '#8899a6'} aria-hidden="true" />
                    <span>{isInactive ? 'Activate' : 'Disable'}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Create / Edit Branch Modal Dialog */}
      {isFormModalOpen && (
        <div
          className="students-dialog-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSaving) setIsFormModalOpen(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && !isSaving) setIsFormModalOpen(false);
          }}
          role="presentation"
        >
          <section
            className="students-dialog"
            style={{ width: 'min(100%, 500px)' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="branch-modal-title"
          >
            <div className="students-dialog-header">
              <div>
                <p className="eyebrow-text">{editingBranch ? 'Edit Center' : 'New Center'}</p>
                <h2 id="branch-modal-title">
                  {editingBranch ? `Configure ${editingBranch.name}` : 'Create New Branch'}
                </h2>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="Close dialog"
                disabled={isSaving}
                onClick={() => setIsFormModalOpen(false)}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {formError && <p className="form-alert" role="alert">{formError}</p>}

            <form className="student-form" onSubmit={handleFormSubmit}>
              <label className="student-form-field">
                <span>Branch Name *</span>
                <input
                  autoFocus
                  required
                  placeholder="e.g. Central Rift Campus"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </label>

              <div className="student-form-row">
                <label className="student-form-field">
                  <span>Branch Code *</span>
                  <input
                    required
                    placeholder="e.g. CRC-05"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  />
                </label>

                <label className="student-form-field">
                  <span>Location / Region *</span>
                  <input
                    required
                    placeholder="e.g. Nakuru, Rift Valley"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                  />
                </label>
              </div>

              <label className="student-form-field">
                <span>Description</span>
                <input
                  placeholder="Brief note on campus scope or facilities"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </label>

              {/* Optional initial admin provisioning for new branch */}
              {!editingBranch && (
                <div
                  style={{
                    padding: '14px',
                    background: '#f6faf8',
                    border: '1px solid #d4e6dc',
                    borderRadius: '8px',
                    display: 'grid',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={16} color="#1f644e" />
                    <strong style={{ fontSize: '12px', color: '#134736' }}>
                      Initial Branch Administrator (Optional)
                    </strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '11px', color: '#68867a' }}>
                    Optionally provision an administrator now. A secure temporary password slip will be generated upon creation.
                  </p>

                  <div className="student-form-row">
                    <label className="student-form-field">
                      <span>Admin Full Name</span>
                      <input
                        placeholder="e.g. Jane Doe"
                        value={formAdminName}
                        onChange={(e) => setFormAdminName(e.target.value)}
                      />
                    </label>

                    <label className="student-form-field">
                      <span>Admin Email</span>
                      <input
                        type="email"
                        placeholder="jane.doe@school.demo"
                        value={formAdminEmail}
                        onChange={(e) => setFormAdminEmail(e.target.value)}
                      />
                    </label>
                  </div>
                </div>
              )}

              <div className="students-dialog-actions" style={{ marginTop: '8px' }}>
                <button
                  type="button"
                  className="secondary-button"
                  disabled={isSaving}
                  onClick={() => setIsFormModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="primary-button primary-button--small"
                  type="submit"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving…' : editingBranch ? 'Save Changes' : 'Create Branch'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Branch Read-Only Drilldown Modal Dialog */}
      {drilldownBranch && (
        <div
          className="students-dialog-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDrilldownBranch(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setDrilldownBranch(null);
          }}
          role="presentation"
        >
          <section
            className="students-dialog drilldown-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="drilldown-title"
          >
            <div className="students-dialog-header">
              <div>
                <p className="eyebrow-text">Read-Only Campus Drilldown</p>
                <h2 id="drilldown-title" style={{ margin: '3px 0 0' }}>
                  {drilldownBranch.name} ({drilldownBranch.code})
                </h2>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="Close drilldown"
                onClick={() => setDrilldownBranch(null)}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {isLoadingDrilldown ? (
              <p className="data-loading" role="status">Loading branch records…</p>
            ) : drilldownError ? (
              <p className="data-error" role="alert">{drilldownError}</p>
            ) : drilldownData ? (
              <div>
                {/* Branch Context Summary */}
                <div className="drilldown-header-summary">
                  <div>
                    <small style={{ color: '#68867a', fontSize: '10px', textTransform: 'uppercase', fontWeight: '700' }}>
                      Region
                    </small>
                    <strong style={{ display: 'block', fontSize: '13px', color: '#16382a' }}>
                      {drilldownData.branch.location}
                    </strong>
                  </div>
                  <div>
                    <small style={{ color: '#68867a', fontSize: '10px', textTransform: 'uppercase', fontWeight: '700' }}>
                      Branch Admin
                    </small>
                    <strong style={{ display: 'block', fontSize: '13px', color: '#16382a' }}>
                      {drilldownData.admin?.name || 'Unassigned'}
                    </strong>
                  </div>
                  <div>
                    <small style={{ color: '#68867a', fontSize: '10px', textTransform: 'uppercase', fontWeight: '700' }}>
                      Active Classes
                    </small>
                    <strong style={{ display: 'block', fontSize: '13px', color: '#16382a' }}>
                      {drilldownData.classes.length} classes
                    </strong>
                  </div>
                  <div>
                    <small style={{ color: '#68867a', fontSize: '10px', textTransform: 'uppercase', fontWeight: '700' }}>
                      Registered Faculty
                    </small>
                    <strong style={{ display: 'block', fontSize: '13px', color: '#16382a' }}>
                      {drilldownData.teachers.length} teachers
                    </strong>
                  </div>
                </div>

                {/* Classes & Today's Attendance Table */}
                <h3 style={{ fontSize: '14px', margin: '0 0 10px', color: '#183444' }}>
                  Class Roster & Attendance Status
                </h3>

                <div className="drilldown-classes-table-wrap">
                  <table className="audit-table">
                    <thead>
                      <tr>
                        <th>Class</th>
                        <th>Grade & Section</th>
                        <th>Students</th>
                        <th>Today's Status</th>
                        <th>Present / Enrolled</th>
                      </tr>
                    </thead>
                    <tbody>
                      {drilldownData.classes.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '24px' }}>
                            No classes currently registered in this branch.
                          </td>
                        </tr>
                      ) : (
                        drilldownData.classes.map((cls) => {
                          const isSubmitted = cls.status === 'submitted';
                          return (
                            <tr key={cls.id}>
                              <td>
                                <strong style={{ color: '#193342' }}>{cls.name}</strong>
                              </td>
                              <td>{cls.grade} · {cls.section}</td>
                              <td>{cls.studentCount} students</td>
                              <td>
                                <span
                                  className={`branch-status-pill status-${isSubmitted ? 'active' : 'inactive'}`}
                                  style={{
                                    background: isSubmitted ? '#eaf8f1' : '#fef3c7',
                                    color: isSubmitted ? '#177359' : '#b45309',
                                  }}
                                >
                                  {isSubmitted ? `Submitted at ${cls.submittedAt}` : 'Not received'}
                                </span>
                              </td>
                              <td>
                                {isSubmitted ? (
                                  <span>
                                    <strong>{cls.presentToday}</strong> / {cls.studentCount}
                                  </span>
                                ) : (
                                  <span style={{ color: '#889ea8' }}>Pending Roll</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="primary-button primary-button--small"
                    onClick={() => setDrilldownBranch(null)}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      )}

      {/* One-time Issued Credentials Slip Modal */}
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

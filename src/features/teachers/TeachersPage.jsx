import { useEffect, useId, useState } from 'react';
import {
  AlertTriangle,
  Eye,
  Filter,
  GraduationCap,
  Key,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import {
  createTeacher,
  deleteTeacher,
  getBranchTeachers,
  getTeacherInitials,
  resetTeacherPassword,
  updateTeacher,
} from './teachers.api';
import TeacherDetailsModal from './TeacherDetailsModal';
import TeacherFormModal from './TeacherFormModal';
import { getBranchClasses } from '@/features/classes/classes.api';
import { AppError } from '@/lib/errors';
import { useAcademicYearStore } from '@/stores/academicYearStore';
import { useAuthStore } from '@/stores/authStore';

/**
 * Teachers and Staff management page for branch administrators.
 * Enables creating teachers, assigning mobile app credentials, and allotting classroom sections.
 */
export default function TeachersPage() {
  const user = useAuthStore((state) => state.user);
  const branchId = user?.branchId;
  const selectedYearId = useAcademicYearStore((state) => state.selectedYearId);

  const searchInputId = useId();

  // Data states
  const [teachers, setTeachers] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [sectionFilter, setSectionFilter] = useState('all'); // 'all' | classId

  // Modals state
  const [viewingTeacher, setViewingTeacher] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [editPreviousTeacher, setEditPreviousTeacher] = useState(null);
  const [resetPasswordSource, setResetPasswordSource] = useState(null); // 'form' | 'details' | null

  // Quick Password Reset State
  const [resettingTeacher, setResettingTeacher] = useState(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordModalError, setPasswordModalError] = useState('');

  // Delete Confirmation State
  const [deletingTeacher, setDeletingTeacher] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch teachers and available classes
  useEffect(() => {
    if (!branchId) return;

    let isCurrent = true;
    setIsLoading(true);
    setErrorMessage('');

    Promise.all([
      getBranchTeachers(branchId),
      getBranchClasses(branchId, selectedYearId),
    ])
      .then(([teacherList, classList]) => {
        if (isCurrent) {
          setTeachers(teacherList);
          setAvailableClasses(classList);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isCurrent) {
          setErrorMessage(
            err instanceof AppError
              ? err.message
              : 'Could not load teachers roster. Please try again.',
          );
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [branchId, selectedYearId]);

  // Handle open add modal
  function handleOpenAdd() {
    setEditPreviousTeacher(null);
    setEditingTeacher(null);
    setIsFormModalOpen(true);
  }

  // Handle open edit modal
  function handleOpenEdit(teacher, fromDetails = false) {
    if (fromDetails) {
      setEditPreviousTeacher(teacher);
    } else {
      setEditPreviousTeacher(null);
    }
    setViewingTeacher(null);
    setEditingTeacher(teacher);
    setIsFormModalOpen(true);
  }

  // Handle close form modal (clicking X, Esc, or backdrop)
  function handleCloseFormModal(options = {}) {
    setIsFormModalOpen(false);
    const prev = editPreviousTeacher;
    setEditPreviousTeacher(null);
    setEditingTeacher(null);
    if (prev && !options?.saved) {
      const current = teachers.find((t) => t.id === prev.id) || prev;
      setViewingTeacher(current);
    }
  }

  // Handle Save (Create or Update)
  async function handleSaveTeacher(data) {
    if (editingTeacher) {
      const updated = await updateTeacher({
        teacherId: editingTeacher.id,
        ...data,
      });
      setTeachers((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setSuccessMessage(`Updated profile and section allotments for ${updated.name}.`);
      if (editPreviousTeacher) {
        setViewingTeacher(updated);
        setEditPreviousTeacher(null);
      }
      return updated;
    } else {
      const created = await createTeacher({
        branchId,
        ...data,
      });
      setTeachers((prev) => [...prev, created]);
      setSuccessMessage(`Created app account and allotted sections for ${created.name}.`);
      return created;
    }
  }

  // Handle Delete
  async function handleConfirmDelete() {
    if (!deletingTeacher) return;
    setIsDeleting(true);
    try {
      await deleteTeacher({ teacherId: deletingTeacher.id });
      setTeachers((prev) => prev.filter((t) => t.id !== deletingTeacher.id));
      setSuccessMessage(`Removed teacher ${deletingTeacher.name} and deactivated app account.`);
      setDeletingTeacher(null);
    } catch (err) {
      setErrorMessage(err?.message || 'Could not delete teacher.');
    } finally {
      setIsDeleting(false);
    }
  }

  // Handle closing Quick Password Reset dialog
  function handleCloseResetPassword() {
    const source = resetPasswordSource;
    const teacher = resettingTeacher;
    setResettingTeacher(null);
    setResetPasswordSource(null);
    if (source === 'form') {
      setEditingTeacher(teacher);
      setIsFormModalOpen(true);
    } else if (source === 'details') {
      setViewingTeacher(teacher);
    }
  }

  // Handle Quick Password Reset
  async function handleResetPasswordSubmit(e) {
    e.preventDefault();
    if (!resettingTeacher) return;
    if (!newPasswordInput.trim() || newPasswordInput.trim().length < 6) {
      setPasswordModalError('Password must be at least 6 characters.');
      return;
    }

    setIsSavingPassword(true);
    setPasswordModalError('');
    try {
      await resetTeacherPassword({
        teacherId: resettingTeacher.id,
        newPassword: newPasswordInput.trim(),
      });
      setTeachers((prev) =>
        prev.map((t) =>
          t.id === resettingTeacher.id ? { ...t, password: newPasswordInput.trim() } : t,
        ),
      );
      setSuccessMessage(`Password updated successfully for ${resettingTeacher.name}.`);
      const source = resetPasswordSource;
      const teacher = resettingTeacher;
      setResettingTeacher(null);
      setResetPasswordSource(null);
      if (source === 'form') {
        setEditingTeacher(teacher);
        setIsFormModalOpen(true);
      } else if (source === 'details') {
        const updated = teachers.find((t) => t.id === teacher.id) || teacher;
        setViewingTeacher(updated);
      }
    } catch (err) {
      setPasswordModalError(err?.message || 'Could not reset password.');
    } finally {
      setIsSavingPassword(false);
    }
  }

  // Filtered teachers list
  const filteredTeachers = teachers.filter((teacher) => {
    if (statusFilter !== 'all' && teacher.status !== statusFilter) {
      return false;
    }
    if (sectionFilter !== 'all') {
      if (!(teacher.allottedClassIds || []).includes(sectionFilter)) {
        return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchesName = teacher.name.toLowerCase().includes(q);
      const matchesEmail = teacher.email.toLowerCase().includes(q);
      const matchesStaffId = teacher.staffId.toLowerCase().includes(q);
      const matchesDesignation = teacher.designation?.toLowerCase().includes(q);
      return matchesName || matchesEmail || matchesStaffId || matchesDesignation;
    }
    return true;
  });

  // Calculate stats
  const totalTeachersCount = teachers.length;
  const activeTeachersCount = teachers.filter((t) => t.status === 'active').length;

  const allottedClassIdSet = new Set(teachers.flatMap((t) => t.allottedClassIds || []));
  const totalAllottedSections = allottedClassIdSet.size;
  const totalClassesCount = availableClasses.length;
  const unallottedSectionsCount = Math.max(0, totalClassesCount - totalAllottedSections);

  return (
    <>
      {/* Hero Strip */}
      <section className="hero-strip teachers-hero-strip">
        <div className="hero-copy">
          <h2>Teachers &amp; Staff</h2>
          <p className="hero-subtext">
            Create teacher roles, generate mobile app login credentials, and allot classroom sections.
          </p>
        </div>

        <div className="teachers-hero-actions">
          <button
            id="add-teacher-btn"
            type="button"
            className="primary-button"
            onClick={handleOpenAdd}
          >
            <Plus size={15} aria-hidden="true" />
            <span>Add Teacher</span>
          </button>
        </div>
      </section>

      <section className="teachers-page" aria-label="Teachers dashboard">
        {errorMessage && (
          <p className="data-error" role="alert">
            {errorMessage}
          </p>
        )}
        {successMessage && (
          <p className="data-success" role="status">
            {successMessage}
          </p>
        )}

        {/* KPI Summary Cards */}
        <section className="stats-grid teachers-stats-grid" aria-label="Teachers overview statistics">
          <article className="stat-card">
            <div className="stat-header">
              <span>Total Teachers</span>
              <span className="stat-trend positive">{activeTeachersCount} Active</span>
            </div>
            <strong>{totalTeachersCount}</strong>
            <small className="stat-subtext">registered faculty members</small>
          </article>

          <article className="stat-card">
            <div className="stat-header">
              <span>Allotted Sections</span>
              <span className="stat-trend positive">
                {totalAllottedSections} / {totalClassesCount}
              </span>
            </div>
            <strong>
              {totalAllottedSections} of {totalClassesCount}
            </strong>
            <small className="stat-subtext">classes covered by teachers</small>
          </article>

          <article className="stat-card">
            <div className="stat-header">
              <span>Pending Sections</span>
              <span
                className={`stat-trend ${
                  unallottedSectionsCount === 0 ? 'positive' : 'neutral'
                }`}
              >
                {unallottedSectionsCount === 0 ? 'Fully staffed' : 'Action needed'}
              </span>
            </div>
            <strong>{unallottedSectionsCount}</strong>
            <small className="stat-subtext">
              {unallottedSectionsCount > 0
                ? 'sections without assigned teacher'
                : 'All sections have class teachers'}
            </small>
          </article>

          <article className="stat-card">
            <div className="stat-header">
              <span>App Access Issued</span>
              <span className="stat-trend positive">100% Ready</span>
            </div>
            <strong>{activeTeachersCount}</strong>
            <small className="stat-subtext">teachers with active mobile credentials</small>
          </article>
        </section>

        {/* Filter and Search Bar */}
        <div className="attendance-filter-bar teachers-filter-bar">
          <div className="attendance-status-tabs" role="tablist" aria-label="Teacher status filter">
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === 'all'}
              className={`attendance-tab${statusFilter === 'all' ? ' attendance-tab--active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All Teachers ({teachers.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === 'active'}
              className={`attendance-tab${statusFilter === 'active' ? ' attendance-tab--active' : ''}`}
              onClick={() => setStatusFilter('active')}
            >
              Active ({activeTeachersCount})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === 'inactive'}
              className={`attendance-tab${statusFilter === 'inactive' ? ' attendance-tab--active' : ''}`}
              onClick={() => setStatusFilter('inactive')}
            >
              Inactive ({teachers.length - activeTeachersCount})
            </button>
          </div>

          <div className="attendance-filters-secondary">
            {availableClasses.length > 0 && (
              <div className="attendance-grade-select-wrap">
                <Filter size={13} className="filter-select-icon" aria-hidden="true" />
                <select
                  id="filter-by-section"
                  className="attendance-grade-select"
                  aria-label="Filter by allotted section"
                  value={sectionFilter}
                  onChange={(e) => setSectionFilter(e.target.value)}
                >
                  <option value="all">All Sections</option>
                  {availableClasses.map((cls) => (
                    <option key={cls.id || cls.classId} value={cls.id || cls.classId}>
                      {cls.name}
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
                placeholder="Search teachers by name, ID, email…"
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

        {/* Teachers Grid */}
        {isLoading ? (
          <p className="data-loading" role="status">
            Loading teachers and section allotments…
          </p>
        ) : filteredTeachers.length === 0 ? (
          <div className="data-empty-card">
            <Users size={36} aria-hidden="true" />
            <p className="data-empty-title">No teachers match your search</p>
            <p className="data-empty">
              {teachers.length === 0
                ? 'Get started by creating teacher accounts and allotting them classroom sections.'
                : 'Try adjusting your search query or filters.'}
            </p>
            {teachers.length === 0 && (
              <button
                type="button"
                className="primary-button primary-button--small"
                onClick={handleOpenAdd}
                style={{ marginTop: '12px' }}
              >
                <Plus size={14} aria-hidden="true" />
                <span>Add First Teacher</span>
              </button>
            )}
          </div>
        ) : (
          <div className="teachers-grid">
            {filteredTeachers.map((teacher) => {
              const allotted = teacher.allottedClasses || [];

              return (
                <article key={teacher.id} className="teacher-card">
                  {/* Card Header with Avatar & Badge */}
                  <div
                    className="teacher-card-header"
                    onClick={() => setViewingTeacher(teacher)}
                    title="Click to view details and login credentials"
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="teacher-avatar-wrap">
                      <div className="teacher-avatar">
                        <span>{getTeacherInitials(teacher.name)}</span>
                      </div>
                      <span
                        className={`teacher-status-dot ${
                          teacher.status === 'active' ? 'teacher-status-dot--active' : 'teacher-status-dot--inactive'
                        }`}
                        title={teacher.status === 'active' ? 'Active Account' : 'Inactive Account'}
                      />
                    </div>

                    <div className="teacher-header-info">
                      <div className="teacher-title-row">
                        <h3 className="teacher-name">{teacher.name}</h3>
                        <span className="teacher-staff-badge">{teacher.staffId}</span>
                      </div>
                      <p className="teacher-designation-label">{teacher.designation || 'Class Teacher'}</p>
                    </div>

                    <span
                      className={`status-pill ${
                        teacher.status === 'active' ? 'status-pill--present' : 'status-pill--absent'
                      }`}
                    >
                      {teacher.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Contact details */}
                  <div className="teacher-contact-row">
                    <div className="teacher-contact-item" title={teacher.email}>
                      <Mail size={12} className="teacher-contact-icon" aria-hidden="true" />
                      <span className="teacher-contact-text">{teacher.email}</span>
                    </div>
                    {teacher.phone && (
                      <div className="teacher-contact-item">
                        <Phone size={12} className="teacher-contact-icon" aria-hidden="true" />
                        <span className="teacher-contact-text">{teacher.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Section Allotments Section */}
                  <div className="teacher-allotments-block">
                    <div className="allotments-header">
                      <div className="allotments-title-group">
                        <GraduationCap size={13} className="allotments-icon" aria-hidden="true" />
                        <strong>Allotted Sections</strong>
                      </div>
                      <span className="allotments-count-badge">
                        {allotted.length} {allotted.length === 1 ? 'class' : 'classes'}
                      </span>
                    </div>

                    {allotted.length === 0 ? (
                      <div className="no-allotments-warning">
                        <AlertTriangle size={12} aria-hidden="true" />
                        <span>No classroom sections allotted yet</span>
                      </div>
                    ) : (
                      <div className="teacher-sections-pills">
                        {allotted.map((cls) => (
                          <span key={cls.id} className="teacher-section-pill">
                            <strong>{cls.name}</strong>
                            <small>({cls.studentCount} std)</small>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Actions Footer */}
                  <div className="teacher-card-actions">
                    <button
                      type="button"
                      className="primary-button primary-button--small teacher-action-btn"
                      onClick={() => setViewingTeacher(teacher)}
                    >
                      <Eye size={13} aria-hidden="true" />
                      <span>View Details</span>
                    </button>

                    <button
                      type="button"
                      className="icon-button teacher-icon-action teacher-delete-btn"
                      onClick={() => setDeletingTeacher(teacher)}
                      title="Delete Teacher Account"
                      aria-label="Delete teacher"
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Teacher Details Overlay (Containing secure credentials and full profile) */}
      <TeacherDetailsModal
        isOpen={Boolean(viewingTeacher)}
        onClose={() => setViewingTeacher(null)}
        teacher={viewingTeacher}
        onEdit={(t) => handleOpenEdit(t, true)}
        onResetPassword={(t) => {
          setResetPasswordSource('details');
          setViewingTeacher(null);
          setResettingTeacher(t);
          setNewPasswordInput('Teach@' + Math.floor(100 + Math.random() * 900));
          setPasswordModalError('');
        }}
      />

      {/* Teacher Form Modal (Add / Edit) */}
      <TeacherFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        onSave={handleSaveTeacher}
        teacher={editingTeacher}
        availableClasses={availableClasses}
        allTeachers={teachers}
        onResetPassword={(t) => {
          setResetPasswordSource('form');
          setIsFormModalOpen(false);
          setResettingTeacher(t);
          setNewPasswordInput('Teach@' + Math.floor(100 + Math.random() * 900));
          setPasswordModalError('');
        }}
      />

      {/* Quick Password Reset Dialog */}
      {resettingTeacher && (
        <div
          className="students-dialog-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSavingPassword) handleCloseResetPassword();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && !isSavingPassword) handleCloseResetPassword();
          }}
        >
          <section
            className="students-dialog"
            style={{ maxWidth: '440px' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-password-title"
          >
            <div className="students-dialog-header">
              <div>
                <p className="eyebrow-text">Credentials Management</p>
                <h2 id="reset-password-title">Reset App Password</h2>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="Close dialog"
                disabled={isSavingPassword}
                onClick={handleCloseResetPassword}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {passwordModalError && (
              <p className="form-alert" role="alert" style={{ margin: '14px 24px 0' }}>
                {passwordModalError}
              </p>
            )}

            <form onSubmit={handleResetPasswordSubmit} style={{ padding: '20px 24px' }}>
              <p style={{ fontSize: '13px', color: '#556c78', marginBottom: '14px' }}>
                Set a new mobile app login password for <strong>{resettingTeacher.name}</strong>.
              </p>

              <div className="form-field">
                <div className="field-label-with-action">
                  <label htmlFor="quick-reset-password">New App Password</label>
                  <button
                    type="button"
                    className="quick-text-action"
                    onClick={() =>
                      setNewPasswordInput('Teach@' + Math.floor(100 + Math.random() * 900))
                    }
                  >
                    <RefreshCw size={11} aria-hidden="true" />
                    <span>Auto-generate</span>
                  </button>
                </div>
                <div className="password-input-wrap">
                  <Key size={13} className="password-input-icon" aria-hidden="true" />
                  <input
                    id="quick-reset-password"
                    type="text"
                    className="form-input password-input"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="students-dialog-actions" style={{ marginTop: '20px' }}>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={isSavingPassword}
                >
                  {isSavingPassword ? 'Updating…' : 'Update Password'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingTeacher && (
        <div
          className="students-dialog-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting) setDeletingTeacher(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && !isDeleting) setDeletingTeacher(null);
          }}
        >
          <section
            className="students-dialog"
            style={{ maxWidth: '440px' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-teacher-title"
          >
            <div className="students-dialog-header">
              <div>
                <p className="eyebrow-text">Confirm Action</p>
                <h2 id="delete-teacher-title">Delete Teacher</h2>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="Close dialog"
                disabled={isDeleting}
                onClick={() => setDeletingTeacher(null)}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div style={{ padding: '20px 24px' }}>
              <p style={{ fontSize: '13px', color: '#445a66', lineHeight: 1.5, margin: 0 }}>
                Are you sure you want to remove <strong>{deletingTeacher.name}</strong>? Their mobile
                app login credentials will be revoked immediately and all section allotments will be
                cleared.
              </p>

              <div className="students-dialog-actions" style={{ marginTop: '20px' }}>
                <button
                  type="button"
                  className="danger-button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  style={{
                    height: '34px',
                    padding: '0 16px',
                    background: '#c93b3b',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {isDeleting ? 'Deleting…' : 'Delete Account'}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

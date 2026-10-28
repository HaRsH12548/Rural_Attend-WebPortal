import { useEffect, useId, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCheck,
  ClipboardCheck,
  FileText,
  Filter,
  History,
  Pencil,
  Search,
  X,
} from 'lucide-react';
import {
  getClassAttendanceSession,
  getDailyAttendanceOverview,
  saveClassAttendance,
} from '@/features/attendance/attendance.api';
import AttendanceReportModal from '@/features/attendance/AttendanceReportModal';
import { AppError } from '@/lib/errors';
import { useAcademicYearStore } from '@/stores/academicYearStore';
import { useAuthStore } from '@/stores/authStore';

/**
 * Formats a YYYY-MM-DD date string to a human-readable display string.
 * @param {string} dateStr Date string in YYYY-MM-DD format.
 * @returns {string} Formatted date (e.g., "Monday, 26 Oct 2026").
 */
function formatHumanDate(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Returns today's date in local YYYY-MM-DD format.
 * @returns {string} YYYY-MM-DD string.
 */
function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Attendance management page for daily monitoring, submission review, and web roll marking.
 * @returns {import('react').ReactElement} The Attendance page.
 */
export default function AttendancePage() {
  const user = useAuthStore((state) => state.user);
  const branchId = user?.branchId;
  const selectedYearId = useAcademicYearStore((state) => state.selectedYearId);
  const activeYearId = useAcademicYearStore((state) => state.activeYearId);
  const isArchive = Boolean(selectedYearId && activeYearId && selectedYearId !== activeYearId);

  const searchInputId = useId();
  const modalSearchInputId = useId();

  // Date selection state
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Overview data state
  const [overview, setOverview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Filters state
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'submitted' | 'not_received'
  const [gradeFilter, setGradeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal roll state
  const [activeRollClass, setActiveRollClass] = useState(null);
  const [rollSession, setRollSession] = useState(null);
  const [isLoadingRoll, setIsLoadingRoll] = useState(false);
  const [rollError, setRollError] = useState('');
  const [isSavingRoll, setIsSavingRoll] = useState(false);
  const [modalSearch, setModalSearch] = useState('');

  // Fetch daily attendance overview whenever branch, year, or date changes
  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);
    setErrorMessage('');

    getDailyAttendanceOverview({
      branchId,
      academicYearId: selectedYearId,
      date: selectedDate,
    })
      .then((data) => {
        if (isCurrent) {
          setOverview(data);
          setIsLoading(false);
        }
      })
      .catch((error) => {
        if (isCurrent) {
          setErrorMessage(
            error instanceof AppError
              ? error.message
              : 'Attendance records could not be loaded. Please try again.',
          );
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [branchId, selectedYearId, selectedDate]);

  // Open the roll modal for a specific class
  async function handleOpenRoll(classroom) {
    setActiveRollClass(classroom);
    setIsLoadingRoll(true);
    setRollError('');
    setModalSearch('');

    try {
      const session = await getClassAttendanceSession({
        classId: classroom.classId,
        date: selectedDate,
      });
      setRollSession(session);
    } catch (error) {
      setRollError(
        error instanceof AppError
          ? error.message
          : 'Could not load student attendance for this class.',
      );
    } finally {
      setIsLoadingRoll(false);
    }
  }

  function handleCloseRoll() {
    setActiveRollClass(null);
    setRollSession(null);
    setRollError('');
    setModalSearch('');
  }

  // Update a single student's status or remark in the local roll session
  function handleStudentStatusChange(studentId, newStatus) {
    if (isArchive || !rollSession) return;
    setRollSession((prev) => {
      if (!prev) return prev;
      const updatedRecords = prev.records.map((r) =>
        r.studentId === studentId ? { ...r, status: newStatus } : r,
      );
      const presentCount = updatedRecords.filter((r) => r.status === 'present').length;
      const absentCount = updatedRecords.filter((r) => r.status === 'absent').length;
      return {
        ...prev,
        records: updatedRecords,
        presentCount,
        absentCount,
      };
    });
  }

  function handleStudentRemarkChange(studentId, remark) {
    if (isArchive || !rollSession) return;
    setRollSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        records: prev.records.map((r) =>
          r.studentId === studentId ? { ...r, remark } : r,
        ),
      };
    });
  }

  // Quick action: mark all students as present
  function handleMarkAllPresent() {
    if (isArchive || !rollSession) return;
    setRollSession((prev) => {
      if (!prev) return prev;
      const updatedRecords = prev.records.map((r) => ({ ...r, status: 'present' }));
      return {
        ...prev,
        records: updatedRecords,
        presentCount: updatedRecords.length,
        absentCount: 0,
      };
    });
  }

  // Save the attendance roll
  async function handleSaveRoll(event) {
    event.preventDefault();
    if (isArchive || !rollSession || !activeRollClass) return;

    setIsSavingRoll(true);
    setRollError('');
    try {
      await saveClassAttendance({
        classId: activeRollClass.classId,
        date: selectedDate,
        branchId,
        academicYearId: selectedYearId,
        records: rollSession.records,
        submittedBy: user?.name ? `${user.name} (Admin)` : 'Branch Admin',
      });

      // Refresh overview data
      const updatedOverview = await getDailyAttendanceOverview({
        branchId,
        academicYearId: selectedYearId,
        date: selectedDate,
      });
      setOverview(updatedOverview);
      setSuccessMessage(`Attendance saved for ${activeRollClass.name} successfully.`);
      handleCloseRoll();
    } catch (error) {
      setRollError(
        error instanceof AppError
          ? error.message
          : 'Could not save attendance. Please try again.',
      );
    } finally {
      setIsSavingRoll(false);
    }
  }

  // Derive unique grades for filter
  const availableGrades = [
    ...new Set((overview?.classes ?? []).map((c) => c.grade)),
  ];

  // Filter classes according to tabs, grade, and query
  const filteredClasses = (overview?.classes ?? []).filter((classroom) => {
    if (statusFilter !== 'all' && classroom.status !== statusFilter) {
      return false;
    }
    if (gradeFilter !== 'all' && classroom.grade !== gradeFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return classroom.name.toLowerCase().includes(q) || classroom.grade.toLowerCase().includes(q);
    }
    return true;
  });

  // Filter students within the modal roll view
  const modalFilteredRecords = (rollSession?.records ?? []).filter((record) => {
    if (modalSearch.trim()) {
      const q = modalSearch.toLowerCase().trim();
      return (
        record.studentName.toLowerCase().includes(q) ||
        record.rollNo?.toLowerCase().includes(q) ||
        record.admissionNo?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const stats = overview?.stats ?? {
    totalEnrolled: 0,
    totalPresent: 0,
    totalAbsent: 0,
    overallRate: 0,
    classesSubmitted: 0,
    classesPending: 0,
    totalClasses: 0,
  };

  return (
    <>
      {/* Hero Strip with Date Navigation */}
      <section className="hero-strip attendance-hero-strip">
        <div className="hero-copy">
          <h2>Attendance</h2>
          <p className="hero-subtext">
            {isArchive
              ? 'Viewing archived attendance records and historical roll submissions for this past session.'
              : 'Inspect daily branch attendance, track submission status, and record class rolls.'}
          </p>
        </div>

        <div className="attendance-date-toolbar">
          <button
            id="attendance-today-preset-btn"
            className={`date-preset-btn${selectedDate === getTodayDateString() ? ' date-preset-btn--active' : ''}`}
            type="button"
            onClick={() => setSelectedDate(getTodayDateString())}
          >
            Today
          </button>
          <div className="date-picker-wrap">
            <Calendar size={14} className="date-picker-icon" aria-hidden="true" />
            <input
              id="attendance-current-date-input"
              className="attendance-date-input"
              type="date"
              aria-label="Select attendance date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <button
            id="attendance-view-report-btn"
            type="button"
            className="primary-button view-report-btn"
            onClick={() => setIsReportModalOpen(true)}
            title="View and download attendance reports"
          >
            <FileText size={14} aria-hidden="true" />
            <span>View Report</span>
          </button>
        </div>
      </section>

      <section className="attendance-page" aria-label="Attendance dashboard">
        {errorMessage && <p className="data-error" role="alert">{errorMessage}</p>}
        {successMessage && <p className="data-success" role="status">{successMessage}</p>}

        {isLoading ? (
          <p className="data-loading" role="status">Loading attendance data…</p>
        ) : (
          <>
            {/* KPI Summary Cards */}
            <section className="stats-grid attendance-stats-grid" aria-label="Daily attendance statistics">
              <article className="stat-card">
                <div className="stat-header">
                  <span>Attendance Rate</span>
                </div>
                <strong>{stats.overallRate}%</strong>
                <div className="attendance-rate-progress-wrap" aria-hidden="true">
                  <div
                    className="attendance-rate-progress-fill"
                    style={{ width: `${Math.min(100, Math.max(0, stats.overallRate))}%` }}
                  />
                </div>
              </article>

              <article className="stat-card">
                <div className="stat-header">
                  <span>Present Today</span>
                </div>
                <strong>{stats.totalPresent}</strong>
                <small className="stat-subtext">of {stats.totalEnrolled} students enrolled</small>
              </article>

              <article className="stat-card">
                <div className="stat-header">
                  <span>Absent</span>
                </div>
                <strong>{stats.totalAbsent}</strong>
                <small className="stat-subtext">across submitted classes</small>
              </article>

              <article className="stat-card">
                <div className="stat-header">
                  <span>Class Submissions</span>
                  <span className={`stat-trend ${stats.classesPending === 0 ? 'positive' : 'neutral'}`}>
                    {stats.classesSubmitted} / {stats.totalClasses}
                  </span>
                </div>
                <strong>{stats.classesSubmitted} of {stats.totalClasses}</strong>
                <small className="stat-subtext">
                  {stats.classesPending > 0 ? `${stats.classesPending} classes pending` : 'All classes submitted'}
                </small>
              </article>
            </section>

            {/* Filter and Search Bar */}
            <div className="attendance-filter-bar">
              <div className="attendance-status-tabs" role="tablist" aria-label="Submission filter">
                <button
                  type="button"
                  role="tab"
                  aria-selected={statusFilter === 'all'}
                  className={`attendance-tab${statusFilter === 'all' ? ' attendance-tab--active' : ''}`}
                  onClick={() => setStatusFilter('all')}
                >
                  All classes ({overview?.classes.length ?? 0})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={statusFilter === 'submitted'}
                  className={`attendance-tab${statusFilter === 'submitted' ? ' attendance-tab--active' : ''}`}
                  onClick={() => setStatusFilter('submitted')}
                >
                  Submitted ({stats.classesSubmitted})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={statusFilter === 'not_received'}
                  className={`attendance-tab${statusFilter === 'not_received' ? ' attendance-tab--active' : ''}`}
                  onClick={() => setStatusFilter('not_received')}
                >
                  Pending ({stats.classesPending})
                </button>
              </div>

              <div className="attendance-filters-secondary">
                {availableGrades.length > 1 && (
                  <div className="attendance-grade-select-wrap">
                    <Filter size={13} className="filter-select-icon" aria-hidden="true" />
                    <select
                      className="attendance-grade-select"
                      aria-label="Filter by grade"
                      value={gradeFilter}
                      onChange={(e) => setGradeFilter(e.target.value)}
                    >
                      <option value="all">All Grades</option>
                      {availableGrades.map((grade) => (
                        <option key={grade} value={grade}>
                          {grade}
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
                    placeholder="Search classes…"
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

            {/* Class Cards Grid */}
            {filteredClasses.length === 0 ? (
              <div className="data-empty-card">
                <ClipboardCheck size={36} aria-hidden="true" />
                <p className="data-empty-title">No classes match your filter</p>
                <p className="data-empty">Try adjusting your status or grade filters to see classes.</p>
              </div>
            ) : (
              <div className="attendance-class-grid">
                {filteredClasses.map((classroom) => {
                  const isSubmitted = classroom.status === 'submitted';
                  const rate = classroom.attendanceRate;

                  return (
                    <article
                      key={classroom.classId}
                      className={`attendance-class-card${isSubmitted ? ' attendance-class-card--submitted' : ' attendance-class-card--pending'}`}
                    >
                      <div className="att-card-header">
                        <div>
                          <h3 className="att-card-title">{classroom.name}</h3>
                        </div>

                        <span
                          className={`att-status-badge ${
                            isSubmitted ? 'att-status-badge--submitted' : 'att-status-badge--pending'
                          }`}
                        >
                          {isSubmitted ? (
                            <>
                              <Check size={11} aria-hidden="true" />
                              <span>Submitted</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle size={11} aria-hidden="true" />
                              <span>Not received</span>
                            </>
                          )}
                        </span>
                      </div>

                      {/* Attendance Visual Meter */}
                      <div className="att-meter-section">
                        <div className="att-meter-labels">
                          <span>Attendance</span>
                          <strong>{isSubmitted && rate !== null ? `${rate}%` : 'Pending roll'}</strong>
                        </div>
                        <div className="att-meter-track" aria-hidden="true">
                          <div
                            className={`att-meter-fill ${isSubmitted ? 'att-meter-fill--active' : 'att-meter-fill--empty'}`}
                            style={{ width: `${isSubmitted && rate !== null ? rate : 0}%` }}
                          />
                        </div>
                      </div>

                      {/* Stats Tally Strip */}
                      <div className="att-tally-strip">
                        <div className="att-tally-pill att-tally-pill--present">
                          <span className="att-tally-count">{isSubmitted ? classroom.presentCount : '—'}</span>
                          <span className="att-tally-label">Present</span>
                        </div>
                        <div className="att-tally-pill att-tally-pill--absent">
                          <span className="att-tally-count">{isSubmitted ? classroom.absentCount : '—'}</span>
                          <span className="att-tally-label">Absent</span>
                        </div>
                      </div>

                      <div className="att-card-meta">
                        {isSubmitted ? (
                          <p className="att-meta-submitted">
                            <span>{classroom.submittedBy ?? 'Class Teacher'}</span>
                            <span className="att-meta-dot">·</span>
                            <span>{classroom.submittedAt ?? 'Completed'}</span>
                          </p>
                        ) : (
                          <p className="att-meta-pending">
                            Attendance has not been submitted yet for this session.
                          </p>
                        )}
                      </div>

                      <div className="att-card-actions">
                        <button
                          type="button"
                          className={
                            isSubmitted
                              ? 'secondary-button att-card-btn'
                              : 'primary-button primary-button--small att-card-btn'
                          }
                          onClick={() => handleOpenRoll(classroom)}
                        >
                          {isArchive ? (
                            <>
                              <History size={13} aria-hidden="true" />
                              <span>Inspect roll</span>
                            </>
                          ) : isSubmitted ? (
                            <>
                              <Pencil size={13} aria-hidden="true" />
                              <span>Inspect & edit roll</span>
                            </>
                          ) : (
                            <>
                              <ClipboardCheck size={14} aria-hidden="true" />
                              <span>Take attendance</span>
                            </>
                          )}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>

      {/* Student Attendance Roll Modal */}
      {activeRollClass && (
        <div
          className="students-dialog-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget && !isSavingRoll) {
              handleCloseRoll();
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && !isSavingRoll) {
              handleCloseRoll();
            }
          }}
        >
          <section
            className="students-dialog attendance-roll-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="roll-dialog-title"
          >
            {/* Modal Header */}
            <div className="students-dialog-header">
              <div>
                <p className="eyebrow-text">Class Roll Call</p>
                <h2 id="roll-dialog-title">
                  {activeRollClass.name}
                  <span className="roll-title-date"> — {formatHumanDate(selectedDate)}</span>
                </h2>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="Close dialog"
                disabled={isSavingRoll}
                onClick={handleCloseRoll}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {rollError && <p className="form-alert" role="alert">{rollError}</p>}

            {isLoadingRoll ? (
              <div className="roster-loading" role="status">Loading student roll…</div>
            ) : rollSession ? (
              <form className="attendance-roll-form" onSubmit={handleSaveRoll}>
                {/* Modal Toolbar: Tally & Actions */}
                <div className="roll-toolbar">
                  <div className="roll-tally-chips">
                    <span className="roll-chip roll-chip--present">
                      <strong>{rollSession.presentCount}</strong> Present
                    </span>
                    <span className="roll-chip roll-chip--absent">
                      <strong>{rollSession.absentCount}</strong> Absent
                    </span>
                    <span className="roll-chip roll-chip--total">
                      <strong>{rollSession.records.length}</strong> Total
                    </span>
                  </div>

                  <div className="roll-toolbar-actions">
                    <div className="roll-search-box">
                      <Search size={13} className="search-box-icon" aria-hidden="true" />
                      <input
                        id={modalSearchInputId}
                        type="text"
                        className="roll-search-input"
                        placeholder="Search students…"
                        value={modalSearch}
                        onChange={(e) => setModalSearch(e.target.value)}
                      />
                      {modalSearch && (
                        <button
                          type="button"
                          className="search-clear-btn"
                          aria-label="Clear search"
                          onClick={() => setModalSearch('')}
                        >
                          <X size={11} aria-hidden="true" />
                        </button>
                      )}
                    </div>

                    {!isArchive && (
                      <button
                        className="mark-all-present-btn"
                        type="button"
                        disabled={isSavingRoll}
                        onClick={handleMarkAllPresent}
                        title="Set all students to Present"
                      >
                        <CheckCheck size={14} aria-hidden="true" />
                        <span>Mark all present</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Student Records List */}
                <div className="roll-students-list" role="list">
                  {modalFilteredRecords.length === 0 ? (
                    <div className="roster-empty">
                      <p>No students match &ldquo;{modalSearch}&rdquo;.</p>
                    </div>
                  ) : (
                    modalFilteredRecords.map((record) => (
                      <div key={record.studentId} className="roll-student-row" role="listitem">
                        <span className="student-roster-roll">{record.rollNo}</span>
                        <div className="roll-student-details">
                          <strong>{record.studentName}</strong>
                          <small>{record.admissionNo ?? `ID: ${record.studentId}`}</small>
                        </div>

                        {/* Interactive Status Buttons or Static Badge */}
                        {isArchive ? (
                          <div className="roll-static-status-badge">
                            <span
                              className={`status-pill status-pill--${record.status}`}
                            >
                              {record.status === 'present' ? 'Present' : 'Absent'}
                            </span>
                          </div>
                        ) : (
                          <div
                            className="roll-segmented-buttons"
                            role="group"
                            aria-label={`Attendance status for ${record.studentName}`}
                          >
                            <button
                              type="button"
                              className={`segmented-btn segmented-btn--present${record.status === 'present' ? ' segmented-btn--active' : ''}`}
                              disabled={isSavingRoll}
                              onClick={() => handleStudentStatusChange(record.studentId, 'present')}
                              title="Mark Present"
                            >
                              P
                              <span className="segmented-label">Present</span>
                            </button>
                            <button
                              type="button"
                              className={`segmented-btn segmented-btn--absent${record.status === 'absent' ? ' segmented-btn--active' : ''}`}
                              disabled={isSavingRoll}
                              onClick={() => handleStudentStatusChange(record.studentId, 'absent')}
                              title="Mark Absent"
                            >
                              A
                              <span className="segmented-label">Absent</span>
                            </button>
                          </div>
                        )}

                        {/* Remark input if present */}
                        {!isArchive ? (
                          <input
                            type="text"
                            className="roll-remark-input"
                            placeholder="Add remark…"
                            value={record.remark ?? ''}
                            disabled={isSavingRoll}
                            onChange={(e) => handleStudentRemarkChange(record.studentId, e.target.value)}
                            title="Optional reason or remark"
                          />
                        ) : (
                          record.remark && (
                            <span className="roll-remark-static" title={record.remark}>
                              {record.remark}
                            </span>
                          )
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Dialog Footer Actions */}
                <div className="students-dialog-actions roll-dialog-actions">
                  {isArchive ? (
                    <div className="archive-roll-notice">
                      <History size={14} aria-hidden="true" />
                      <span>Viewing historical attendance record (Read-only)</span>
                    </div>
                  ) : (
                    <button
                      className="primary-button primary-button--small"
                      type="submit"
                      disabled={isSavingRoll}
                    >
                      {isSavingRoll ? 'Saving roll…' : 'Save attendance'}
                    </button>
                  )}
                </div>
              </form>
            ) : null}
          </section>
        </div>
      )}
      {/* Attendance Report Modal */}
      <AttendanceReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        branchId={branchId}
        academicYearId={selectedYearId}
        activeYear={overview?.academicYear}
        availableClasses={overview?.classes ?? []}
      />
    </>
  );
}

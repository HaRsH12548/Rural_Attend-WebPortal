import { useEffect, useId, useState } from 'react';
import {
  AlertCircle,
  Building2,
  Calendar,
  Check,
  CheckCheck,
  ClipboardCheck,
  Clock,
  FileText,
  Filter,
  GraduationCap,
  Pencil,
  Search,
  Users,
  X,
} from 'lucide-react';
import { getBranches, getSchoolAttendanceAnalytics } from './school.api';
import AttendanceReportModal from '@/features/attendance/AttendanceReportModal';
import { AppError } from '@/lib/errors';

/**
 * Returns today's date formatted as YYYY-MM-DD.
 * @returns {string} YYYY-MM-DD
 */
function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a YYYY-MM-DD date string into human-friendly text.
 * @param {string} dateStr
 * @returns {string} Formatted date string
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
 * Organization-wide Attendance Monitoring Page for School Administrators.
 * Features the exact unified card-based attendance theme as the Branch Admin portal,
 * monitoring regional campuses/branches in place of individual classrooms.
 * Strictly adheres to Invariant: not_received != absent!
 * @returns {import('react').ReactElement}
 */
export default function SchoolAttendanceAnalyticsPage() {
  const searchInputId = useId();

  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'submitted' | 'pending'
  const [complianceFilter, setComplianceFilter] = useState('all'); // 'all' | 'complete' | 'partial' | 'not_received'
  const [searchQuery, setSearchQuery] = useState('');

  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedDrilldownBranch, setSelectedDrilldownBranch] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Load analytics whenever date changes
  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);
    setErrorMessage('');

    getSchoolAttendanceAnalytics({
      date: selectedDate,
      branchId: 'all',
    })
      .then((data) => {
        if (isCurrent) {
          setAnalytics(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isCurrent) {
          setErrorMessage(
            err instanceof AppError
              ? err.message
              : 'Failed to load organization attendance records. Please try again.',
          );
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [selectedDate]);

  /**
   * Generates and downloads a clean CSV report of organization attendance data.
   */
  function handleExportCSV() {
    if (!analytics || !analytics.classRecords.length) return;

    const headers = [
      'Date',
      'Branch Code',
      'Branch Name',
      'Class',
      'Grade',
      'Section',
      'Teacher',
      'Status',
      'Submitted At',
      'Present Count',
      'Absent Count',
      'Total Enrolled',
      'Attendance Rate',
    ];

    const rows = analytics.classRecords.map((r) => [
      analytics.date,
      `"${r.branchCode}"`,
      `"${r.branchName}"`,
      `"${r.name}"`,
      `"${r.grade}"`,
      `"${r.section}"`,
      `"${r.teacherName}"`,
      `"${r.status === 'submitted' ? 'Submitted' : 'Not Received'}"`,
      `"${r.submittedAt || 'N/A'}"`,
      r.presentCount !== null ? r.presentCount : 'N/A',
      r.absentCount !== null ? r.absentCount : 'N/A',
      r.studentCount,
      r.attendanceRate !== null ? `${r.attendanceRate}%` : 'N/A',
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ruralattend-organization-attendance-${analytics.date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const summary = analytics?.summary;
  const branchBreakdown = analytics?.branchBreakdown || [];

  // Determine branch submission counts
  const totalBranchesCount = branchBreakdown.length;
  const submittedBranchesCount = branchBreakdown.filter((b) => b.status === 'submitted').length;
  const pendingBranchesCount = branchBreakdown.filter((b) => b.status !== 'submitted').length;

  // Filter branches based on tabs, dropdown compliance, and search
  const filteredBranches = branchBreakdown.filter((branch) => {
    // 1. Tab filter
    if (statusFilter === 'submitted' && branch.status !== 'submitted') return false;
    if (statusFilter === 'pending' && branch.status === 'submitted') return false;

    // 2. Compliance status dropdown filter
    if (complianceFilter === 'complete' && branch.status !== 'submitted') return false;
    if (complianceFilter === 'partial' && branch.status !== 'partial') return false;
    if (complianceFilter === 'not_received' && branch.status !== 'not_received') return false;

    // 3. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchesName = branch.branchName.toLowerCase().includes(q);
      const matchesCode = branch.branchCode.toLowerCase().includes(q);
      const matchesAdmin = branch.adminName?.toLowerCase().includes(q);
      return matchesName || matchesCode || matchesAdmin;
    }

    return true;
  });

  return (
    <>
      {/* Hero Strip with Date Navigation */}
      <section className="hero-strip attendance-hero-strip">
        <div className="hero-copy">
          <h2>Attendance</h2>
          <p className="hero-subtext">
            Inspect daily organization attendance, track branch submission status, and record campus rolls.
          </p>
        </div>

        <div className="attendance-date-toolbar">
          <button
            id="school-attendance-today-preset-btn"
            className={`date-preset-btn${selectedDate === getTodayDateString() ? ' date-preset-btn--active' : ''}`}
            type="button"
            onClick={() => setSelectedDate(getTodayDateString())}
          >
            Today
          </button>
          <div className="date-picker-wrap">
            <Calendar size={14} className="date-picker-icon" aria-hidden="true" />
            <input
              id="school-attendance-current-date-input"
              className="attendance-date-input"
              type="date"
              aria-label="Select attendance date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <button
            id="school-attendance-view-report-btn"
            type="button"
            className="primary-button view-report-btn"
            onClick={() => setIsReportModalOpen(true)}
            disabled={!analytics}
            title="View full attendance analytics report across all campuses"
          >
            <FileText size={14} aria-hidden="true" />
            <span>View Report</span>
          </button>
        </div>
      </section>

      <section className="attendance-page" aria-label="Organization attendance dashboard">
        {errorMessage && (
          <div className="data-error" role="alert">
            <AlertCircle size={14} style={{ display: 'inline', marginRight: '6px' }} />
            {errorMessage}
          </div>
        )}

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
                <strong>{summary?.overallRate !== null ? `${summary?.overallRate}%` : '—'}</strong>
                <div className="attendance-rate-progress-wrap" aria-hidden="true">
                  <div
                    className="attendance-rate-progress-fill"
                    style={{ width: `${Math.min(100, Math.max(0, summary?.overallRate || 0))}%` }}
                  />
                </div>
              </article>

              <article className="stat-card">
                <div className="stat-header">
                  <span>Present Today</span>
                </div>
                <strong>{summary?.totalPresent ?? 0}</strong>
                <small className="stat-subtext">of {summary?.totalStudents ?? 0} students enrolled</small>
              </article>

              <article className="stat-card">
                <div className="stat-header">
                  <span>Absent</span>
                </div>
                <strong>{summary?.totalAbsent ?? 0}</strong>
                <small className="stat-subtext">across submitted classes</small>
              </article>

              <article className="stat-card">
                <div className="stat-header">
                  <span>Branch Submissions</span>
                  <span className={`stat-trend ${pendingBranchesCount === 0 ? 'positive' : 'neutral'}`}>
                    {submittedBranchesCount} / {totalBranchesCount}
                  </span>
                </div>
                <strong>{submittedBranchesCount} of {totalBranchesCount}</strong>
                <small className="stat-subtext">
                  {pendingBranchesCount > 0 ? `${pendingBranchesCount} branch${pendingBranchesCount === 1 ? '' : 'es'} pending` : 'All branches submitted'}
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
                  All branches ({totalBranchesCount})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={statusFilter === 'submitted'}
                  className={`attendance-tab${statusFilter === 'submitted' ? ' attendance-tab--active' : ''}`}
                  onClick={() => setStatusFilter('submitted')}
                >
                  Submitted ({submittedBranchesCount})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={statusFilter === 'pending'}
                  className={`attendance-tab${statusFilter === 'pending' ? ' attendance-tab--active' : ''}`}
                  onClick={() => setStatusFilter('pending')}
                >
                  Pending ({pendingBranchesCount})
                </button>
              </div>

              <div className="attendance-filters-secondary">
                <div className="attendance-grade-select-wrap">
                  <Filter size={13} className="filter-select-icon" aria-hidden="true" />
                  <select
                    className="attendance-grade-select"
                    aria-label="Filter by branch status"
                    value={complianceFilter}
                    onChange={(e) => setComplianceFilter(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="complete">100% Submitted</option>
                    <option value="partial">Partially Submitted</option>
                    <option value="not_received">Not Received / Overdue</option>
                  </select>
                </div>

                <div className="attendance-search-box">
                  <Search size={14} className="search-box-icon" aria-hidden="true" />
                  <input
                    id={searchInputId}
                    type="text"
                    className="attendance-search-input"
                    placeholder="Search branches…"
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

            {/* Branch Cards Grid (Branches in place of Classes!) */}
            {filteredBranches.length === 0 ? (
              <div className="data-empty-card">
                <ClipboardCheck size={36} aria-hidden="true" />
                <p className="data-empty-title">No branches match your filter</p>
                <p className="data-empty">Try adjusting your submission status or search filters to see campuses.</p>
              </div>
            ) : (
              <div className="attendance-class-grid">
                {filteredBranches.map((branch) => {
                  const isSubmitted = branch.status === 'submitted';
                  const isPartial = branch.status === 'partial';
                  const rate = branch.attendanceRate;

                  return (
                    <article
                      key={branch.branchId}
                      className={`attendance-class-card${isSubmitted ? ' attendance-class-card--submitted' : ' attendance-class-card--pending'}`}
                    >
                      <div className="att-card-header">
                        <div>
                          <span className="att-card-grade-badge">{branch.branchCode} · {branch.totalClasses} CLASSES</span>
                          <h3 className="att-card-title">{branch.branchName}</h3>
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
                          ) : isPartial ? (
                            <>
                              <AlertCircle size={11} aria-hidden="true" />
                              <span>{branch.submittedClasses}/{branch.totalClasses} Received</span>
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
                          <strong>{rate !== null ? `${rate}%` : 'Pending roll'}</strong>
                        </div>
                        <div className="att-meter-track" aria-hidden="true">
                          <div
                            className={`att-meter-fill ${rate !== null ? 'att-meter-fill--active' : 'att-meter-fill--empty'}`}
                            style={{ width: `${rate !== null ? rate : 0}%` }}
                          />
                        </div>
                      </div>

                      {/* Stats Tally Strip */}
                      <div className="att-tally-strip">
                        <div className="att-tally-pill att-tally-pill--present">
                          <span className="att-tally-count">{rate !== null ? branch.presentCount : '—'}</span>
                          <span className="att-tally-label">Present</span>
                        </div>
                        <div className="att-tally-pill att-tally-pill--absent">
                          <span className="att-tally-count">{rate !== null ? branch.absentCount : '—'}</span>
                          <span className="att-tally-label">Absent</span>
                        </div>
                      </div>

                      <div className="att-card-meta">
                        {isSubmitted ? (
                          <p className="att-meta-submitted">
                            <span>{branch.adminName}</span>
                            <span className="att-meta-dot">·</span>
                            <span>All {branch.totalClasses} classes submitted</span>
                          </p>
                        ) : isPartial ? (
                          <p className="att-meta-pending">
                            {branch.submittedClasses} of {branch.totalClasses} classes submitted · {branch.notReceivedClasses} pending
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
                          onClick={() => setSelectedDrilldownBranch(branch)}
                        >
                          {isSubmitted ? (
                            <>
                              <Pencil size={13} aria-hidden="true" />
                              <span>Inspect branch details</span>
                            </>
                          ) : (
                            <>
                              <CheckCheck size={13} aria-hidden="true" />
                              <span>Inspect branch status</span>
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

      {/* Branch Class Attendance Drilldown Modal */}
      {selectedDrilldownBranch && (
        <div
          className="students-dialog-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedDrilldownBranch(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setSelectedDrilldownBranch(null);
          }}
        >
          <section
            className="students-dialog"
            style={{ maxWidth: '820px', width: '92%' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="drilldown-branch-title"
          >
            <div className="students-dialog-header">
              <div>
                <p className="eyebrow-text">Campus Roll Breakdown · {selectedDrilldownBranch.branchCode}</p>
                <h2 id="drilldown-branch-title">{selectedDrilldownBranch.branchName}</h2>
                <small style={{ color: '#68828f', fontSize: '11px' }}>
                  Date: {formatHumanDate(selectedDate)} · Admin: {selectedDrilldownBranch.adminName}
                </small>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="Close dialog"
                onClick={() => setSelectedDrilldownBranch(null)}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {/* Modal Mini KPI Bar */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '10px',
                margin: '16px 20px 20px',
                padding: '12px 16px',
                background: '#f8fafb',
                borderRadius: '8px',
                border: '1px solid #e2ebee',
              }}
            >
              <div>
                <small style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#7a8f9a', textTransform: 'uppercase' }}>
                  Attendance Rate
                </small>
                <strong style={{ fontSize: '18px', color: '#163342' }}>
                  {selectedDrilldownBranch.attendanceRate !== null ? `${selectedDrilldownBranch.attendanceRate}%` : 'Pending'}
                </strong>
              </div>
              <div>
                <small style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#7a8f9a', textTransform: 'uppercase' }}>
                  Present
                </small>
                <strong style={{ fontSize: '18px', color: '#17664f' }}>
                  {selectedDrilldownBranch.attendanceRate !== null ? selectedDrilldownBranch.presentCount : '—'}
                </strong>
              </div>
              <div>
                <small style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#7a8f9a', textTransform: 'uppercase' }}>
                  Absent
                </small>
                <strong style={{ fontSize: '18px', color: '#c93b3b' }}>
                  {selectedDrilldownBranch.attendanceRate !== null ? selectedDrilldownBranch.absentCount : '—'}
                </strong>
              </div>
              <div>
                <small style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#7a8f9a', textTransform: 'uppercase' }}>
                  Submissions
                </small>
                <strong style={{ fontSize: '18px', color: '#1d3546' }}>
                  {selectedDrilldownBranch.submittedClasses} / {selectedDrilldownBranch.totalClasses}
                </strong>
              </div>
            </div>

            {/* Class Breakdown List Table */}
            <div style={{ margin: '0 20px 24px', overflowX: 'auto', border: '1px solid #e1e8e9', borderRadius: '8px' }}>
              <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#f5f8f9', textAlign: 'left', borderBottom: '1px solid #e1e8e9' }}>
                    <th style={{ padding: '10px 14px' }}>Class</th>
                    <th style={{ padding: '10px 14px' }}>Teacher</th>
                    <th style={{ padding: '10px 14px' }}>Status</th>
                    <th style={{ padding: '10px 14px' }}>Submitted Time</th>
                    <th style={{ padding: '10px 14px' }}>Present / Total</th>
                    <th style={{ padding: '10px 14px' }}>Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedDrilldownBranch.classes?.map((c) => {
                    const isClassSubmitted = c.status === 'submitted';
                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid #edf2f4' }}>
                        <td style={{ padding: '10px 14px', fontWeight: '600', color: '#183444' }}>
                          {c.name}
                          <small style={{ display: 'block', color: '#738a96', fontSize: '10px', fontWeight: 'normal' }}>
                            {c.grade} · Sec {c.section}
                          </small>
                        </td>
                        <td style={{ padding: '10px 14px', color: '#3d5663' }}>
                          {c.teacherName || 'Unassigned'}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span
                            className={`att-status-badge ${
                              isClassSubmitted ? 'att-status-badge--submitted' : 'att-status-badge--pending'
                            }`}
                          >
                            {isClassSubmitted ? (
                              <>
                                <Check size={10} aria-hidden="true" />
                                <span>Submitted</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle size={10} aria-hidden="true" />
                                <span>Not received</span>
                              </>
                            )}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', color: '#526b77', fontSize: '11px' }}>
                          {isClassSubmitted ? (
                            <span>{c.submittedAt || '08:30'}</span>
                          ) : (
                            <span style={{ color: '#b45309', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={11} /> Overdue
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          {isClassSubmitted ? (
                            <span>
                              <strong style={{ color: '#155e47' }}>{c.presentCount}</strong> / {c.studentCount}
                            </span>
                          ) : (
                            <span style={{ color: '#889ea8' }}>— / {c.studentCount}</span>
                          )}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          {isClassSubmitted ? (
                            <strong style={{ color: c.attendanceRate >= 85 ? '#177359' : '#b45309' }}>
                              {c.attendanceRate}%
                            </strong>
                          ) : (
                            <span style={{ color: '#889ea8', fontStyle: 'italic' }}>Pending</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="students-dialog-actions" style={{ padding: '14px 20px', borderTop: '1px solid #edf2f4', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="secondary-button secondary-button--small"
                onClick={() => setSelectedDrilldownBranch(null)}
              >
                Close
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Organization-Wide Attendance Report Modal */}
      <AttendanceReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        branchId="all"
        isSchoolAdmin={true}
        branches={analytics?.branchBreakdown?.map((b) => ({
          id: b.branchId,
          name: b.branchName,
          code: b.branchCode,
        })) || []}
        activeYear={null}
        availableClasses={[...(analytics?.classRecords || []).map((c) => ({
          id: c.id,
          classId: c.id,
          name: c.name,
          branchId: c.branchId,
          branchCode: c.branchCode,
        }))]}
      />
    </>
  );
}

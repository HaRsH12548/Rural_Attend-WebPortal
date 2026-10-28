import { useEffect, useState } from 'react';
import {
  Building2,
  Calendar,
  CheckCircle,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Printer,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { getAttendanceReport } from './attendance.api';
import { AppError } from '@/lib/errors';

/**
 * Returns today's date formatted as YYYY-MM-DD.
 * @returns {string} YYYY-MM-DD string.
 */
function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns the first day of current month as YYYY-MM-DD.
 * @returns {string} YYYY-MM-DD string.
 */
function getStartOfMonthString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}

/**
 * Formats a YYYY-MM-DD string into a human-readable string.
 * @param {string} dateStr Date string.
 * @returns {string} Formatted date.
 */
function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Generates and triggers download of attendance report in CSV format.
 * @param {object} report Report data object.
 */
function downloadReportCSV(report) {
  if (!report) return;

  const lines = [];
  const isMultiBranch = report.branchId === 'all' || (report.branchBreakdown && report.branchBreakdown.length > 1);

  // Metadata headers
  lines.push(`"RuralAttend - ${isMultiBranch ? 'Organization' : 'Branch'} Attendance Report"`);
  lines.push(`"${isMultiBranch ? 'Institution' : 'Branch'}","${report.branchName || 'RuralAttend'}"`);
  lines.push(`"Academic Session","${report.academicYearName || 'Current'}"`);
  lines.push(`"Date Period","${report.period.startDate} to ${report.period.endDate}"`);
  lines.push(`"Overall Attendance Rate","${report.summary.overallRate}%"`);
  lines.push(`"Generated At","${new Date().toLocaleString()}"`);
  lines.push('');

  // Branch breakdown section (if multi-branch report)
  if (isMultiBranch && report.branchBreakdown && report.branchBreakdown.length > 0) {
    lines.push(`"REGIONAL CAMPUS BREAKDOWN"`);
    lines.push(
      `"Campus Name","Campus Code","Classes Count","Enrolled Students","Days Logged","Present Marks","Absent Marks","Attendance Rate (%)"`,
    );
    report.branchBreakdown.forEach((b) => {
      lines.push(
        `"${b.branchName}","${b.branchCode}","${b.classesCount}","${b.enrolledCount}","${b.daysCount}","${b.presentCount}","${b.absentCount}","${b.attendanceRate}%"`,
      );
    });
    lines.push('');
  }

  // Class comparison section
  lines.push(`"CLASS BREAKDOWN"`);
  lines.push(
    `"Class Name","Campus","Grade","Section","Enrolled Students","Days Logged","Present Marks","Absent Marks","Attendance Rate (%)"`,
  );
  (report.classBreakdown || []).forEach((c) => {
    lines.push(
      `"${c.className}","${c.branchName || 'Campus'}","${c.grade}","${c.section}","${c.enrolledCount}","${c.daysCount}","${c.presentCount}","${c.absentCount}","${c.attendanceRate}%"`,
    );
  });
  lines.push('');

  // Daily summary section
  lines.push(`"DAILY ATTENDANCE LOG"`);
  lines.push(`"Date","Present Total","Absent Total","Attendance Rate (%)","Classes Recorded"`);
  (report.dailyBreakdown || []).forEach((d) => {
    lines.push(
      `"${d.date}","${d.presentCount}","${d.absentCount}","${d.attendanceRate}%","${d.classesCount}"`,
    );
  });
  lines.push('');

  // Student level breakdown section
  if (report.studentBreakdown && report.studentBreakdown.length > 0) {
    lines.push(`"STUDENT ATTENDANCE DETAILS"`);
    lines.push(
      `"Roll No","Student Name","Admission No","Campus","Class","Days Present","Days Absent","Total Days","Attendance Rate (%)"`,
    );
    report.studentBreakdown.forEach((s) => {
      lines.push(
        `"${s.rollNo}","${s.studentName}","${s.admissionNo || ''}","${s.branchName || 'Campus'}","${s.className}","${s.presentDays}","${s.absentDays}","${s.totalDays}","${s.attendanceRate}%"`,
      );
    });
  }

  const csvContent = lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ruralattend_attendance_report_${report.period.startDate}_to_${report.period.endDate}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Attendance Report viewing and downloading modal.
 * Supports Academic Year, This Month, and custom Date Range picking.
 * Works seamlessly in both Branch Admin portal and School Admin portal.
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   branchId?: string,
 *   academicYearId?: string,
 *   activeYear?: object,
 *   availableClasses?: Array<object>,
 *   isSchoolAdmin?: boolean,
 *   branches?: Array<object>,
 * }} props
 */
export default function AttendanceReportModal({
  isOpen,
  onClose,
  branchId = 'all',
  academicYearId,
  activeYear,
  availableClasses = [],
  isSchoolAdmin = false,
  branches = [],
}) {
  const [scopeMode, setScopeMode] = useState('month'); // 'academic_year' | 'month' | 'custom'
  const [startDate, setStartDate] = useState(getStartOfMonthString());
  const [endDate, setEndDate] = useState(getTodayDateString());

  // Branch and Class filters
  const [selectedBranchId, setSelectedBranchId] = useState(branchId || 'all');
  const [selectedClassId, setSelectedClassId] = useState('all');

  // Active view tab: 'branches' | 'classes' | 'daily' | 'students'
  const [activeTab, setActiveTab] = useState(isSchoolAdmin && selectedBranchId === 'all' ? 'branches' : 'classes');

  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Sync selectedBranchId if branchId prop changes or modal opens
  useEffect(() => {
    if (isOpen) {
      const initialBranch = branchId || 'all';
      setSelectedBranchId(initialBranch);
      setSelectedClassId('all');
      setActiveTab(isSchoolAdmin && initialBranch === 'all' ? 'branches' : 'classes');
    }
  }, [isOpen, branchId, isSchoolAdmin]);

  // Handle preset mode changes
  function handleScopeChange(newMode) {
    setScopeMode(newMode);
    const today = getTodayDateString();

    if (newMode === 'academic_year') {
      const yearStart = activeYear?.startDate || `${new Date().getFullYear() - 1}-06-01`;
      const yearEnd = activeYear?.endDate || today;
      setStartDate(yearStart);
      setEndDate(yearEnd > today ? today : yearEnd);
    } else if (newMode === 'month') {
      setStartDate(getStartOfMonthString());
      setEndDate(today);
    }
    // If 'custom', keep the existing dates and allow user to edit
  }

  // Filter available classes according to selectedBranchId
  const filteredAvailableClasses = availableClasses.filter((c) => {
    if (!isSchoolAdmin || selectedBranchId === 'all') return true;
    return c.branchId === selectedBranchId;
  });

  // Effective branch ID for API queries
  const effectiveBranchId = isSchoolAdmin ? selectedBranchId : branchId;

  // Fetch report whenever dates or filters change
  useEffect(() => {
    if (!isOpen) return;

    let isCurrent = true;
    setIsLoading(true);
    setErrorMessage('');

    getAttendanceReport({
      branchId: effectiveBranchId,
      academicYearId,
      startDate,
      endDate,
      classId: selectedClassId,
    })
      .then((data) => {
        if (isCurrent) {
          setReport(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isCurrent) {
          setErrorMessage(
            err instanceof AppError ? err.message : 'Could not generate report. Please try again.',
          );
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [isOpen, effectiveBranchId, academicYearId, startDate, endDate, selectedClassId]);

  if (!isOpen) return null;

  function handlePrint() {
    window.print();
  }

  const isMultiBranchReport = isSchoolAdmin && selectedBranchId === 'all';

  return (
    <div
      className="students-dialog-backdrop report-dialog-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
      role="presentation"
    >
      <section
        className="students-dialog attendance-report-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-dialog-title"
      >
        {/* Modal Header */}
        <div className="students-dialog-header report-modal-header">
          <div>
            <div className="report-header-badge-row">
              <span className="report-badge">
                {isMultiBranchReport ? 'Organization Report' : 'Branch Report'}
              </span>
              <span className="report-period-badge">
                {formatDisplayDate(startDate)} — {formatDisplayDate(endDate)}
              </span>
            </div>
            <h2 id="report-dialog-title">Attendance Report &amp; Analytics</h2>
            <p className="report-header-subtext">
              {isMultiBranchReport
                ? 'View aggregate organization attendance across all campuses or download full records for the selected period.'
                : 'View aggregate branch attendance or download full records for the selected period.'}
            </p>
          </div>
          <button
            id="close-report-modal-btn"
            className="icon-button"
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="report-toolbar">
          <div className="report-scope-group" role="group" aria-label="Report period preset">
            <button
              id="report-scope-ay-btn"
              type="button"
              className={`report-scope-btn${scopeMode === 'academic_year' ? ' report-scope-btn--active' : ''}`}
              onClick={() => handleScopeChange('academic_year')}
            >
              Academic Year
            </button>
            <button
              id="report-scope-month-btn"
              type="button"
              className={`report-scope-btn${scopeMode === 'month' ? ' report-scope-btn--active' : ''}`}
              onClick={() => handleScopeChange('month')}
            >
              This Month
            </button>
            <button
              id="report-scope-custom-btn"
              type="button"
              className={`report-scope-btn${scopeMode === 'custom' ? ' report-scope-btn--active' : ''}`}
              onClick={() => handleScopeChange('custom')}
            >
              Custom Range
            </button>
          </div>

          <div className="report-date-pickers">
            <div className="report-date-field">
              <label htmlFor="report-start-date">From</label>
              <div className="date-picker-wrap">
                <Calendar size={13} className="date-picker-icon" aria-hidden="true" />
                <input
                  id="report-start-date"
                  type="date"
                  className="attendance-date-input"
                  value={startDate}
                  onChange={(e) => {
                    setScopeMode('custom');
                    setStartDate(e.target.value);
                  }}
                />
              </div>
            </div>

            <div className="report-date-field">
              <label htmlFor="report-end-date">To</label>
              <div className="date-picker-wrap">
                <Calendar size={13} className="date-picker-icon" aria-hidden="true" />
                <input
                  id="report-end-date"
                  type="date"
                  className="attendance-date-input"
                  value={endDate}
                  onChange={(e) => {
                    setScopeMode('custom');
                    setEndDate(e.target.value);
                  }}
                />
              </div>
            </div>

            {/* School Admin Campus Selector */}
            {isSchoolAdmin && branches.length > 0 && (
              <div className="report-class-filter-field">
                <label htmlFor="report-branch-select">Campus</label>
                <div className="attendance-grade-select-wrap">
                  <Building2 size={13} className="filter-select-icon" aria-hidden="true" />
                  <select
                    id="report-branch-select"
                    className="attendance-grade-select"
                    value={selectedBranchId}
                    onChange={(e) => {
                      const newBranch = e.target.value;
                      setSelectedBranchId(newBranch);
                      setSelectedClassId('all');
                      if (newBranch !== 'all' && activeTab === 'branches') {
                        setActiveTab('classes');
                      }
                    }}
                  >
                    <option value="all">All Campuses</option>
                    {branches.map((b) => (
                      <option key={b.id || b.branchId} value={b.id || b.branchId}>
                        {b.name || b.branchName} ({b.code || b.branchCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Classroom Selector */}
            <div className="report-class-filter-field">
              <label htmlFor="report-class-select">Class</label>
              <div className="attendance-grade-select-wrap">
                <Filter size={13} className="filter-select-icon" aria-hidden="true" />
                <select
                  id="report-class-select"
                  className="attendance-grade-select"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                >
                  <option value="all">All Classes</option>
                  {filteredAvailableClasses.map((c) => (
                    <option key={c.classId || c.id} value={c.classId || c.id}>
                      {c.name} {isSchoolAdmin && c.branchCode ? `(${c.branchCode})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="report-action-buttons">
            <button
              id="download-report-csv-btn"
              type="button"
              className="primary-button primary-button--small download-report-btn"
              onClick={() => downloadReportCSV(report)}
              disabled={isLoading || !report}
              title="Download full attendance report as CSV"
            >
              <Download size={14} aria-hidden="true" />
              <span>Download CSV</span>
            </button>

            <button
              id="print-report-btn"
              type="button"
              className="secondary-button print-report-btn"
              onClick={handlePrint}
              disabled={isLoading || !report}
              title="Print report or save as PDF"
            >
              <Printer size={14} aria-hidden="true" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

        {errorMessage && (
          <p className="data-error" role="alert" style={{ margin: '14px 24px' }}>
            {errorMessage}
          </p>
        )}

        {/* Content Body */}
        {isLoading ? (
          <div className="report-loading-wrap" role="status">
            <p className="data-loading">Generating attendance report…</p>
          </div>
        ) : report ? (
          <div className="report-content-body printable-report">
            {/* KPI Summary Cards */}
            <section className="report-kpi-grid" aria-label="Report overview statistics">
              <article className="stat-card report-stat-card">
                <div className="stat-header">
                  <span>Overall Attendance</span>
                  <span
                    className={`stat-trend ${
                      report.summary.overallRate >= 85
                        ? 'positive'
                        : report.summary.overallRate >= 70
                        ? 'neutral'
                        : 'negative'
                    }`}
                  >
                    {report.summary.overallRate}%
                  </span>
                </div>
                <strong>{report.summary.overallRate}%</strong>
                <div className="attendance-rate-progress-wrap" aria-hidden="true">
                  <div
                    className="attendance-rate-progress-fill"
                    style={{
                      width: `${Math.min(100, Math.max(0, report.summary.overallRate))}%`,
                    }}
                  />
                </div>
              </article>

              <article className="stat-card report-stat-card">
                <div className="stat-header">
                  <span>Present Marks</span>
                  <CheckCircle size={14} className="report-icon-present" aria-hidden="true" />
                </div>
                <strong>{report.summary.totalPresent.toLocaleString()}</strong>
                <small className="stat-subtext">total student present entries</small>
              </article>

              <article className="stat-card report-stat-card">
                <div className="stat-header">
                  <span>Absence Marks</span>
                  <XCircle size={14} className="report-icon-absent" aria-hidden="true" />
                </div>
                <strong>{report.summary.totalAbsent.toLocaleString()}</strong>
                <small className="stat-subtext">total student absences</small>
              </article>

              <article className="stat-card report-stat-card">
                <div className="stat-header">
                  <span>School Days Logged</span>
                  <Calendar size={14} className="report-icon-calendar" aria-hidden="true" />
                </div>
                <strong>{report.summary.daysCount}</strong>
                <small className="stat-subtext">
                  across {report.summary.totalEnrolled} students
                </small>
              </article>
            </section>

            {/* View Navigation Tabs */}
            <div className="report-view-tabs" role="tablist">
              {isMultiBranchReport && (
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'branches'}
                  className={`attendance-tab${activeTab === 'branches' ? ' attendance-tab--active' : ''}`}
                  onClick={() => setActiveTab('branches')}
                >
                  <Building2 size={13} aria-hidden="true" />
                  <span>Campus Comparison ({report.branchBreakdown?.length || 0})</span>
                </button>
              )}

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'classes'}
                className={`attendance-tab${activeTab === 'classes' ? ' attendance-tab--active' : ''}`}
                onClick={() => setActiveTab('classes')}
              >
                <Users size={13} aria-hidden="true" />
                <span>
                  {isMultiBranchReport ? 'Class Breakdown' : 'Class Comparison'} (
                  {report.classBreakdown.length})
                </span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'daily'}
                className={`attendance-tab${activeTab === 'daily' ? ' attendance-tab--active' : ''}`}
                onClick={() => setActiveTab('daily')}
              >
                <Calendar size={13} aria-hidden="true" />
                <span>Daily Trend Log ({report.dailyBreakdown.length} days)</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'students'}
                className={`attendance-tab${activeTab === 'students' ? ' attendance-tab--active' : ''}`}
                onClick={() => setActiveTab('students')}
              >
                <FileSpreadsheet size={13} aria-hidden="true" />
                <span>Student Roster ({report.studentBreakdown.length})</span>
              </button>
            </div>

            {/* Tab 0: Campus Comparison Table (For School Admin multi-branch) */}
            {activeTab === 'branches' && isMultiBranchReport && (
              <div className="report-table-card">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th scope="col">Campus / Branch Name</th>
                      <th scope="col">Campus Code</th>
                      <th scope="col">Total Classes</th>
                      <th scope="col">Enrolled Students</th>
                      <th scope="col">Days Recorded</th>
                      <th scope="col">Present Marks</th>
                      <th scope="col">Absent Marks</th>
                      <th scope="col" style={{ width: '180px' }}>
                        Attendance Rate
                      </th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(report.branchBreakdown || []).map((b) => (
                      <tr key={b.branchId}>
                        <td>
                          <strong>{b.branchName}</strong>
                        </td>
                        <td>
                          <span className="teacher-staff-badge">{b.branchCode}</span>
                        </td>
                        <td>{b.classesCount} classes</td>
                        <td>{b.enrolledCount}</td>
                        <td>{b.daysCount}</td>
                        <td className="text-present">{b.presentCount.toLocaleString()}</td>
                        <td className="text-absent">{b.absentCount.toLocaleString()}</td>
                        <td>
                          <div className="report-table-rate-wrap">
                            <strong>{b.attendanceRate}%</strong>
                            <div className="attendance-rate-progress-wrap" aria-hidden="true">
                              <div
                                className="attendance-rate-progress-fill"
                                style={{ width: `${b.attendanceRate}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`report-status-badge ${
                              b.attendanceRate >= 90
                                ? 'report-status-badge--success'
                                : b.attendanceRate >= 80
                                ? 'report-status-badge--warning'
                                : 'report-status-badge--danger'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 1: Class Comparison Table */}
            {activeTab === 'classes' && (
              <div className="report-table-card">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th scope="col">Class Name</th>
                      {isMultiBranchReport && <th scope="col">Campus</th>}
                      <th scope="col">Grade</th>
                      <th scope="col">Enrolled</th>
                      <th scope="col">Days Recorded</th>
                      <th scope="col">Present Marks</th>
                      <th scope="col">Absent Marks</th>
                      <th scope="col" style={{ width: '180px' }}>
                        Attendance Rate
                      </th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.classBreakdown.map((c) => (
                      <tr key={c.classId}>
                        <td>
                          <strong>{c.className}</strong>
                        </td>
                        {isMultiBranchReport && (
                          <td>
                            <span className="teacher-staff-badge" style={{ marginRight: '6px' }}>
                              {c.branchCode}
                            </span>
                            <span>{c.branchName}</span>
                          </td>
                        )}
                        <td>{c.grade}</td>
                        <td>{c.enrolledCount}</td>
                        <td>{c.daysCount}</td>
                        <td className="text-present">{c.presentCount}</td>
                        <td className="text-absent">{c.absentCount}</td>
                        <td>
                          <div className="report-table-rate-wrap">
                            <strong>{c.attendanceRate}%</strong>
                            <div className="attendance-rate-progress-wrap" aria-hidden="true">
                              <div
                                className="attendance-rate-progress-fill"
                                style={{ width: `${c.attendanceRate}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`report-status-badge ${
                              c.attendanceRate >= 90
                                ? 'report-status-badge--success'
                                : c.attendanceRate >= 80
                                ? 'report-status-badge--warning'
                                : 'report-status-badge--danger'
                            }`}
                          >
                            {c.attendanceRate >= 90
                              ? 'Good'
                              : c.attendanceRate >= 80
                              ? 'Fair'
                              : 'Needs Attention'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 2: Daily Trend Table */}
            {activeTab === 'daily' && (
              <div className="report-table-card">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th scope="col">Date</th>
                      <th scope="col">Present Marks</th>
                      <th scope="col">Absent Marks</th>
                      <th scope="col" style={{ width: '180px' }}>
                        Daily Attendance Rate
                      </th>
                      <th scope="col">Classes Recorded</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.dailyBreakdown.map((d) => (
                      <tr key={d.date}>
                        <td>
                          <strong>{formatDisplayDate(d.date)}</strong>
                          <span className="report-date-iso">({d.date})</span>
                        </td>
                        <td className="text-present">{d.presentCount.toLocaleString()}</td>
                        <td className="text-absent">{d.absentCount.toLocaleString()}</td>
                        <td>
                          <div className="report-table-rate-wrap">
                            <strong>{d.attendanceRate}%</strong>
                            <div className="attendance-rate-progress-wrap" aria-hidden="true">
                              <div
                                className="attendance-rate-progress-fill"
                                style={{ width: `${d.attendanceRate}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td>{d.classesCount} classes</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 3: Student Roster Breakdown */}
            {activeTab === 'students' && (
              <div className="report-table-card">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th scope="col">Roll No</th>
                      <th scope="col">Student Name</th>
                      {isMultiBranchReport && <th scope="col">Campus</th>}
                      <th scope="col">Class</th>
                      <th scope="col">Days Present</th>
                      <th scope="col">Days Absent</th>
                      <th scope="col" style={{ width: '180px' }}>
                        Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.studentBreakdown.length === 0 ? (
                      <tr>
                        <td
                          colSpan={isMultiBranchReport ? 7 : 6}
                          style={{ textAlign: 'center', padding: '24px' }}
                        >
                          No student records found.
                        </td>
                      </tr>
                    ) : (
                      report.studentBreakdown.map((s) => (
                        <tr key={`${s.className}-${s.studentId}`}>
                          <td>{s.rollNo}</td>
                          <td>
                            <strong>{s.studentName}</strong>
                            {s.admissionNo && (
                              <small className="report-student-adm">({s.admissionNo})</small>
                            )}
                          </td>
                          {isMultiBranchReport && (
                            <td>
                              <span className="teacher-staff-badge" style={{ marginRight: '4px' }}>
                                {s.branchCode}
                              </span>
                              <span>{s.branchName}</span>
                            </td>
                          )}
                          <td>{s.className}</td>
                          <td className="text-present">{s.presentDays}</td>
                          <td className="text-absent">{s.absentDays}</td>
                          <td>
                            <div className="report-table-rate-wrap">
                              <strong>{s.attendanceRate}%</strong>
                              <div className="attendance-rate-progress-wrap" aria-hidden="true">
                                <div
                                  className="attendance-rate-progress-fill"
                                  style={{ width: `${s.attendanceRate}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}

        {/* Modal Footer */}
        <div className="students-dialog-actions report-modal-actions">
          <p className="report-footer-note">
            RuralAttend Attendance Records · Synchronized with Local Cache &amp; Academic Database
          </p>
          <button type="button" className="secondary-button" onClick={onClose}>
            Close
          </button>
        </div>
      </section>
    </div>
  );
}

import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  MapPin,
  Phone,
  Search,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import {
  deleteStudent,
  getBranchClasses,
  getBranchStudents,
} from '@/features/classes/classes.api';
import { AppError } from '@/lib/errors';
import { useAcademicYearStore } from '@/stores/academicYearStore';
import { useAuthStore } from '@/stores/authStore';

/**
 * Formats an ISO date string (YYYY-MM-DD) into a human readable format.
 * @param {string} dateStr ISO date string.
 * @returns {string} Formatted display date.
 */
function formatDob(dateStr) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr || '—';
  try {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Extracts uppercase initials from a student's full name.
 * @param {string} name Full name.
 * @returns {string} Initials string.
 */
function getStudentInitials(name) {
  if (!name) return 'ST';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Student Directory Page with Database-Style Pagination & Query-Level Filtering.
 * Avoids loading 1000s of students at once. Queries the database by class and search terms
 * (like SQL WHERE name = ...), then paginates the matched results with LIMIT and OFFSET.
 * @returns {import('react').ReactElement} Students directory page.
 */
export default function StudentsPage() {
  const user = useAuthStore((state) => state.user);
  const branchId = user?.branchId;
  const selectedYearId = useAcademicYearStore((state) => state.selectedYearId);
  const activeYearId = useAcademicYearStore((state) => state.activeYearId);
  const isArchive = Boolean(selectedYearId && activeYearId && selectedYearId !== activeYearId);

  const searchInputId = useId();

  // Data states
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Server-style Pagination & Filter Query States
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');

  // Delete student confirmation
  const [deletingStudent, setDeletingStudent] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce search query to simulate backend network query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load available branch classes for the filter dropdown
  useEffect(() => {
    if (!branchId) return;
    getBranchClasses(branchId, selectedYearId)
      .then((classList) => setClasses(classList))
      .catch(() => {});
  }, [branchId, selectedYearId]);

  // Fetch paginated students via query (filters applied across the entire database)
  useEffect(() => {
    if (!branchId) return;

    let isCurrent = true;
    setIsLoading(true);
    setErrorMessage('');

    getBranchStudents(branchId, selectedYearId, {
      page,
      limit,
      search: debouncedSearch,
      classId: classFilter,
    })
      .then((res) => {
        if (isCurrent) {
          setStudents(res.data);
          setTotal(res.total);
          setTotalPages(res.totalPages);
          if (res.page !== page) {
            setPage(res.page);
          }
          setIsLoading(false);
        }
      })
      .catch((error) => {
        if (isCurrent) {
          setErrorMessage(
            error instanceof AppError
              ? error.message
              : 'Failed to load students roster. Please try again.',
          );
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [branchId, selectedYearId, page, limit, debouncedSearch, classFilter]);

  function handleClassFilterChange(e) {
    setClassFilter(e.target.value);
    setPage(1);
  }

  function handleLimitChange(e) {
    setLimit(Number(e.target.value));
    setPage(1);
  }

  async function handleConfirmDelete() {
    if (!deletingStudent) return;
    setIsDeleting(true);
    setErrorMessage('');

    try {
      await deleteStudent({
        studentId: deletingStudent.id,
        classId: deletingStudent.classId,
      });

      // Refetch current paginated query after deletion
      const res = await getBranchStudents(branchId, selectedYearId, {
        page,
        limit,
        search: debouncedSearch,
        classId: classFilter,
      });

      setStudents(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      if (res.page !== page) {
        setPage(res.page);
      }

      setSuccessMessage(`${deletingStudent.name} was removed successfully.`);
      setDeletingStudent(null);
    } catch (error) {
      setErrorMessage(
        error instanceof AppError ? error.message : 'Could not delete student record.',
      );
      setDeletingStudent(null);
    } finally {
      setIsDeleting(false);
    }
  }

  const startRecord = total === 0 ? 0 : (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);

  return (
    <>
      <section className="hero-strip students-hero-strip">
        <div className="hero-copy">
          <h2>Students</h2>
        </div>
      </section>

      <section className="students-page-container" aria-label="Student records directory">
        {errorMessage && (
          <div className="data-error-banner" role="alert">
            <AlertTriangle size={16} aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="data-success-banner" role="status">
            <span>{successMessage}</span>
            <button
              className="banner-close-btn"
              type="button"
              aria-label="Dismiss message"
              onClick={() => setSuccessMessage('')}
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Toolbar: Search & Class Filter */}
        <div className="students-toolbar">
          <div className="students-search-field">
            <Search size={15} className="students-search-icon" aria-hidden="true" />
            <input
              id={searchInputId}
              type="search"
              aria-label="Search students by name or ADM number"
              placeholder="Search students by name or ADM number…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="students-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="students-search-clear"
                onClick={() => {
                  setSearchQuery('');
                  setDebouncedSearch('');
                  setPage(1);
                }}
                aria-label="Clear search query"
              >
                <X size={13} aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="students-filter-group">
            <div className="students-select-wrap">
              <GraduationCap size={14} className="students-select-icon" aria-hidden="true" />
              <select
                id="student-class-filter"
                value={classFilter}
                onChange={handleClassFilterChange}
                className="students-filter-select"
                aria-label="Filter students by class"
              >
                <option value="all">All Classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <span className="students-count-badge">
              {total} {total === 1 ? 'student' : 'students'}
            </span>
          </div>
        </div>

        {/* Students Table / Directory */}
        {isLoading ? (
          <div className="data-loading-card" role="status">
            <p>Loading student records…</p>
          </div>
        ) : total === 0 ? (
          <div className="data-empty-card students-empty-card">
            <UserCheck size={36} aria-hidden="true" />
            <p className="data-empty-title">
              {debouncedSearch || classFilter !== 'all' ? 'No students found' : 'No students enrolled yet'}
            </p>
            <p className="data-empty">
              {debouncedSearch || classFilter !== 'all'
                ? 'No student records match your search query or class filter. Try searching for a different term.'
                : 'Students are enrolled directly within their respective classrooms in Classes.'}
            </p>
            {!isArchive && (debouncedSearch || classFilter !== 'all') ? (
              <button
                className="secondary-button secondary-button--small"
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setDebouncedSearch('');
                  setClassFilter('all');
                  setPage(1);
                }}
              >
                Clear filters
              </button>
            ) : !isArchive ? (
              <Link to="/branch/classes" className="primary-button primary-button--small">
                Go to Classes
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="students-table-card">
            <table className="students-table">
              <thead>
                <tr>
                  <th scope="col" style={{ width: '40px' }}>#</th>
                  <th scope="col">Student Name</th>
                  <th scope="col">ADM Number</th>
                  <th scope="col">Class &amp; Section</th>
                  <th scope="col">Date of Birth</th>
                  <th scope="col">Parent Contact</th>
                  <th scope="col">Residential Address</th>
                  {!isArchive && <th scope="col" style={{ width: '80px', textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
                  <tr key={student.id} className="student-row">
                    <td className="student-index-cell">
                      {String(startRecord + index).padStart(2, '0')}
                    </td>
                    <td>
                      <div className="student-name-cell">
                        <div className="student-avatar" aria-hidden="true">
                          {getStudentInitials(student.name)}
                        </div>
                        <div className="student-name-info">
                          <strong>{student.name}</strong>
                          {student.rollNo && (
                            <small className="student-roll-meta">Roll No: {student.rollNo}</small>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="student-adm-chip">{student.admissionNo}</span>
                    </td>
                    <td>
                      <span className="student-class-tag">
                        {student.className || `${student.grade} ${student.section}`}
                      </span>
                    </td>
                    <td>
                      <div className="student-meta-field">
                        <Calendar size={12} className="meta-icon" aria-hidden="true" />
                        <span>{formatDob(student.dob)}</span>
                      </div>
                    </td>
                    <td>
                      {student.parentPhone ? (
                        <a
                          href={`tel:${student.parentPhone}`}
                          className="student-contact-link"
                          title={`Call ${student.parentPhone}`}
                        >
                          <Phone size={12} aria-hidden="true" />
                          <span>{student.parentPhone}</span>
                        </a>
                      ) : (
                        <span className="student-empty-meta">—</span>
                      )}
                    </td>
                    <td>
                      {student.address ? (
                        <div className="student-meta-field student-address-field" title={student.address}>
                          <MapPin size={12} className="meta-icon" aria-hidden="true" />
                          <span>{student.address}</span>
                        </div>
                      ) : (
                        <span className="student-empty-meta">—</span>
                      )}
                    </td>
                    {!isArchive && (
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="student-delete-btn"
                          type="button"
                          title={`Delete ${student.name}`}
                          aria-label={`Delete ${student.name}`}
                          onClick={() => setDeletingStudent(student)}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="students-table-footer">
              <span className="students-footer-note">
                Showing {startRecord}–{endRecord} of {total} {total === 1 ? 'student' : 'students'}
                {classFilter !== 'all' ? ` in ${classes.find((c) => c.id === classFilter)?.name || 'class'}` : ''}
                {debouncedSearch ? ` matching “${debouncedSearch}”` : ''}.
              </span>

              <div className="students-pagination-controls">
                <div className="students-page-size-picker">
                  <span>Per page:</span>
                  <select
                    value={limit}
                    onChange={handleLimitChange}
                    className="students-page-size-select"
                    aria-label="Select rows per page"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                <div className="students-page-nav">
                  <button
                    type="button"
                    className="pagination-arrow-btn"
                    disabled={page <= 1}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={16} aria-hidden="true" />
                  </button>

                  <span className="pagination-page-indicator">
                    Page <strong>{page}</strong> of <strong>{totalPages}</strong>
                  </span>

                  <button
                    type="button"
                    className="pagination-arrow-btn"
                    disabled={page >= totalPages}
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    aria-label="Next page"
                  >
                    <ChevronRight size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>


      {/* Delete Student Confirmation Modal */}
      {!isArchive && deletingStudent && (
        <div
          className="students-dialog-backdrop student-delete-confirm-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting) {
              setDeletingStudent(null);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && !isDeleting) {
              setDeletingStudent(null);
            }
          }}
        >
          <section
            className="students-dialog student-delete-confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-student-title"
          >
            <div className="students-dialog-header">
              <h2 id="delete-student-title">Delete student</h2>
              <button
                className="icon-button"
                type="button"
                aria-label="Close dialog"
                disabled={isDeleting}
                onClick={() => setDeletingStudent(null)}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="student-delete-confirm-body">
              <p>
                Are you sure you want to delete student <strong>{deletingStudent.name}</strong> (
                {deletingStudent.admissionNo}) from <strong>{deletingStudent.className}</strong>?
              </p>
              <p className="student-delete-warning">
                This will remove the student from class attendance rolls and enrollment records.
              </p>
            </div>

            <div className="students-dialog-actions delete-dialog-actions">
              <button
                className="danger-button"
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
              >
                {isDeleting ? 'Deleting…' : 'Delete student'}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

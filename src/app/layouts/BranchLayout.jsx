import {
  BookOpenCheck,
  Calendar,
  Check,
  ChevronDown,
  ClipboardCheck,
  GraduationCap,
  History,
  LogOut,
  Menu,
  Plus,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  createAcademicYear,
  getBranchAcademicYears,
} from '@/features/academicYears/academicYears.api';
import { getBranch } from '@/features/dashboard/branch.api';
import { AppError } from '@/lib/errors';
import { useAcademicYearStore } from '@/stores/academicYearStore';
import { useAuthStore } from '@/stores/authStore';

const navItems = [
  { label: 'Attendance', icon: ClipboardCheck, to: '/branch/attendance' },
  { label: 'Classes', icon: GraduationCap, to: '/branch/classes' },
  { label: 'Students', icon: UserCheck, to: '/branch/students' },
  { label: 'Teachers', icon: Users, to: '/branch/teachers' },
];

/**
 * Calculates the day before a given date string for previous session end date display.
 * @param {string} startDateStr Start date in YYYY-MM-DD format.
 * @returns {string} Calculated end date string.
 */
function getPreviousSessionEndDate(startDateStr) {
  if (!startDateStr || !/^\d{4}-\d{2}-\d{2}$/.test(startDateStr)) return '';
  const d = new Date(startDateStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

/**
 * Shared shell and branch navigation for authenticated branch pages.
 * @returns {import('react').ReactElement} The branch workspace layout.
 */
export function BranchLayout() {
  const user = useAuthStore((state) => state.user);
  const clearUser = useAuthStore((state) => state.clearUser);
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [branch, setBranch] = useState(null);
  const [branchError, setBranchError] = useState('');

  // Academic year state & store
  const selectedYearId = useAcademicYearStore((state) => state.selectedYearId);
  const activeYearId = useAcademicYearStore((state) => state.activeYearId);
  const setSelectedYearId = useAcademicYearStore((state) => state.setSelectedYearId);
  const setActiveYearId = useAcademicYearStore((state) => state.setActiveYearId);

  const [academicYears, setAcademicYears] = useState([]);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [showCreateYearModal, setShowCreateYearModal] = useState(false);
  const [newYearName, setNewYearName] = useState('');
  const [newYearStartDate, setNewYearStartDate] = useState('');
  const [carryOverClasses, setCarryOverClasses] = useState(true);
  const [isSavingYear, setIsSavingYear] = useState(false);
  const [yearFormError, setYearFormError] = useState('');

  const yearDropdownRef = useRef(null);

  // Fetch branch details
  useEffect(() => {
    let isCurrent = true;
    getBranch(user?.branchId)
      .then((result) => {
        if (isCurrent) {
          setBranch(result);
          setBranchError('');
        }
      })
      .catch((error) => {
        if (isCurrent) {
          setBranchError(
            error instanceof AppError
              ? error.message
              : 'Branch details could not be loaded. Please try again.',
          );
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [user?.branchId]);

  // Fetch academic years for branch
  useEffect(() => {
    if (!user?.branchId) return;
    let isCurrent = true;

    getBranchAcademicYears(user.branchId)
      .then((years) => {
        if (!isCurrent) return;
        setAcademicYears(years);

        const activeYear = years.find((y) => y.isActive);
        if (activeYear) {
          setActiveYearId(activeYear.id);
          if (!selectedYearId || !years.some((y) => y.id === selectedYearId)) {
            setSelectedYearId(activeYear.id);
          }
        }
      })
      .catch(() => {
        // Fallback silently if offline or test
      });

    return () => {
      isCurrent = false;
    };
  }, [user?.branchId, setActiveYearId, setSelectedYearId, selectedYearId]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target)) {
        setIsYearDropdownOpen(false);
      }
    }

    if (isYearDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isYearDropdownOpen]);

  const selectedYear = academicYears.find((y) => y.id === selectedYearId);
  const activeYear = academicYears.find((y) => y.isActive);
  const isArchiveView = Boolean(selectedYearId && activeYearId && selectedYearId !== activeYearId);

  function handleSignOut() {
    clearUser();
    navigate('/login', { replace: true });
  }

  async function handleCreateYear(event) {
    event.preventDefault();
    setIsSavingYear(true);
    setYearFormError('');

    try {
      const created = await createAcademicYear({
        branchId: user?.branchId,
        name: newYearName,
        startDate: newYearStartDate,
        carryOverClasses,
      });

      const updatedYears = await getBranchAcademicYears(user?.branchId);
      setAcademicYears(updatedYears);
      setActiveYearId(created.id);
      setSelectedYearId(created.id);
      setShowCreateYearModal(false);
      setNewYearName('');
      setNewYearStartDate('');
    } catch (error) {
      setYearFormError(
        error instanceof AppError || error instanceof Error
          ? error.message
          : 'Could not create academic year. Please try again.',
      );
    } finally {
      setIsSavingYear(false);
    }
  }

  return (
    <main className={`workspace-shell${isSidebarCollapsed ? ' workspace-shell-collapsed' : ''}`}>
      <aside className="workspace-sidebar">
        <div className="sidebar-top">
          <div className="sidebar-brand-lockup">
            <span className="sidebar-brand-mark" aria-hidden="true">
              <BookOpenCheck size={19} strokeWidth={2.1} />
            </span>
            <span className="sidebar-brand-name">RuralAttend</span>
          </div>
          <div
            className="sidebar-card"
            role="group"
            aria-label={branch?.name ?? 'Assigned branch'}
          >
            <span className="sidebar-region-mark" aria-hidden="true">
              <GraduationCap size={22} strokeWidth={2} />
            </span>
            <span className="sidebar-region-copy">
              <strong>{branch?.name ?? 'Assigned branch'}</strong>
              <small>{branch?.description ?? 'Loading branch details'}</small>
            </span>
            <ChevronDown className="sidebar-region-chevron" size={16} aria-hidden="true" />
          </div>
          {branchError && <p className="sidebar-error" role="alert">{branchError}</p>}
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {navItems.map(({ label, icon: Icon, to }) =>
            to ? (
              <NavLink
                key={label}
                className={({ isActive }) => `nav-item${isActive ? ' nav-item-active' : ''}`}
                to={to}
                end={label === 'Overview'}
                title={label}
              >
                <Icon size={16} aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            ) : (
              <button
                key={label}
                className="nav-item nav-item-disabled"
                type="button"
                disabled
                title={`${label} coming soon`}
              >
                <Icon size={16} aria-hidden="true" />
                <span>{label}</span>
              </button>
            ),
          )}
        </nav>

        <button
          className="sidebar-signout"
          onClick={handleSignOut}
          type="button"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut size={20} aria-hidden="true" />
          <span>Sign out</span>
        </button>
      </aside>

      <section className="workspace-panel">
        <header className="workspace-header">
          <div className="workspace-header-start">
            <button
              className="icon-button sidebar-toggle"
              type="button"
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={!isSidebarCollapsed}
              onClick={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
            >
              <Menu size={20} aria-hidden="true" />
            </button>
            <div>
              <p className="eyebrow-text">Good morning</p>
              <h1>{user?.name ?? 'Branch Admin'}</h1>
            </div>
          </div>

          <div className="header-actions">
            {/* Academic Year Selector Pill & Dropdown */}
            {academicYears.length > 0 && (
              <div className="academic-year-selector-wrap" ref={yearDropdownRef}>
                <button
                  className={`academic-year-pill${isArchiveView ? ' academic-year-pill--archive' : ''}`}
                  type="button"
                  aria-expanded={isYearDropdownOpen}
                  aria-haspopup="menu"
                  onClick={() => setIsYearDropdownOpen((open) => !open)}
                  title="Select academic year or start a new session"
                >
                  {isArchiveView ? (
                    <History size={14} className="ay-pill-icon" aria-hidden="true" />
                  ) : (
                    <Calendar size={14} className="ay-pill-icon" aria-hidden="true" />
                  )}
                  <span className="ay-pill-name">{selectedYear?.name ?? 'Select Session'}</span>
                  <span
                    className={`ay-status-badge ${
                      isArchiveView ? 'ay-badge--archive' : 'ay-badge--active'
                    }`}
                  >
                    {isArchiveView ? 'Archived' : 'Active'}
                  </span>
                  <ChevronDown
                    size={13}
                    className={`ay-chevron${isYearDropdownOpen ? ' ay-chevron--open' : ''}`}
                    aria-hidden="true"
                  />
                </button>

                {isYearDropdownOpen && (
                  <div className="academic-year-dropdown-menu" role="menu">
                    <div className="ay-menu-header">Academic Session</div>
                    <div className="ay-menu-list">
                      {academicYears.map((year) => {
                        const isSelected = year.id === selectedYearId;
                        return (
                          <button
                            key={year.id}
                            type="button"
                            className={`ay-menu-item${isSelected ? ' ay-menu-item--selected' : ''}`}
                            onClick={() => {
                              setSelectedYearId(year.id);
                              setIsYearDropdownOpen(false);
                            }}
                          >
                            <div className="ay-item-text">
                              <div className="ay-item-title-row">
                                <strong>{year.name}</strong>
                                {year.isActive ? (
                                  <span className="ay-badge--active-sm">Active</span>
                                ) : (
                                  <span className="ay-badge--archive-sm">Archived</span>
                                )}
                              </div>
                              <small>
                                {year.isActive
                                  ? `Started ${year.startDate} · Ongoing`
                                  : `${year.startDate} to ${year.endDate ?? 'closed'}`}
                              </small>
                            </div>
                            {isSelected && (
                              <Check size={14} className="ay-item-check" aria-hidden="true" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <div className="ay-menu-divider" />
                    <button
                      type="button"
                      className="ay-menu-create-btn"
                      onClick={() => {
                        setIsYearDropdownOpen(false);
                        setYearFormError('');
                        if (activeYear) {
                          const parts = activeYear.name.split(/[–-]/);
                          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                            setNewYearName(`${Number(parts[0]) + 1}–${Number(parts[1]) + 1}`);
                          } else {
                            setNewYearName('');
                          }
                        }
                        setShowCreateYearModal(true);
                      }}
                    >
                      <Plus size={14} aria-hidden="true" />
                      <span>Start new academic year</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Read-only Archive Mode Banner */}
        {isArchiveView && selectedYear && (
          <aside className="archive-session-banner" role="status">
            <History size={16} className="archive-banner-icon" aria-hidden="true" />
            <div className="archive-banner-copy">
              <strong>Viewing Archived Academic Year: {selectedYear.name}</strong>
              <span>
                Session period: {selectedYear.startDate} to {selectedYear.endDate}. Records in this
                session are in read-only mode.
              </span>
            </div>
            <button
              type="button"
              className="archive-banner-action"
              onClick={() => {
                if (activeYear) setSelectedYearId(activeYear.id);
              }}
            >
              Return to active session ({activeYear?.name})
            </button>
          </aside>
        )}

        <Outlet />
      </section>

      {/* Start New Academic Year Modal */}
      {showCreateYearModal && (
        <div
          className="students-dialog-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget && !isSavingYear) {
              setShowCreateYearModal(false);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && !isSavingYear) {
              setShowCreateYearModal(false);
            }
          }}
        >
          <section
            className="students-dialog create-year-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-year-title"
          >
            <div className="students-dialog-header">
              <div>
                <p className="eyebrow-text">Session Rollover</p>
                <h2 id="create-year-title">Start new academic year</h2>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="Close dialog"
                disabled={isSavingYear}
                onClick={() => setShowCreateYearModal(false)}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {yearFormError && <p className="form-alert" role="alert">{yearFormError}</p>}

            <form className="student-form" onSubmit={handleCreateYear}>
              <label className="student-form-field">
                <span>Academic year name</span>
                <input
                  autoFocus
                  required
                  placeholder="e.g. 2025–2026"
                  value={newYearName}
                  onChange={(event) => setNewYearName(event.target.value)}
                />
              </label>

              <label className="student-form-field">
                <span>Start date</span>
                <input
                  required
                  type="date"
                  value={newYearStartDate}
                  onChange={(event) => setNewYearStartDate(event.target.value)}
                />
              </label>

              {activeYear && newYearStartDate && (
                <div className="ay-transition-hint">
                  <CalendarDays size={15} aria-hidden="true" />
                  <p>
                    Previous session <strong>{activeYear.name}</strong> will automatically close
                    with end date <strong>{getPreviousSessionEndDate(newYearStartDate)}</strong>.
                  </p>
                </div>
              )}

              <label className="ay-checkbox-label">
                <input
                  type="checkbox"
                  checked={carryOverClasses}
                  onChange={(event) => setCarryOverClasses(event.target.checked)}
                />
                <span>Carry over existing class structure into the new academic year</span>
              </label>

              <div className="students-dialog-actions">
                <button
                  className="primary-button primary-button--small"
                  type="submit"
                  disabled={isSavingYear}
                >
                  {isSavingYear ? 'Starting session…' : 'Start academic year'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

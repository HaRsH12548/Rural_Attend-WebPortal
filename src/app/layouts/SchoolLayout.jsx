import {
  AlertTriangle,
  BookOpenCheck,
  Building2,
  Calendar,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardCheck,
  History,
  LogOut,
  Menu,
  Plus,
  Settings,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  createSchoolAcademicYear,
  getSchoolAcademicYears,
  getSchoolOverview,
} from '@/features/school/school.api';
import { AppError } from '@/lib/errors';
import { useAcademicYearStore } from '@/stores/academicYearStore';
import { useAuthStore } from '@/stores/authStore';

const navItems = [
  { label: 'Branches', icon: Building2, to: '/school/branches' },
  { label: 'Branch Admins', icon: ShieldCheck, to: '/school/admins' },
  { label: 'Org Attendance', icon: ClipboardCheck, to: '/school/attendance' },
  { label: 'School Settings', icon: Settings, to: '/school/settings' },
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
 * Organization-wide shell and navigation layout for authenticated School Administrators.
 * Oversees multiple branches, provisioning, and aggregated attendance.
 * @returns {import('react').ReactElement}
 */
export function SchoolLayout() {
  const user = useAuthStore((state) => state.user);
  const clearUser = useAuthStore((state) => state.clearUser);
  const navigate = useNavigate();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [overviewData, setOverviewData] = useState(null);

  // Academic year store and state
  const selectedYearId = useAcademicYearStore((state) => state.selectedYearId);
  const activeYearId = useAcademicYearStore((state) => state.activeYearId);
  const setSelectedYearId = useAcademicYearStore((state) => state.setSelectedYearId);
  const setActiveYearId = useAcademicYearStore((state) => state.setActiveYearId);

  const [academicYears, setAcademicYears] = useState([]);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [showCreateYearModal, setShowCreateYearModal] = useState(false);
  const [newYearName, setNewYearName] = useState('');
  const [newYearStartDate, setNewYearStartDate] = useState('');
  const [isSavingYear, setIsSavingYear] = useState(false);
  const [yearFormError, setYearFormError] = useState('');

  const yearDropdownRef = useRef(null);

  // Load school overview data
  useEffect(() => {
    let isCurrent = true;
    getSchoolOverview()
      .then((data) => {
        if (isCurrent) setOverviewData(data);
      })
      .catch(() => {
        // Fallback silently
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  // Load organization-wide academic years
  useEffect(() => {
    let isCurrent = true;
    getSchoolAcademicYears()
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
        // Fallback silently
      });

    return () => {
      isCurrent = false;
    };
  }, [setActiveYearId, setSelectedYearId, selectedYearId]);

  // Close dropdown on outside click
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
      const created = await createSchoolAcademicYear({
        name: newYearName,
        startDate: newYearStartDate,
      });

      const updatedYears = await getSchoolAcademicYears();
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

  const organization = overviewData?.organization;
  const pendingClassesAlert = overviewData?.alerts?.find((a) => a.id.startsWith('alert-sub-'));

  return (
    <main className={`workspace-shell${isSidebarCollapsed ? ' workspace-shell-collapsed' : ''}`}>
      {/* Sidebar Navigation */}
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
            aria-label="Organization Headquarters"
            style={{ borderLeft: '3px solid #78c5a4' }}
          >
            <span className="sidebar-region-mark" aria-hidden="true">
              <Building2 size={22} strokeWidth={2} />
            </span>
            <span className="sidebar-region-copy">
              <strong>{organization?.name || 'School Organization'}</strong>
              <small>Central Administration · {overviewData?.kpis?.totalBranches || 4} Branches</small>
            </span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="School Admin navigation">
          {navItems.map(({ label, icon: Icon, to }) => (
            <NavLink
              key={label}
              className={({ isActive }) => `nav-item${isActive ? ' nav-item-active' : ''}`}
              to={to}
              end={to === '/school/branches'}
              title={label}
            >
              <Icon size={16} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <button
          className="sidebar-signout"
          onClick={handleSignOut}
          type="button"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut size={18} aria-hidden="true" />
          <span>Sign out</span>
        </button>
      </aside>

      {/* Main Panel */}
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
              <p className="eyebrow-text">Executive Workspace</p>
              <h1>{user?.name ?? 'School Administrator'}</h1>
            </div>
          </div>

          <div className="header-actions">
            {/* Academic Year Selector Pill & Dropdown */}
            {academicYears.length > 0 ? (
              <div className="academic-year-selector-wrap" ref={yearDropdownRef}>
                <button
                  className={`academic-year-pill${isArchiveView ? ' academic-year-pill--archive' : ''}`}
                  type="button"
                  aria-expanded={isYearDropdownOpen}
                  aria-haspopup="menu"
                  onClick={() => setIsYearDropdownOpen((open) => !open)}
                  title="Select academic year or start a new cycle"
                >
                  {isArchiveView ? (
                    <History size={14} className="ay-pill-icon" aria-hidden="true" />
                  ) : (
                    <Calendar size={14} className="ay-pill-icon" aria-hidden="true" />
                  )}
                  <span className="ay-pill-name">
                    {selectedYear?.name ?? organization?.academicCycle ?? '2024–2025'}
                  </span>
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
                        const isSelected =
                          year.id === selectedYearId || (!selectedYearId && year.isActive);
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
            ) : (
              <div className="academic-year-selector-wrap">
                <button
                  className="academic-year-pill"
                  type="button"
                  title="Academic Cycle"
                >
                  <Calendar size={14} className="ay-pill-icon" aria-hidden="true" />
                  <span className="ay-pill-name">{organization?.academicCycle || '2024–2025'}</span>
                  <span className="ay-status-badge ay-badge--active">Active</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Read-only Archive Mode Banner */}
        {isArchiveView && selectedYear && (
          <aside className="archive-session-banner" role="status">
            <History size={16} className="archive-banner-icon" aria-hidden="true" />
            <div>
              <strong>Historical Archive View ({selectedYear.name})</strong>
              <p>
                Viewing organization data for a previous academic cycle. Live attendance
                monitoring reflects the active term.
              </p>
            </div>
            <button
              type="button"
              className="secondary-button secondary-button--small"
              onClick={() => {
                if (activeYear) setSelectedYearId(activeYear.id);
              }}
            >
              Return to active session
            </button>
          </aside>
        )}

        {/* Global Overdue Submissions Warning Banner */}
        {pendingClassesAlert && (
          <aside className="school-alert-banner" role="status">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={18} color="#b45309" aria-hidden="true" />
              <div>
                <strong>Attendance Follow-Up Required</strong>
                <p>{pendingClassesAlert.message}</p>
              </div>
            </div>
            <NavLink
              to="/school/attendance"
              className="secondary-button secondary-button--small"
              style={{ whiteSpace: 'nowrap' }}
            >
              Review Attendance Status
            </NavLink>
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
                    Previous cycle <strong>{activeYear.name}</strong> will automatically close
                    with end date <strong>{getPreviousSessionEndDate(newYearStartDate)}</strong>.
                  </p>
                </div>
              )}

              <div className="students-dialog-actions">
                <button
                  className="primary-button primary-button--small"
                  type="submit"
                  disabled={isSavingYear}
                >
                  {isSavingYear ? 'Starting cycle…' : 'Start academic year'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
export default SchoolLayout;


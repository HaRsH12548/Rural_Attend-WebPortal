import { useEffect, useState } from 'react';
import { getBranchDashboard } from '@/features/dashboard/branch.api';
import { AppError } from '@/lib/errors';
import { useAuthStore } from '@/stores/authStore';

/**
 * Branch attendance overview.
 * @returns {import('react').ReactElement} The branch dashboard.
 */
export default function BranchDashboardPage() {
  const branchId = useAuthStore((state) => state.user?.branchId);
  const [dashboard, setDashboard] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isCurrent = true;
    getBranchDashboard(branchId)
      .then((result) => {
        if (isCurrent) {
          setDashboard(result);
          setErrorMessage('');
        }
      })
      .catch((error) => {
        if (isCurrent) {
          setErrorMessage(
            error instanceof AppError
              ? error.message
              : 'Dashboard data could not be loaded. Please try again.',
          );
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [branchId]);

  return (
    <>
      <section className="hero-strip">
        <div className="hero-copy">
          <h2>Attendance overview</h2>
        </div>
      </section>

      {errorMessage ? (
        <p className="data-error" role="alert">{errorMessage}</p>
      ) : !dashboard ? (
        <p className="data-loading" role="status">Loading dashboard data…</p>
      ) : (
        <>
          <section className="stats-grid" aria-label="Attendance summary">
            {dashboard.stats.map((stat) => (
              <article key={stat.id} className="stat-card">
                <div className="stat-header">
                  <span>{stat.label}</span>
                  <span className={`stat-trend ${stat.tone}`}>{stat.delta}</span>
                </div>
                <strong>{stat.value}</strong>
              </article>
            ))}
          </section>

          <section className="content-grid">
            <article className="panel-card attendance-card">
              <div className="panel-header">
                <h3>Class Attendance</h3>
              </div>

              <div className="attendance-list" role="list">
                {dashboard.classes.map((classroom) => (
                  <div key={classroom.id} className="attendance-row" role="listitem">
                    <strong className="class-name">{classroom.name}</strong>
                    <span className="row-count">
                      {classroom.presentToday} / {classroom.studentCount}
                    </span>
                    <span className="row-percent" aria-label={`${Math.round((classroom.presentToday / classroom.studentCount) * 100)}% present today`}>
                      {Math.round((classroom.presentToday / classroom.studentCount) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel-card priority-card">
              <div className="panel-header">
                <h3>Action items</h3>
              </div>

              <div className="priority-list">
                {dashboard.actionItems.map((item) => (
                  <div key={item.id} className="priority-item">
                    <div className="priority-copy">
                      <strong>{item.title}</strong>
                      <small>{item.meta}</small>
                    </div>
                    <span className={`priority-badge ${item.tone}`}>{item.badge}</span>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </>
      )}
    </>
  );
}

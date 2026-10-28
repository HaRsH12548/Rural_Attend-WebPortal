import {
  GraduationCap,
  Mail,
  Pencil,
  Phone,
  User,
  X,
} from 'lucide-react';
import { getTeacherInitials } from './teachers.api';

/**
 * Teacher Details Overlay modal displaying full profile and section allotments.
 */
export default function TeacherDetailsModal({
  isOpen,
  onClose,
  teacher,
  onEdit,
  onResetPassword,
}) {
  if (!isOpen || !teacher) return null;

  const allotted = teacher.allottedClasses || [];

  return (
    <div
      className="students-dialog-backdrop teacher-details-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <section
        className="students-dialog teacher-details-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="teacher-details-title"
      >
        {/* Modal Header */}
        <div className="students-dialog-header teacher-details-header">
          <div className="teacher-details-hero">
            <div className="teacher-avatar-wrap">
              <div className="teacher-avatar teacher-avatar--large">
                <span>{getTeacherInitials(teacher.name)}</span>
              </div>
              <span
                className={`teacher-status-dot ${
                  teacher.status === 'active'
                    ? 'teacher-status-dot--active'
                    : 'teacher-status-dot--inactive'
                }`}
                title={teacher.status === 'active' ? 'Active Account' : 'Inactive Account'}
              />
            </div>

            <div className="teacher-details-title-group">
              <div className="teacher-details-title-row">
                <h2 id="teacher-details-title">{teacher.name}</h2>
                <span className="teacher-staff-badge">{teacher.staffId}</span>
                <span
                  className={`status-pill ${
                    teacher.status === 'active' ? 'status-pill--present' : 'status-pill--absent'
                  }`}
                >
                  {teacher.status === 'active' ? 'Active Account' : 'Inactive Account'}
                </span>
              </div>
              <p className="teacher-designation-label">
                {teacher.designation || 'Class Teacher'} · RuralAttend Faculty
              </p>
            </div>
          </div>

          <button
            id="close-teacher-details-btn"
            className="icon-button"
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="teacher-details-body">
          

          {/* Allotted Classroom Sections */}
          <div className="teacher-details-section">
            <div className="section-title-row">
              <GraduationCap size={15} className="section-title-icon" aria-hidden="true" />
              <h3>Allotted Classroom Sections ({allotted.length})</h3>
            </div>

            {allotted.length === 0 ? (
              <div className="no-allotments-notice">
                <p>No classroom sections have been allotted to this teacher yet.</p>
                <button
                  type="button"
                  className="quick-text-action"
                  onClick={() => onEdit(teacher)}
                >
                  Allot sections now
                </button>
              </div>
            ) : (
              <div className="details-classes-grid">
                {allotted.map((cls) => (
                  <div key={cls.id} className="details-class-pill-card">
                    <div className="details-class-dot" aria-hidden="true" />
                    <div>
                      <strong>{cls.name}</strong>
                      <span className="details-class-meta">
                        {cls.grade} · Section {cls.section} · {cls.studentCount} students enrolled
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Staff Information */}
          <div className="teacher-details-section">
            <div className="section-title-row">
              <User size={15} className="section-title-icon" aria-hidden="true" />
              <h3>Staff Profile Information</h3>
            </div>

            <div className="details-info-grid">
              <div className="info-item">
                <span className="info-label">Full Name</span>
                <span className="info-value">{teacher.name}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Staff ID</span>
                <span className="info-value">{teacher.staffId}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Designation</span>
                <span className="info-value">{teacher.designation || 'Class Teacher'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Email Address</span>
                <span className="info-value">
                  <Mail size={12} aria-hidden="true" /> {teacher.email}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Phone Number</span>
                <span className="info-value">
                  <Phone size={12} aria-hidden="true" /> {teacher.phone || 'Not provided'}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Date Added</span>
                <span className="info-value">{teacher.createdAt || 'Active Session'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="students-dialog-actions teacher-details-actions">
          <button
            type="button"
            className="primary-button"
            onClick={() => onEdit(teacher)}
          >
            <Pencil size={13} aria-hidden="true" />
            <span>Edit Profile &amp; Allotments</span>
          </button>
        </div>
      </section>
    </div>
  );
}

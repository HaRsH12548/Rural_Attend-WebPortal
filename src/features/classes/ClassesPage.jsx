import { useEffect, useState } from 'react';
import {
  ChevronRight,
  GraduationCap,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  User,
  UserPlus,
  X,
} from 'lucide-react';
import {
  createClass,
  createStudent,
  deleteStudent,
  getBranchClasses,
  getClassStudents,
  updateClass,
} from '@/features/classes/classes.api';
import { AppError } from '@/lib/errors';
import { useAcademicYearStore } from '@/stores/academicYearStore';
import { useAuthStore } from '@/stores/authStore';

const PRESET_GRADES = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
];

/**
 * Extracts a concise class label such as "1A" or "5C".
 * @param {{ grade?: string, section?: string, name?: string }} classroom Class object.
 * @returns {string} Short class name.
 */
function getShortClassName(classroom) {
  if (!classroom) return '';
  const gradeNumber = classroom.grade ? classroom.grade.replace(/^Class\s*/i, '').trim() : '';
  const section = classroom.section ? classroom.section.trim().toUpperCase() : '';
  if (gradeNumber && section) {
    return `${gradeNumber}${section}`;
  }
  return (classroom.name || '').replace(/^Class\s*/i, '').trim() || classroom.name;
}

/**
 * Lists branch classes and student details with class creation, editing, and enrollment actions.
 * @returns {import('react').ReactElement} The branch classes page.
 */
export default function ClassesPage() {
  const branchId = useAuthStore((state) => state.user?.branchId);
  const selectedYearId = useAcademicYearStore((state) => state.selectedYearId);
  const activeYearId = useAcademicYearStore((state) => state.activeYearId);
  const isArchive = Boolean(selectedYearId && activeYearId && selectedYearId !== activeYearId);

  const [classes, setClasses] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeDialog, setActiveDialog] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Student registration state (contextual to selected class)
  const [studentName, setStudentName] = useState('');
  const [studentDob, setStudentDob] = useState('');
  const [studentParentPhone, setStudentParentPhone] = useState('');
  const [studentAddress, setStudentAddress] = useState('');

  // Create class state
  const [newClassGrade, setNewClassGrade] = useState('');
  const [newClassSection, setNewClassSection] = useState('');
  const [newClassName, setNewClassName] = useState('');

  // Edit class state
  const [editClassGrade, setEditClassGrade] = useState('');
  const [editClassSection, setEditClassSection] = useState('');
  const [editClassName, setEditClassName] = useState('');

  // Class details state
  const [selectedClass, setSelectedClass] = useState(null);
  const [classStudents, setClassStudents] = useState([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [studentsError, setStudentsError] = useState('');
  const [studentsSuccess, setStudentsSuccess] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isDeletingStudent, setIsDeletingStudent] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    getBranchClasses(branchId, selectedYearId)
      .then((result) => {
        if (isCurrent) {
          setClasses(result);
          setErrorMessage('');
        }
      })
      .catch((error) => {
        if (isCurrent) {
          setErrorMessage(
            error instanceof AppError
              ? error.message
              : 'Class data could not be loaded. Please try again.',
          );
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [branchId, selectedYearId]);

  function closeDialog() {
    setActiveDialog(null);
    setFormError('');
    setStudentName('');
    setStudentDob('');
    setStudentParentPhone('');
    setStudentAddress('');
    setNewClassGrade('');
    setNewClassSection('');
    setNewClassName('');
    setEditClassGrade('');
    setEditClassSection('');
    setEditClassName('');
    setStudentSearch('');
    setStudentToDelete(null);
    setIsDeletingStudent(false);
    setStudentsSuccess('');
  }

  function handleCloseAddStudent() {
    setFormError('');
    setStudentName('');
    setStudentDob('');
    setStudentParentPhone('');
    setStudentAddress('');
    if (selectedClass) {
      setActiveDialog('classDetails');
    } else {
      closeDialog();
    }
  }

  function handleCloseEditClass() {
    setFormError('');
    if (selectedClass) {
      setActiveDialog('classDetails');
    } else {
      closeDialog();
    }
  }

  function handleDialogKeyDown(event) {
    if (event.key === 'Escape' && !isSaving) {
      closeDialog();
      return;
    }
    if (event.key !== 'Tab') {
      return;
    }

    const focusable = [...event.currentTarget.querySelectorAll(
      'button:not(:disabled), input:not(:disabled), select:not(:disabled)',
    )];
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  async function refreshClasses() {
    const updatedClasses = await getBranchClasses(branchId, selectedYearId);
    setClasses(updatedClasses);
    return updatedClasses;
  }

  async function openClassDetails(classroom) {
    setSelectedClass(classroom);
    setActiveDialog('classDetails');
    setFormError('');
    setStudentSearch('');
    setIsLoadingStudents(true);
    setStudentsError('');
    setStudentsSuccess('');
    setStudentToDelete(null);
    try {
      const students = await getClassStudents(classroom.id);
      setClassStudents(students);
    } catch (error) {
      setStudentsError(
        error instanceof AppError
          ? error.message
          : 'Failed to load students for this class.',
      );
    } finally {
      setIsLoadingStudents(false);
    }
  }

  function openAddStudentForClass(classroom) {
    if (isArchive) return;
    setSelectedClass(classroom);
    setStudentName('');
    setStudentDob('');
    setStudentParentPhone('');
    setStudentAddress('');
    setActiveDialog('addStudent');
    setFormError('');
  }

  async function handleAddStudent(event) {
    event.preventDefault();
    if (!selectedClass) return;

    setIsSaving(true);
    setFormError('');
    try {
      const created = await createStudent({
        branchId,
        name: studentName.trim(),
        grade: selectedClass.grade,
        section: selectedClass.section,
        dob: studentDob.trim(),
        parentPhone: studentParentPhone.trim(),
        address: studentAddress.trim(),
      });

      const updatedClasses = await refreshClasses();
      const freshClass = updatedClasses.find((c) => c.id === selectedClass.id) || selectedClass;
      setSelectedClass(freshClass);
      const updatedRoster = await getClassStudents(freshClass.id);
      setClassStudents(updatedRoster);

      setStudentsSuccess(`${created.name} (${created.admissionNo}) added to ${freshClass.name} successfully.`);
      setActiveDialog('classDetails');
      setStudentName('');
      setStudentDob('');
      setStudentParentPhone('');
      setStudentAddress('');
    } catch (error) {
      setFormError(
        error instanceof AppError ? error.message : 'The student could not be added. Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  function openEditClass(classroom) {
    if (isArchive) return;
    setSelectedClass(classroom);
    setEditClassGrade(classroom.grade);
    setEditClassSection(classroom.section);
    setEditClassName(classroom.name);
    setActiveDialog('editClass');
    setFormError('');
  }

  async function handleConfirmDeleteStudent() {
    if (!studentToDelete || !selectedClass) return;
    setIsDeletingStudent(true);
    setStudentsError('');
    setStudentsSuccess('');
    try {
      await deleteStudent({ studentId: studentToDelete.id, classId: selectedClass.id });
      setClassStudents((prev) => prev.filter((s) => s.id !== studentToDelete.id));
      await refreshClasses();
      setStudentsSuccess(`${studentToDelete.name} was deleted successfully.`);
      setStudentToDelete(null);
    } catch (error) {
      setStudentsError(
        error instanceof AppError || error instanceof Error
          ? error.message
          : 'The student could not be deleted. Please try again.',
      );
      setStudentToDelete(null);
    } finally {
      setIsDeletingStudent(false);
    }
  }

  async function handleCreateClass(event) {
    event.preventDefault();
    setIsSaving(true);
    setFormError('');
    setSuccessMessage('');
    try {
      const created = await createClass({
        branchId,
        grade: newClassGrade,
        section: newClassSection,
        name: newClassName || `${newClassGrade} ${newClassSection.toUpperCase()}`,
        academicYearId: selectedYearId,
      });
      await refreshClasses();
      closeDialog();
      setSuccessMessage(`${created.name} created successfully.`);
    } catch (error) {
      setFormError(
        error instanceof AppError
          ? error.message
          : 'Could not create class. Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdateClass(event) {
    event.preventDefault();
    setIsSaving(true);
    setFormError('');
    try {
      const updated = await updateClass({
        classId: selectedClass.id,
        grade: editClassGrade,
        section: editClassSection,
        name: editClassName || `${editClassGrade} ${editClassSection.toUpperCase()}`,
      });
      const updatedClasses = await refreshClasses();
      const freshClass = updatedClasses.find((c) => c.id === updated.id) || updated;
      setSelectedClass(freshClass);
      setActiveDialog('classDetails');
      setSuccessMessage(`${freshClass.name} updated successfully.`);
    } catch (error) {
      setFormError(
        error instanceof AppError
          ? error.message
          : 'Could not update class. Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  const filteredStudents = (classStudents ?? []).filter((student) => {
    if (!studentSearch.trim()) return true;
    const q = studentSearch.toLowerCase().trim();
    return (
      student.name?.toLowerCase().includes(q) ||
      student.rollNo?.toLowerCase().includes(q) ||
      student.admissionNo?.toLowerCase().includes(q) ||
      student.parentPhone?.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <section className="hero-strip classes-hero-strip students-hero-strip">
        <div className="hero-copy">
          <h2>Classes</h2>
          <p className="hero-subtext">
            {isArchive
              ? 'Viewing archived class rosters and enrollment records for this completed session.'
              : 'Click any class tile to inspect enrolled students.'}
          </p>
        </div>
        {!isArchive && (
          <div className="students-actions classes-actions">
            <button
              className="primary-button primary-button--small"
              type="button"
              disabled={!classes || Boolean(errorMessage)}
              title="Create class"
              onClick={() => {
                setNewClassGrade(PRESET_GRADES[0]);
                setNewClassSection('');
                setNewClassName('');
                setActiveDialog('createClass');
                setFormError('');
                setSuccessMessage('');
              }}
            >
              <Plus size={15} aria-hidden="true" />
              <span>Create class</span>
            </button>
          </div>
        )}
      </section>

      <section className="classes-page students-page" aria-label="Classes and student counts">
        {errorMessage && <p className="data-error" role="alert">{errorMessage}</p>}
        {successMessage && <p className="data-success" role="status">{successMessage}</p>}
        {!errorMessage && !classes && <p className="data-loading" role="status">Loading classes…</p>}
        {!errorMessage && classes?.length === 0 && (
          <div className="data-empty-card">
            <GraduationCap size={36} aria-hidden="true" />
            <p className="data-empty-title">
              {isArchive ? 'No classes found' : 'No classes created yet'}
            </p>
            <p className="data-empty">
              {isArchive
                ? 'No classes were recorded for this completed academic year.'
                : 'Create your first class to begin managing student enrollment.'}
            </p>
            {!isArchive && (
              <button
                className="primary-button primary-button--small"
                type="button"
                onClick={() => {
                  setNewClassGrade(PRESET_GRADES[0]);
                  setNewClassSection('');
                  setNewClassName('');
                  setActiveDialog('createClass');
                }}
              >
                <Plus size={15} aria-hidden="true" />
                Create class
              </button>
            )}
          </div>
        )}
        {classes && classes.length > 0 && (
          <div className="class-grid">
            {classes.map((classroom) => (
              <article
                key={classroom.id}
                className="class-card interactive-class-card"
                onClick={() => openClassDetails(classroom)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openClassDetails(classroom);
                  }
                }}
                title={`View students in ${classroom.name}`}
              >
                <div className="class-card-heading-row">
                  <h3>{classroom.name}</h3>
                  <ChevronRight size={16} className="class-card-arrow" aria-hidden="true" />
                </div>

                <div className="class-card-meta-row">
                  <p className="class-card-students-text">
                    {classroom.studentCount} students
                  </p>
                  <div
                    className={`class-card-teacher-badge ${classroom.assignedTeacher ? 'assigned' : 'unassigned'}`}
                    title={classroom.assignedTeacher ? `Assigned Teacher: ${classroom.assignedTeacher}` : 'No teacher assigned'}
                  >
                    <User size={12} className="teacher-badge-icon" aria-hidden="true" />
                    <span>{classroom.assignedTeacher || 'Unassigned'}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Class Details & Student Roster Modal */}
      {activeDialog === 'classDetails' && selectedClass && (
        <div
          className="students-dialog-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget && !isSaving) {
              closeDialog();
            }
          }}
          onKeyDown={handleDialogKeyDown}
        >
          <section
            className="students-dialog class-details-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="class-details-title"
          >
            <div className="students-dialog-header class-details-header">
              <div className="class-details-header-title-wrap">
                <h2 id="class-details-title" className="class-details-title-simple">
                  {getShortClassName(selectedClass)}
                </h2>
                <div
                  className={`class-modal-teacher-pill ${selectedClass.assignedTeacher ? 'assigned' : 'unassigned'}`}
                >
                  <User size={13} aria-hidden="true" />
                  <span>
                    Teacher: <strong>{selectedClass.assignedTeacher || 'Not assigned'}</strong>
                  </span>
                </div>
              </div>
              <div className="class-details-header-actions">
                {!isArchive && (
                  <>
                    <button
                      className="secondary-button secondary-button--small edit-class-btn"
                      type="button"
                      title="Edit class"
                      onClick={() => openEditClass(selectedClass)}
                    >
                      <Pencil size={13} aria-hidden="true" />
                      <span>Edit</span>
                    </button>
                    <button
                      className="primary-button primary-button--small"
                      type="button"
                      title={`Add student to ${getShortClassName(selectedClass)}`}
                      onClick={() => openAddStudentForClass(selectedClass)}
                    >
                      <UserPlus size={14} aria-hidden="true" />
                      <span>Add student</span>
                    </button>
                  </>
                )}
                <button
                  className="icon-button"
                  type="button"
                  aria-label="Close dialog"
                  onClick={closeDialog}
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="class-details-search-wrap">
              <Search size={14} className="class-search-icon" aria-hidden="true" />
              <input
                className="class-search-input"
                type="text"
                placeholder={`Search students in ${getShortClassName(selectedClass)}…`}
                value={studentSearch}
                onChange={(event) => setStudentSearch(event.target.value)}
              />
              {studentSearch && (
                <button
                  className="class-search-clear"
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setStudentSearch('')}
                >
                  <X size={12} aria-hidden="true" />
                </button>
              )}
            </div>

            {studentsError && <p className="form-alert" role="alert">{studentsError}</p>}
            {studentsSuccess && <p className="roster-success-alert" role="status">{studentsSuccess}</p>}

            {isLoadingStudents ? (
              <div className="roster-loading" role="status">Loading student records…</div>
            ) : filteredStudents.length === 0 ? (
              <div className="roster-empty">
                {studentSearch ? (
                  <p>No students match &ldquo;{studentSearch}&rdquo;.</p>
                ) : (
                  <>
                    <p>
                      {isArchive
                        ? `No students were enrolled in ${getShortClassName(selectedClass)} for this completed session.`
                        : `No students have been enrolled in ${getShortClassName(selectedClass)} yet.`}
                    </p>
                    {!isArchive && (
                      <button
                        className="primary-button primary-button--small"
                        type="button"
                        onClick={() => openAddStudentForClass(selectedClass)}
                      >
                        <UserPlus size={14} aria-hidden="true" />
                        Add first student
                      </button>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="student-roster-list" role="list">
                {filteredStudents.map((student, index) => (
                  <div key={student.id} className="student-roster-row" role="listitem">
                    <span className="student-roster-roll">
                      {student.rollNo ?? String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="student-roster-info">
                      <strong>{student.name}</strong>
                      <small>
                        {student.admissionNo ?? `ID: ${student.id}`} · Section {student.section}
                        {student.parentPhone && (
                          <span className="student-parent-phone" title={`Parent contact: ${student.parentPhone}`}>
                            {' · '}
                            <Phone size={11} aria-hidden="true" />
                            {student.parentPhone}
                          </span>
                        )}
                      </small>
                    </div>
                    {!isArchive && (
                      <div className="student-roster-actions">
                        <button
                          className="student-delete-btn"
                          type="button"
                          title={`Delete ${student.name}`}
                          aria-label={`Delete ${student.name}`}
                          onClick={() => {
                            setStudentsError('');
                            setStudentsSuccess('');
                            setStudentToDelete(student);
                          }}
                        >
                          <Trash2 size={13} aria-hidden="true" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="class-details-footer">
              <span className="roster-count-note">
                Showing {filteredStudents.length} of {classStudents.length} students
              </span>
            </div>
          </section>
        </div>
      )}

      {/* Edit Class Modal */}
      {!isArchive && activeDialog === 'editClass' && selectedClass && (
        <div
          className="students-dialog-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget && !isSaving) {
              handleCloseEditClass();
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && !isSaving) {
              handleCloseEditClass();
              return;
            }
            handleDialogKeyDown(event);
          }}
        >
          <section
            className="students-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-class-title"
          >
            <div className="students-dialog-header">
              <div>
                <p className="eyebrow-text">Class Management</p>
                <h2 id="edit-class-title">Edit {getShortClassName(selectedClass)}</h2>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="Close dialog"
                disabled={isSaving}
                onClick={handleCloseEditClass}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {formError && <p className="form-alert" role="alert">{formError}</p>}

            <form className="student-form" onSubmit={handleUpdateClass}>
              <label className="student-form-field">
                <span>Class / Grade</span>
                <select
                  required
                  value={editClassGrade}
                  onChange={(event) => {
                    const grade = event.target.value;
                    setEditClassGrade(grade);
                    if (editClassSection) {
                      setEditClassName(`${grade} ${editClassSection.toUpperCase()}`);
                    }
                  }}
                >
                  <option value="">Select a class grade</option>
                  {PRESET_GRADES.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
              </label>

              <label className="student-form-field">
                <span>Section letter</span>
                <input
                  required
                  maxLength={4}
                  placeholder="e.g. A, B, C"
                  value={editClassSection}
                  onChange={(event) => {
                    const sec = event.target.value.toUpperCase();
                    setEditClassSection(sec);
                    if (editClassGrade) {
                      setEditClassName(`${editClassGrade} ${sec}`);
                    }
                  }}
                />
              </label>

              <label className="student-form-field">
                <span>Class display name</span>
                <input
                  required
                  maxLength={50}
                  placeholder="e.g. Class 1A"
                  value={editClassName}
                  onChange={(event) => setNewClassName(event.target.value)}
                />
              </label>

              <div className="students-dialog-actions">
                <button
                  className="primary-button primary-button--small"
                  type="submit"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Create Class Modal */}
      {!isArchive && activeDialog === 'createClass' && (
        <div
          className="students-dialog-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget && !isSaving) {
              closeDialog();
            }
          }}
          onKeyDown={handleDialogKeyDown}
        >
          <section
            className="students-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-class-title"
          >
            <div className="students-dialog-header">
              <div>
                <p className="eyebrow-text">Class Management</p>
                <h2 id="create-class-title">Create a new class</h2>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="Close dialog"
                disabled={isSaving}
                onClick={closeDialog}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {formError && <p className="form-alert" role="alert">{formError}</p>}

            <form className="student-form" onSubmit={handleCreateClass}>
              <label className="student-form-field">
                <span>Class / Grade</span>
                <select
                  required
                  value={newClassGrade}
                  onChange={(event) => {
                    const grade = event.target.value;
                    setNewClassGrade(grade);
                    if (newClassSection) {
                      setNewClassName(`${grade} ${newClassSection.toUpperCase()}`);
                    }
                  }}
                >
                  <option value="">Select a class grade</option>
                  {PRESET_GRADES.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
              </label>

              <label className="student-form-field">
                <span>Section letter</span>
                <input
                  required
                  maxLength={4}
                  placeholder="e.g. A, B, C"
                  value={newClassSection}
                  onChange={(event) => {
                    const sec = event.target.value.toUpperCase();
                    setNewClassSection(sec);
                    if (newClassGrade) {
                      setNewClassName(`${newClassGrade} ${sec}`);
                    }
                  }}
                />
              </label>

              <label className="student-form-field">
                <span>Class display name</span>
                <input
                  required
                  maxLength={50}
                  placeholder="e.g. Class 1A"
                  value={newClassName}
                  onChange={(event) => setNewClassName(event.target.value)}
                />
              </label>

              <div className="students-dialog-actions">
                <button
                  className="primary-button primary-button--small"
                  type="submit"
                  disabled={isSaving}
                >
                  {isSaving ? 'Creating…' : 'Create class'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Contextual Add Student Modal */}
      {!isArchive && activeDialog === 'addStudent' && selectedClass && (
        <div
          className="students-dialog-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget && !isSaving) {
              handleCloseAddStudent();
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && !isSaving) {
              handleCloseAddStudent();
              return;
            }
            handleDialogKeyDown(event);
          }}
        >
          <section
            className="students-dialog student-register-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-student-title"
          >
            <div className="students-dialog-header">
              <div>
                <p className="eyebrow-text">STUDENT ADMISSION</p>
                <h2 id="add-student-title">Add student to {getShortClassName(selectedClass)}</h2>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="Close dialog"
                disabled={isSaving}
                onClick={handleCloseAddStudent}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {formError && <p className="form-alert" role="alert">{formError}</p>}

            <form className="student-form" onSubmit={handleAddStudent}>
              <div className="class-context-banner">
                <span>Enrolling directly into:</span>
                <strong>{selectedClass.name} (Section {selectedClass.section})</strong>
              </div>

              <label className="student-form-field">
                <span>Student full name *</span>
                <input
                  autoFocus
                  autoComplete="name"
                  maxLength={120}
                  required
                  placeholder="e.g. Asha Patel"
                  value={studentName}
                  onChange={(event) => setStudentName(event.target.value)}
                />
              </label>

              <div className="student-form-row">
                <label className="student-form-field">
                  <span>Date of birth (DOB)</span>
                  <input
                    type="date"
                    value={studentDob}
                    onChange={(event) => setStudentDob(event.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </label>

                <label className="student-form-field">
                  <span>Parent&apos;s contact number</span>
                  <input
                    type="tel"
                    autoComplete="tel"
                    maxLength={25}
                    placeholder="e.g. +254 712 345 678"
                    value={studentParentPhone}
                    onChange={(event) => setStudentParentPhone(event.target.value)}
                  />
                </label>
              </div>

              <label className="student-form-field">
                <span>Residential address</span>
                <input
                  type="text"
                  maxLength={180}
                  placeholder="e.g. Plot 45, Ridgeview Rd, Eldoret"
                  value={studentAddress}
                  onChange={(event) => setStudentAddress(event.target.value)}
                />
              </label>

              <div className="students-dialog-actions">
                <button
                  className="primary-button primary-button--small"
                  type="submit"
                  disabled={isSaving}
                >
                  {isSaving ? 'Enrolling…' : `Enroll in ${getShortClassName(selectedClass)}`}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {!isArchive && studentToDelete && (
        <div
          className="students-dialog-backdrop student-delete-confirm-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget && !isDeletingStudent) {
              setStudentToDelete(null);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && !isDeletingStudent) {
              setStudentToDelete(null);
            }
          }}
        >
          <section
            className="students-dialog student-delete-confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-student-dialog-title"
          >
            <div className="students-dialog-header">
              <h2 id="delete-student-dialog-title">Delete student</h2>
              <button
                className="icon-button"
                type="button"
                aria-label="Close dialog"
                disabled={isDeletingStudent}
                onClick={() => setStudentToDelete(null)}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="student-delete-confirm-body">
              <p>
                Are you sure you want to delete <strong>{studentToDelete.name}</strong> from{' '}
                <strong>{getShortClassName(selectedClass)}</strong>?
              </p>
              <p className="student-delete-warning">
                This student record will be permanently removed from class roster data.
              </p>
            </div>

            <div className="students-dialog-actions delete-dialog-actions">
              <button
                className="danger-button"
                type="button"
                disabled={isDeletingStudent}
                onClick={handleConfirmDeleteStudent}
              >
                {isDeletingStudent ? 'Deleting…' : 'Delete student'}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

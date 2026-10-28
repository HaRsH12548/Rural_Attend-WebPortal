import { AppError } from '@/lib/errors';
import { MAX_STUDENT_IMPORT_ROWS } from '@/lib/constants';
import { db } from '@/mocks/db';
import { simulate } from '@/mocks/delay';

/**
 * Loads classes and student counts for a branch, optionally filtered by academic year.
 * @param {string} branchId Branch identifier.
 * @param {string} [academicYearId] Optional academic year identifier (defaults to active year).
 * @returns {Promise<typeof db.classes>} Branch classes.
 */
export function getBranchClasses(branchId, academicYearId) {
  return simulate(() => {
    const branchExists = db.branches.some((branch) => branch.id === branchId);
    if (!branchExists) {
      throw new AppError({
        code: 'BRANCH_NOT_FOUND',
        message: 'Classes for the assigned branch could not be found.',
      });
    }

    const activeYear = db.academicYears?.find((ay) => ay.branchId === branchId && ay.isActive);
    const targetYearId = academicYearId || activeYear?.id;

    return db.classes
      .filter((classroom) => {
        if (classroom.branchId !== branchId) return false;
        return !targetYearId || classroom.academicYearId === targetYearId;
      })
      .map((classroom) => {
        const assignedTeachers = (db.teachers || []).filter(
          (t) => t.branchId === branchId && t.allottedClassIds?.includes(classroom.id),
        );
        const assignedTeacher = assignedTeachers.map((t) => t.name).join(', ') || null;
        return {
          ...classroom,
          assignedTeacher,
          teachers: assignedTeachers.map((t) => ({ id: t.id, name: t.name, designation: t.designation })),
        };
      });
  });
}

let nextClassId = 1;

/**
 * Creates a new class for a branch in the target or active academic year.
 * @param {{ branchId: string, grade: string, section: string, name?: string, academicYearId?: string }} input Class details.
 * @returns {Promise<typeof db.classes[number]>} The created class.
 */
export function createClass({ branchId, grade, section, name, academicYearId }) {
  return simulate(() => {
    const branchExists = db.branches.some((branch) => branch.id === branchId);
    if (!branchExists) {
      throw new AppError({
        code: 'BRANCH_NOT_FOUND',
        message: 'The assigned branch could not be found.',
      });
    }

    const normalizedGrade = grade ? grade.trim() : '';
    const normalizedSection = section ? section.trim().toUpperCase() : '';

    if (!normalizedGrade || !normalizedSection) {
      throw new AppError({
        code: 'INVALID_CLASS',
        message: 'Grade and section are required to create a class.',
      });
    }

    const activeYear = db.academicYears?.find((ay) => ay.branchId === branchId && ay.isActive);
    const targetYearId = academicYearId || activeYear?.id;

    const isDuplicate = db.classes.some(
      (classroom) =>
        classroom.branchId === branchId &&
        (!targetYearId || classroom.academicYearId === targetYearId) &&
        classroom.grade.toLowerCase() === normalizedGrade.toLowerCase() &&
        classroom.section.toUpperCase() === normalizedSection,
    );

    if (isDuplicate) {
      throw new AppError({
        code: 'DUPLICATE_CLASS',
        message: `${normalizedGrade} section ${normalizedSection} already exists in this branch.`,
      });
    }

    const className = name && name.trim() ? name.trim() : `${normalizedGrade}${normalizedSection}`;
    const newClass = {
      id: `class-${Date.now()}-${nextClassId++}`,
      branchId,
      academicYearId: targetYearId,
      name: className,
      grade: normalizedGrade,
      section: normalizedSection,
      studentCount: 0,
      presentToday: 0,
    };

    db.classes.push(newClass);
    return { ...newClass };
  });
}

/**
 * Updates an existing class.
 * @param {{ classId: string, grade?: string, section?: string, name?: string }} input Update details.
 * @returns {Promise<typeof db.classes[number]>} The updated class.
 */
export function updateClass({ classId, grade, section, name }) {
  return simulate(() => {
    const classroom = db.classes.find((item) => item.id === classId);
    if (!classroom) {
      throw new AppError({
        code: 'CLASS_NOT_FOUND',
        message: 'The class could not be found.',
      });
    }

    const normalizedGrade = grade !== undefined ? grade.trim() : classroom.grade;
    const normalizedSection = section !== undefined ? section.trim().toUpperCase() : classroom.section;

    if (!normalizedGrade || !normalizedSection) {
      throw new AppError({
        code: 'INVALID_CLASS',
        message: 'Grade and section cannot be empty.',
      });
    }

    const isDuplicate = db.classes.some(
      (item) =>
        item.id !== classId &&
        item.branchId === classroom.branchId &&
        item.grade.toLowerCase() === normalizedGrade.toLowerCase() &&
        item.section.toUpperCase() === normalizedSection,
    );

    if (isDuplicate) {
      throw new AppError({
        code: 'DUPLICATE_CLASS',
        message: `${normalizedGrade} section ${normalizedSection} already exists in this branch.`,
      });
    }

    classroom.grade = normalizedGrade;
    classroom.section = normalizedSection;
    classroom.name = name && name.trim() ? name.trim() : `${normalizedGrade}${normalizedSection}`;

    const assignedTeachers = (db.teachers || []).filter(
      (t) => t.branchId === classroom.branchId && t.allottedClassIds?.includes(classroom.id),
    );
    classroom.assignedTeacher = assignedTeachers.map((t) => t.name).join(', ') || null;
    classroom.teachers = assignedTeachers.map((t) => ({ id: t.id, name: t.name, designation: t.designation }));

    return { ...classroom };
  });
}

const INITIAL_DEMO_STUDENTS = {
  'class-1a': [
    { id: 'std-101', name: 'Asha Patel', rollNo: '01', status: 'Present', admissionNo: 'ADM-2024-001', parentPhone: '+254 712 345 678', dob: '2017-03-15', address: '45 Ridgeview Rd, Eldoret' },
    { id: 'std-102', name: 'Ravi Kumar', rollNo: '02', status: 'Present', admissionNo: 'ADM-2024-002', parentPhone: '+254 722 987 654', dob: '2017-06-22', address: '12 Pioneer Estate, Eldoret' },
    { id: 'std-103', name: 'Samira Khan', rollNo: '03', status: 'Present', admissionNo: 'ADM-2024-003', parentPhone: '+254 733 456 789', dob: '2017-01-10', address: '88 Kapsoya Sector 2, Eldoret' },
    { id: 'std-104', name: 'David Ochieng', rollNo: '04', status: 'Present', admissionNo: 'ADM-2024-004', parentPhone: '+254 744 112 233', dob: '2016-11-05', address: '14 West Indies, Eldoret' },
    { id: 'std-105', name: 'Faith Mwangi', rollNo: '05', status: 'Absent', admissionNo: 'ADM-2024-005', parentPhone: '+254 755 223 344', dob: '2017-04-18', address: '23 Elgon View, Eldoret' },
    { id: 'std-106', name: 'Kavita Rao', rollNo: '06', status: 'Present', admissionNo: 'ADM-2024-006', parentPhone: '+254 766 334 455', dob: '2017-08-30', address: '55 Kaptagat Way, Eldoret' },
    { id: 'std-107', name: 'Emmanuel Kiprop', rollNo: '07', status: 'Present', admissionNo: 'ADM-2024-007', parentPhone: '+254 777 445 566', dob: '2016-12-14', address: '9 Langas Central, Eldoret' },
    { id: 'std-108', name: 'Grace Njeri', rollNo: '08', status: 'Absent', admissionNo: 'ADM-2024-008', parentPhone: '+254 788 556 677', dob: '2017-02-28', address: '102 Maili Nne, Eldoret' },
    { id: 'std-109', name: 'Arjun Mehta', rollNo: '09', status: 'Present', admissionNo: 'ADM-2024-009', parentPhone: '+254 799 667 788', dob: '2017-07-09', address: '31 Racecourse Rd, Eldoret' },
    { id: 'std-110', name: 'Brian Otieno', rollNo: '10', status: 'Present', admissionNo: 'ADM-2024-010', parentPhone: '+254 711 778 899', dob: '2016-10-21', address: '77 Huruma Block B, Eldoret' },
  ],
  'class-2b': [
    { id: 'std-201', name: 'Ananya Sharma', rollNo: '01', status: 'Present', admissionNo: 'ADM-2024-011', parentPhone: '+254 712 111 222', dob: '2016-05-12', address: '19 Pioneer Estate, Eldoret' },
    { id: 'std-202', name: 'Dennis Kimutai', rollNo: '02', status: 'Present', admissionNo: 'ADM-2024-012', parentPhone: '+254 722 222 333', dob: '2016-02-17', address: '6 Kapsoya Crescent, Eldoret' },
    { id: 'std-203', name: 'Pooja Verma', rollNo: '03', status: 'Absent', admissionNo: 'ADM-2024-013', parentPhone: '+254 733 333 444', dob: '2015-11-25', address: '42 Elgon View, Eldoret' },
    { id: 'std-204', name: 'Kevin Wekesa', rollNo: '04', status: 'Present', admissionNo: 'ADM-2024-014', parentPhone: '+254 744 444 555', dob: '2016-08-03', address: '15 West Indies, Eldoret' },
    { id: 'std-205', name: 'Mercy Chebet', rollNo: '05', status: 'Present', admissionNo: 'ADM-2024-015', parentPhone: '+254 755 555 666', dob: '2016-03-31', address: '80 Ridgeview Rd, Eldoret' },
    { id: 'std-206', name: 'Rohan Gupta', rollNo: '06', status: 'Present', admissionNo: 'ADM-2024-016', parentPhone: '+254 766 666 777', dob: '2015-12-19', address: '24 Kaptagat Way, Eldoret' },
    { id: 'std-207', name: 'Sharon Achieng', rollNo: '07', status: 'Present', admissionNo: 'ADM-2024-017', parentPhone: '+254 777 777 888', dob: '2016-07-08', address: '5 Langas Central, Eldoret' },
    { id: 'std-208', name: 'Victor Korir', rollNo: '08', status: 'Absent', admissionNo: 'ADM-2024-018', parentPhone: '+254 788 888 999', dob: '2016-01-20', address: '36 Maili Nne, Eldoret' },
  ],
  'class-3a': [
    { id: 'std-301', name: 'Deepak Joshi', rollNo: '01', status: 'Present', admissionNo: 'ADM-2024-019', parentPhone: '+254 712 999 000', dob: '2015-04-14', address: '62 Racecourse Rd, Eldoret' },
    { id: 'std-302', name: 'Lilian Muthoni', rollNo: '02', status: 'Present', admissionNo: 'ADM-2024-020', parentPhone: '+254 722 888 111', dob: '2015-09-02', address: '11 Huruma Block A, Eldoret' },
    { id: 'std-303', name: 'Sneha Kulkarni', rollNo: '03', status: 'Present', admissionNo: 'ADM-2024-021', parentPhone: '+254 733 777 222', dob: '2015-06-18', address: '28 Pioneer Estate, Eldoret' },
    { id: 'std-304', name: 'Peter Kamau', rollNo: '04', status: 'Absent', admissionNo: 'ADM-2024-022', parentPhone: '+254 744 666 333', dob: '2014-12-30', address: '73 Kapsoya Sector 3, Eldoret' },
    { id: 'std-305', name: 'Neha Nair', rollNo: '05', status: 'Present', admissionNo: 'ADM-2024-023', parentPhone: '+254 755 555 444', dob: '2015-03-24', address: '9 Elgon View, Eldoret' },
    { id: 'std-306', name: 'Stephen Mutua', rollNo: '06', status: 'Present', admissionNo: 'ADM-2024-024', parentPhone: '+254 766 444 555', dob: '2015-08-11', address: '51 West Indies, Eldoret' },
  ],
  'class-4b': [
    { id: 'std-401', name: 'Tarun Reddy', rollNo: '01', status: 'Present', admissionNo: 'ADM-2024-025', parentPhone: '+254 712 333 111', dob: '2014-07-29', address: '16 Ridgeview Rd, Eldoret' },
    { id: 'std-402', name: 'Beatrice Wanjiku', rollNo: '02', status: 'Present', admissionNo: 'ADM-2024-026', parentPhone: '+254 722 444 222', dob: '2014-02-14', address: '88 Kaptagat Way, Eldoret' },
    { id: 'std-403', name: 'Vikram Singh', rollNo: '03', status: 'Absent', admissionNo: 'ADM-2024-027', parentPhone: '+254 733 555 333', dob: '2013-10-09', address: '34 Langas Central, Eldoret' },
    { id: 'std-404', name: 'Collins Kiprono', rollNo: '04', status: 'Present', admissionNo: 'ADM-2024-028', parentPhone: '+254 744 666 444', dob: '2014-05-23', address: '90 Maili Nne, Eldoret' },
    { id: 'std-405', name: 'Fatima Zahra', rollNo: '05', status: 'Present', admissionNo: 'ADM-2024-029', parentPhone: '+254 755 777 555', dob: '2014-11-16', address: '47 Racecourse Rd, Eldoret' },
  ],
};

let DEFAULT_DEMO_STUDENTS = JSON.parse(JSON.stringify(INITIAL_DEMO_STUDENTS));
const deletedStudentIds = new Set();

/**
 * Resets demo rosters and deleted student state for testing.
 */
export function resetDemoStudents() {
  DEFAULT_DEMO_STUDENTS = JSON.parse(JSON.stringify(INITIAL_DEMO_STUDENTS));
  deletedStudentIds.clear();
}

/**
 * Loads student records for a specific class.
 * @param {string} classId Class identifier.
 * @returns {Promise<Array<object>>} Students belonging to the class.
 */
export function getClassStudents(classId) {
  return simulate(() => {
    const classroom = db.classes.find((item) => item.id === classId);
    if (!classroom) {
      throw new AppError({
        code: 'CLASS_NOT_FOUND',
        message: 'The requested class could not be found.',
      });
    }

    const dynamicStudents = db.students
      .filter((student) => student.classId === classId && !deletedStudentIds.has(student.id))
      .map((student) => ({
        id: student.id,
        name: student.name,
        parentPhone: student.parentPhone || '',
        dob: student.dob || '',
        address: student.address || '',
        status: 'Present',
        admissionNo: student.admissionNo || `ADM-${student.id.slice(-6).toUpperCase()}`,
        section: student.section,
        grade: classroom.grade,
        classId: classroom.id,
        className: classroom.name,
      }));

    const demoRoster = (DEFAULT_DEMO_STUDENTS[classId] ?? [])
      .filter((student) => !deletedStudentIds.has(student.id))
      .map((student) => ({
        ...student,
        parentPhone: student.parentPhone || '',
        dob: student.dob || '',
        address: student.address || '',
        section: classroom.section,
        grade: classroom.grade,
        classId: classroom.id,
        className: classroom.name,
      }));

    const dynamicNames = new Set(dynamicStudents.map((s) => s.name.toLowerCase()));
    const filteredDemo = demoRoster.filter((s) => !dynamicNames.has(s.name.toLowerCase()));

    const allStudents = [...dynamicStudents, ...filteredDemo];

    // Sequentially assign roll numbers: first entry gets 01, second 02, etc.
    return allStudents.map((student, index) => ({
      ...student,
      rollNo: String(index + 1).padStart(2, '0'),
    }));
  });
}

/**
 * Loads branch students with query filtering and pagination.
 * Filters across the database by class and search terms (name, admissionNo, phone, address),
 * and paginates the matched results.
 *
 * @param {string} branchId Branch identifier.
 * @param {string} [academicYearId] Optional academic year identifier filter.
 * @param {object} [options] Query parameters.
 * @param {number} [options.page] Page number (1-indexed). If omitted, returns all matched students array.
 * @param {number} [options.limit=10] Page size limit.
 * @param {string} [options.search=''] Search term matching student name, admission number, phone or address.
 * @param {string} [options.classId='all'] Class identifier filter.
 * @returns {Promise<Array<object> | { data: Array<object>, total: number, page: number, limit: number, totalPages: number }>}
 */
export function getBranchStudents(branchId, academicYearId, options = {}) {
  return simulate(() => {
    let classes = db.classes.filter((item) => item.branchId === branchId);
    if (academicYearId) {
      classes = classes.filter((item) => item.academicYearId === academicYearId);
    }

    const { page, limit = 10, search = '', classId = 'all' } = options;

    if (classId && classId !== 'all') {
      classes = classes.filter((item) => item.id === classId);
    }

    const allStudents = [];
    for (const classroom of classes) {
      const dynamicStudents = db.students
        .filter((student) => student.classId === classroom.id && !deletedStudentIds.has(student.id))
        .map((student) => ({
          id: student.id,
          name: student.name,
          parentPhone: student.parentPhone || '',
          dob: student.dob || '',
          address: student.address || '',
          admissionNo: student.admissionNo || `ADM-${student.id.slice(-6).toUpperCase()}`,
          section: student.section,
          grade: classroom.grade,
          classId: classroom.id,
          className: classroom.name,
        }));

      const demoRoster = (DEFAULT_DEMO_STUDENTS[classroom.id] ?? [])
        .filter((student) => !deletedStudentIds.has(student.id))
        .map((student) => ({
          ...student,
          parentPhone: student.parentPhone || '',
          dob: student.dob || '',
          address: student.address || '',
          section: classroom.section,
          grade: classroom.grade,
          classId: classroom.id,
          className: classroom.name,
        }));

      const dynamicNames = new Set(dynamicStudents.map((s) => s.name.toLowerCase()));
      const filteredDemo = demoRoster.filter((s) => !dynamicNames.has(s.name.toLowerCase()));
      const merged = [...dynamicStudents, ...filteredDemo].map((student, index) => ({
        ...student,
        rollNo: String(index + 1).padStart(2, '0'),
      }));

      allStudents.push(...merged);
    }

    // Apply search query across matching dataset (equivalent to SQL WHERE name LIKE '%...%' etc.)
    let matchedStudents = allStudents;
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      matchedStudents = matchedStudents.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          s.admissionNo?.toLowerCase().includes(q) ||
          s.parentPhone?.toLowerCase().includes(q) ||
          s.address?.toLowerCase().includes(q),
      );
    }

    matchedStudents.sort((a, b) => a.name.localeCompare(b.name));

    // Backward compatibility: If page is not specified, return array directly
    if (typeof page !== 'number') {
      return matchedStudents;
    }

    const total = matchedStudents.length;
    const pageSize = Math.max(1, limit);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const offset = (safePage - 1) * pageSize;
    const paginatedData = matchedStudents.slice(offset, offset + pageSize);

    return {
      data: paginatedData,
      total,
      page: safePage,
      limit: pageSize,
      totalPages,
    };
  });
}

/**
 * Deletes a student record and decrements the associated class count.
 * @param {{ studentId: string, classId: string }} input Student and class identifiers.
 * @returns {Promise<{ success: boolean, studentId: string }>} Deletion result.
 */
export function deleteStudent({ studentId, classId }) {
  return simulate(() => {
    const classroom = db.classes.find((item) => item.id === classId);
    if (!classroom) {
      throw new AppError({
        code: 'CLASS_NOT_FOUND',
        message: 'The class could not be found.',
      });
    }

    deletedStudentIds.add(studentId);

    const dynamicIndex = db.students.findIndex((student) => student.id === studentId);
    if (dynamicIndex >= 0) {
      db.students.splice(dynamicIndex, 1);
    }

    if (DEFAULT_DEMO_STUDENTS[classId]) {
      const demoIndex = DEFAULT_DEMO_STUDENTS[classId].findIndex((s) => s.id === studentId);
      if (demoIndex >= 0) {
        DEFAULT_DEMO_STUDENTS[classId].splice(demoIndex, 1);
      }
    }

    if (classroom.studentCount > 0) {
      classroom.studentCount -= 1;
    }

    return { success: true, studentId };
  });
}

/**
 * Creates one student and updates the associated class count.
 * @param {{ branchId: string, name: string, grade: string, section: string, parentPhone?: string, dob?: string, address?: string }} input Student details.
 * @returns {Promise<object>} The created student.
 */
export function createStudent({
  branchId,
  name,
  grade,
  section,
  parentPhone = '',
  dob = '',
  address = '',
}) {
  return simulate(() => {
    const [classroom] = validateStudents(branchId, [{ name, grade, section }]);
    const normalizedName = name.trim();
    const isDuplicate = db.students.some(
      (student) =>
        student.branchId === branchId &&
        student.classId === classroom.id &&
        student.name.toLocaleLowerCase() === normalizedName.toLocaleLowerCase(),
    );
    if (isDuplicate) {
      throw new AppError({
        code: 'DUPLICATE_STUDENT',
        message: `${normalizedName} is already listed in ${classroom.grade} section ${classroom.section}.`,
      });
    }

    const uniqueSeq = String(Date.now()).slice(-4) + String(nextStudentId).padStart(3, '0');
    const student = {
      id: `student-${Date.now()}-${nextStudentId++}`,
      branchId,
      classId: classroom.id,
      name: normalizedName,
      section: classroom.section,
      parentPhone: parentPhone ? String(parentPhone).trim() : '',
      dob: dob ? String(dob).trim() : '',
      address: address ? String(address).trim() : '',
      admissionNo: `ADM-${uniqueSeq}`,
    };

    db.students.push(student);
    classroom.studentCount += 1;
    return {
      ...student,
      className: classroom.name,
      grade: classroom.grade,
    };
  });
}

/**
 * Imports a batch only after validating every record.
 * @param {string} branchId Branch identifier.
 * @param {Array<{ name: string, grade: string, section: string, parentPhone?: string, rowNumber?: number }>} records Student rows.
 * @returns {Promise<{ importedCount: number }>} Import result.
 */
export function importStudents(branchId, records) {
  return simulate(() => {
    const matchedClasses = validateStudents(branchId, records);
    const existing = new Set(
      db.students
        .filter((student) => student.branchId === branchId)
        .map((student) => `${student.classId}:${student.name.toLocaleLowerCase()}`),
    );
    const incoming = new Set();

    records.forEach((record, index) => {
      const studentKey = `${matchedClasses[index].id}:${record.name.trim().toLocaleLowerCase()}`;
      if (existing.has(studentKey) || incoming.has(studentKey)) {
        const row = record.rowNumber ?? index + 1;
        throw new AppError({
          code: 'DUPLICATE_STUDENT',
          message: `Row ${row}: ${record.name.trim()} is already listed in ${record.grade} ${record.section}. No students were imported.`,
        });
      }
      incoming.add(studentKey);
    });

    const createdStudents = records.map((record, index) => ({
      id: `student-${Date.now()}-${nextStudentId++}`,
      branchId,
      classId: matchedClasses[index].id,
      name: record.name.trim(),
      section: matchedClasses[index].section,
      parentPhone: record.parentPhone ? String(record.parentPhone).trim() : '',
    }));

    db.students.push(...createdStudents);
    createdStudents.forEach((student) => {
      const classroom = db.classes.find((item) => item.id === student.classId);
      if (classroom) {
        classroom.studentCount += 1;
      }
    });

    return { importedCount: createdStudents.length };
  });
}

let nextStudentId = 1;

function validateStudents(branchId, records) {
  const branchExists = db.branches.some((branch) => branch.id === branchId);
  if (!branchExists) {
    throw new AppError({
      code: 'BRANCH_NOT_FOUND',
      message: 'The assigned branch could not be found.',
    });
  }
  if (!Array.isArray(records) || records.length === 0) {
    throw new AppError({
      code: 'EMPTY_IMPORT',
      message: 'Add at least one student before saving.',
    });
  }
  if (records.length > MAX_STUDENT_IMPORT_ROWS) {
    throw new AppError({
      code: 'IMPORT_TOO_LARGE',
      message: `An import cannot contain more than ${MAX_STUDENT_IMPORT_ROWS} students.`,
    });
  }

  return records.map((record, index) => {
    const name = typeof record?.name === 'string' ? record.name.trim() : '';
    const grade = typeof record?.grade === 'string' ? record.grade.trim() : '';
    const section = typeof record?.section === 'string' ? record.section.trim().toUpperCase() : '';
    const row = record?.rowNumber ?? index + 1;

    if (!name || !grade || !section) {
      throw new AppError({
        code: 'INVALID_STUDENT',
        message: `Row ${row}: name, class, and section are required.`,
      });
    }
    if (name.length > 120) {
      throw new AppError({
        code: 'INVALID_STUDENT',
        message: `Row ${row}: student names must be 120 characters or fewer.`,
      });
    }

    const classroom = db.classes.find(
      (item) =>
        item.branchId === branchId &&
        item.grade.toLocaleLowerCase() === grade.toLocaleLowerCase() &&
        item.section.toUpperCase() === section,
    );
    if (!classroom) {
      throw new AppError({
        code: 'CLASS_NOT_FOUND',
        message: `Row ${row}: ${grade} section ${section} is not available in this branch.`,
      });
    }

    return classroom;
  });
}

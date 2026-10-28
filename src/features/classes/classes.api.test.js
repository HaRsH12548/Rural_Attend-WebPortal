import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createClass,
  createStudent,
  deleteStudent,
  getBranchClasses,
  getBranchStudents,
  getClassStudents,
  importStudents,
  resetDemoStudents,
  updateClass,
} from '@/features/classes/classes.api';
import { resetAcademicYears } from '@/features/academicYears/academicYears.api';
import { db } from '@/mocks/db';
import { seededBranches, seededClasses, seededStudents } from '@/mocks/seed';

vi.mock('@/mocks/delay', () => ({
  simulate: (operation) => Promise.resolve().then(operation),
}));

describe('branch classes and roster API', () => {
  beforeEach(() => {
    db.branches.splice(0, db.branches.length, ...seededBranches);
    db.classes.splice(0, db.classes.length, ...seededClasses.map((item) => ({ ...item })));
    db.students.splice(0, db.students.length, ...seededStudents);
    resetDemoStudents();
    resetAcademicYears();
  });

  it('returns the classes and student counts for the requested branch', async () => {
    const classes = await getBranchClasses('branch-demo');

    expect(classes).toHaveLength(4);
    expect(classes[0]).toMatchObject({
      id: 'class-1a',
      name: 'Class 1A',
      studentCount: 36,
    });
  });

  it('creates a student and increments the matching class count', async () => {
    const student = await createStudent({
      branchId: 'branch-demo',
      name: '  Samira Khan  ',
      grade: 'Class 1',
      section: 'a',
      parentPhone: '+91 98765 43210',
    });

    expect(student).toMatchObject({
      branchId: 'branch-demo',
      classId: 'class-1a',
      name: 'Samira Khan',
      section: 'A',
      parentPhone: '+91 98765 43210',
    });
    await expect(getBranchClasses('branch-demo')).resolves.toContainEqual(
      expect.objectContaining({ id: 'class-1a', studentCount: 37 }),
    );
  });

  it('imports a batch atomically and increments counts', async () => {
    const result = await importStudents('branch-demo', [
      { name: 'Asha Patel', grade: 'Class 1', section: 'A', rowNumber: 2 },
      { name: 'Ravi Kumar', grade: 'Class 2', section: 'B', rowNumber: 3 },
    ]);

    expect(result.importedCount).toBe(2);
    expect(db.students).toHaveLength(2);
    await expect(getBranchClasses('branch-demo')).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'class-1a', studentCount: 37 }),
        expect.objectContaining({ id: 'class-2b', studentCount: 31 }),
      ]),
    );
  });

  it('does not partially import rows when a class or section is invalid', async () => {
    await expect(
      importStudents('branch-demo', [
        { name: 'Asha Patel', grade: 'Class 1', section: 'A', rowNumber: 2 },
        { name: 'Ravi Kumar', grade: 'Class 9', section: 'Z', rowNumber: 3 },
      ]),
    ).rejects.toMatchObject({ code: 'CLASS_NOT_FOUND' });

    expect(db.students).toHaveLength(0);
    expect(db.classes[0].studentCount).toBe(36);
  });

  it('rejects duplicate names within the same class', async () => {
    await expect(
      importStudents('branch-demo', [
        { name: 'Asha Patel', grade: 'Class 1', section: 'A', rowNumber: 2 },
        { name: ' asha patel ', grade: 'Class 1', section: 'A', rowNumber: 3 },
      ]),
    ).rejects.toMatchObject({ code: 'DUPLICATE_STUDENT' });

    expect(db.students).toHaveLength(0);
  });

  it('rejects an import larger than the supported batch size', async () => {
    const records = Array.from({ length: 2001 }, (_, index) => ({
      name: `Student ${index}`,
      grade: 'Class 1',
      section: 'A',
    }));

    await expect(importStudents('branch-demo', records)).rejects.toMatchObject({
      code: 'IMPORT_TOO_LARGE',
    });
    expect(db.students).toHaveLength(0);
  });

  it('returns an explicit error for an unknown branch', async () => {
    await expect(getBranchClasses('missing-branch')).rejects.toMatchObject({
      name: 'AppError',
      code: 'BRANCH_NOT_FOUND',
    });
  });

  it('creates a new class and prevents duplicates in the same branch', async () => {
    const created = await createClass({
      branchId: 'branch-demo',
      grade: 'Class 5',
      section: 'a',
      name: 'Class 5A',
    });

    expect(created).toMatchObject({
      branchId: 'branch-demo',
      grade: 'Class 5',
      section: 'A',
      name: 'Class 5A',
      studentCount: 0,
    });

    await expect(
      createClass({
        branchId: 'branch-demo',
        grade: 'Class 5',
        section: 'A',
      }),
    ).rejects.toMatchObject({
      code: 'DUPLICATE_CLASS',
    });
  });

  it('returns student records for a class with sequential roll numbers and parent contact', async () => {
    const students = await getClassStudents('class-1a');
    expect(students.length).toBeGreaterThan(0);
    expect(students[0]).toHaveProperty('name');
    expect(students[0].rollNo).toBe('01');
    expect(students[1].rollNo).toBe('02');
    expect(students[0]).toHaveProperty('parentPhone');
  });

  it('updates an existing class and prevents duplicates', async () => {
    const updated = await updateClass({
      classId: 'class-1a',
      grade: 'Class 1',
      section: 'C',
      name: 'Class 1C',
    });

    expect(updated).toMatchObject({
      id: 'class-1a',
      section: 'C',
      name: 'Class 1C',
    });

    await expect(
      updateClass({
        classId: 'class-1a',
        grade: 'Class 2',
        section: 'B',
      }),
    ).rejects.toMatchObject({
      code: 'DUPLICATE_CLASS',
    });
  });

  it('deletes a student and decrements the associated class count', async () => {
    const initialStudents = await getClassStudents('class-1a');
    expect(initialStudents.length).toBeGreaterThan(0);
    const targetStudent = initialStudents[0];

    const result = await deleteStudent({ studentId: targetStudent.id, classId: 'class-1a' });
    expect(result).toEqual({ success: true, studentId: targetStudent.id });

    const remainingStudents = await getClassStudents('class-1a');
    expect(remainingStudents.some((s) => s.id === targetStudent.id)).toBe(false);

    const classes = await getBranchClasses('branch-demo');
    const class1a = classes.find((c) => c.id === 'class-1a');
    expect(class1a.studentCount).toBe(35);
  });

  it('loads all branch students across classes with full profile details', async () => {
    const allStudents = await getBranchStudents('branch-demo');
    expect(allStudents.length).toBeGreaterThan(0);
    const sample = allStudents[0];
    expect(sample).toHaveProperty('name');
    expect(sample).toHaveProperty('admissionNo');
    expect(sample).toHaveProperty('dob');
    expect(sample).toHaveProperty('parentPhone');
    expect(sample).toHaveProperty('address');
    expect(sample).toHaveProperty('className');
  });

  it('creates a student with dob, parentPhone and address', async () => {
    const created = await createStudent({
      branchId: 'branch-demo',
      name: 'Eunice Wangari',
      grade: 'Class 1',
      section: 'A',
      dob: '2017-05-10',
      parentPhone: '+254 700 123 456',
      address: '15 High Street, Eldoret',
    });

    expect(created).toMatchObject({
      name: 'Eunice Wangari',
      section: 'A',
      dob: '2017-05-10',
      parentPhone: '+254 700 123 456',
      address: '15 High Street, Eldoret',
    });
    expect(created.admissionNo).toMatch(/^ADM-/);
  });

  it('paginates branch students with server-style parameters', async () => {
    const res = await getBranchStudents('branch-demo', null, { page: 1, limit: 10 });
    expect(res).toHaveProperty('data');
    expect(res).toHaveProperty('total');
    expect(res).toHaveProperty('page', 1);
    expect(res).toHaveProperty('limit', 10);
    expect(res.data.length).toBeLessThanOrEqual(10);
    expect(res.total).toBeGreaterThan(10);
    expect(res.totalPages).toBe(Math.ceil(res.total / 10));
  });

  it('filters students by class at the query level across the whole database', async () => {
    const res = await getBranchStudents('branch-demo', null, {
      classId: 'class-1a',
      page: 1,
      limit: 50,
    });
    expect(res.data.length).toBeGreaterThan(0);
    expect(res.data.every((s) => s.classId === 'class-1a')).toBe(true);
  });

  it('filters students by search query across the database', async () => {
    const res = await getBranchStudents('branch-demo', null, {
      search: 'Patel',
      page: 1,
      limit: 10,
    });
    expect(res.data.length).toBeGreaterThan(0);
    expect(res.data.every((s) => s.name.toLowerCase().includes('patel'))).toBe(true);
  });
});


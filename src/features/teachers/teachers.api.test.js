import { describe, expect, it } from 'vitest';
import {
  createTeacher,
  deleteTeacher,
  getBranchTeachers,
  getTeacherInitials,
  resetTeacherPassword,
  updateTeacher,
} from './teachers.api';
import { db } from '@/mocks/db';

describe('teachers API', () => {
  const branchId = 'branch-demo';

  it('loads all branch teachers with resolved allotted classes', async () => {
    const teachers = await getBranchTeachers(branchId);
    expect(Array.isArray(teachers)).toBe(true);
    expect(teachers.length).toBeGreaterThanOrEqual(3);

    const aditi = teachers.find((t) => t.id === 'teacher-101');
    expect(aditi).toBeDefined();
    expect(aditi.name).toBe('Mrs. Aditi Rao');
    expect(aditi.allottedClasses.length).toBeGreaterThan(0);
    expect(aditi.allottedClasses[0]).toHaveProperty('name', 'Class 1A');
  });

  it('creates a new teacher with credentials and section allotments', async () => {
    const newTeacher = await createTeacher({
      branchId,
      name: 'Mr. David Kiprotich',
      email: 'david.kiprotich@school.demo',
      phone: '+254 744 112 233',
      staffId: 'TCH-004',
      password: 'password123',
      designation: 'Class Teacher',
      allottedClassIds: ['class-4b'],
    });

    expect(newTeacher).toHaveProperty('id');
    expect(newTeacher.name).toBe('Mr. David Kiprotich');
    expect(newTeacher.staffId).toBe('TCH-004');
    expect(newTeacher.allottedClasses).toHaveLength(1);
    expect(newTeacher.allottedClasses[0].id).toBe('class-4b');

    // Verify user account exists in db.users for login
    const userAccount = db.users.find((u) => u.email === 'david.kiprotich@school.demo');
    expect(userAccount).toBeDefined();
    expect(userAccount.role).toBe('TEACHER');
    expect(userAccount.password).toBe('password123');
  });

  it('rejects creating a teacher with an existing email', async () => {
    await expect(
      createTeacher({
        branchId,
        name: 'Duplicate Teacher',
        email: 'aditi.rao@school.demo',
        staffId: 'TCH-999',
        password: 'password123',
      }),
    ).rejects.toThrow('already exists');
  });

  it('updates teacher details, password and allotted sections', async () => {
    const updated = await updateTeacher({
      teacherId: 'teacher-102',
      name: 'Mr. Joseph Mwangi (Senior Teacher)',
      allottedClassIds: ['class-2b', 'class-3a'],
      password: 'newpassword456',
    });

    expect(updated.name).toBe('Mr. Joseph Mwangi (Senior Teacher)');
    expect(updated.allottedClasses).toHaveLength(2);

    const userAccount = db.users.find((u) => u.id === updated.userId);
    expect(userAccount.password).toBe('newpassword456');
  });

  it('resets a teacher password', async () => {
    const res = await resetTeacherPassword({
      teacherId: 'teacher-103',
      newPassword: 'freshpassword789',
    });

    expect(res.success).toBe(true);
    const teacher = db.teachers.find((t) => t.id === 'teacher-103');
    expect(teacher.password).toBe('freshpassword789');
  });

  it('deletes a teacher and cleans up user credentials', async () => {
    // Create a temporary teacher to delete
    const temp = await createTeacher({
      branchId,
      name: 'Temp Teacher',
      email: 'temp.teacher@school.demo',
      staffId: 'TCH-TEMP',
      password: 'password123',
    });

    const res = await deleteTeacher({ teacherId: temp.id });
    expect(res.success).toBe(true);

    expect(db.teachers.some((t) => t.id === temp.id)).toBe(false);
    expect(db.users.some((u) => u.id === temp.userId)).toBe(false);
  });

  it('correctly calculates teacher initials ignoring titles/honorifics', () => {
    expect(getTeacherInitials('Mrs. Aditi Rao')).toBe('AR');
    expect(getTeacherInitials('Mr. David Kiprotich')).toBe('DK');
    expect(getTeacherInitials('Dr. Vikram Sharma')).toBe('VS');
    expect(getTeacherInitials('Ms. Priya Patel')).toBe('PP');
    expect(getTeacherInitials('Aditi Rao')).toBe('AR');
    expect(getTeacherInitials('Vikram')).toBe('VI');
    expect(getTeacherInitials('')).toBe('T');
  });
});


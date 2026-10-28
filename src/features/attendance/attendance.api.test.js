import { describe, expect, it } from 'vitest';
import {
  getClassAttendanceSession,
  getDailyAttendanceOverview,
  saveClassAttendance,
  getAttendanceReport,
} from './attendance.api';

describe('attendance API', () => {
  const branchId = 'branch-demo';
  const today = new Date().toISOString().split('T')[0];

  it('loads daily attendance overview with computed statistics and classes', async () => {
    const result = await getDailyAttendanceOverview({
      branchId,
      academicYearId: 'ay-2024-2025',
      date: today,
    });

    expect(result).toHaveProperty('date', today);
    expect(result).toHaveProperty('stats');
    expect(result.stats).toHaveProperty('totalClasses', 4);
    expect(result.stats).toHaveProperty('classesSubmitted');
    expect(result.stats).toHaveProperty('classesPending');
    expect(result.stats.classesSubmitted + result.stats.classesPending).toBe(4);
    expect(Array.isArray(result.classes)).toBe(true);
    expect(result.classes.length).toBe(4);

    const class1A = result.classes.find((c) => c.classId === 'class-1a');
    expect(class1A).toBeDefined();
    expect(class1A.status).toBe('submitted');
    expect(class1A.presentCount).toBe(33);

    const class4B = result.classes.find((c) => c.classId === 'class-4b');
    expect(class4B).toBeDefined();
    expect(class4B.status).toBe('not_received');
    expect(class4B.presentCount).toBe(0);
  });

  it('throws BRANCH_NOT_FOUND when branch does not exist', async () => {
    await expect(
      getDailyAttendanceOverview({
        branchId: 'non-existent-branch',
        date: today,
      }),
    ).rejects.toThrow('The assigned branch could not be found.');
  });

  it('retrieves class attendance session for an already submitted class', async () => {
    const session = await getClassAttendanceSession({
      classId: 'class-1a',
      date: today,
    });

    expect(session.classId).toBe('class-1a');
    expect(session.status).toBe('submitted');
    expect(session.records.length).toBeGreaterThan(0);
    expect(session.records[0]).toHaveProperty('status');
  });

  it('prepares a fresh roll for a class that has not submitted yet', async () => {
    const session = await getClassAttendanceSession({
      classId: 'class-4b',
      date: today,
    });

    expect(session.classId).toBe('class-4b');
    expect(session.status).toBe('not_received');
    expect(Array.isArray(session.records)).toBe(true);
    expect(session.records.length).toBeGreaterThan(0);
    expect(session.records.every((r) => r.status === 'present')).toBe(true);
  });

  it('saves new class attendance and recalculates counts accurately', async () => {
    const sampleRecords = [
      { studentId: 'std-401', studentName: 'Tarun Reddy', rollNo: '01', status: 'present', remark: '' },
      { studentId: 'std-402', studentName: 'Beatrice Wanjiku', rollNo: '02', status: 'present', remark: '' },
      { studentId: 'std-403', studentName: 'Vikram Singh', rollNo: '03', status: 'absent', remark: 'Flu' },
      { studentId: 'std-404', studentName: 'Collins Kiprono', rollNo: '04', status: 'present', remark: 'Rain' },
    ];

    const saved = await saveClassAttendance({
      classId: 'class-4b',
      date: today,
      branchId,
      records: sampleRecords,
      submittedBy: 'Head Teacher',
    });

    expect(saved.status).toBe('submitted');
    expect(saved.presentCount).toBe(3);
    expect(saved.absentCount).toBe(1);
    expect(saved.totalStudents).toBe(4);
    expect(saved.submittedBy).toBe('Head Teacher');

    // Confirm it reflects in daily overview
    const overview = await getDailyAttendanceOverview({
      branchId,
      academicYearId: 'ay-2024-2025',
      date: today,
    });

    const updatedClass4B = overview.classes.find((c) => c.classId === 'class-4b');
    expect(updatedClass4B.status).toBe('submitted');
    expect(updatedClass4B.presentCount).toBe(3);
  });

  it('throws INVALID_ATTENDANCE when records are empty', async () => {
    await expect(
      saveClassAttendance({
        classId: 'class-1a',
        date: today,
        branchId,
        records: [],
      }),
    ).rejects.toThrow('At least one student record is required');
  });

  it('generates an attendance report across a date range', async () => {
    const report = await getAttendanceReport({
      branchId,
      academicYearId: 'ay-2024-2025',
      startDate: '2026-10-01',
      endDate: '2026-10-26',
      classId: 'all',
    });

    expect(report).toHaveProperty('summary');
    expect(report.summary.overallRate).toBeGreaterThan(0);
    expect(report.summary.daysCount).toBeGreaterThan(0);
    expect(report.classBreakdown.length).toBe(4);
    expect(Array.isArray(report.dailyBreakdown)).toBe(true);
    expect(report.dailyBreakdown.length).toBeGreaterThan(0);
  });
});

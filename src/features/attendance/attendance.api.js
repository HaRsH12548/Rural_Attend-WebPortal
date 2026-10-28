import { AppError } from '@/lib/errors';
import { db } from '@/mocks/db';
import { simulate } from '@/mocks/delay';
import { getClassStudents } from '@/features/classes/classes.api';

/**
 * Loads the daily attendance overview for all classes in a branch on a given date.
 * @param {{ branchId: string, academicYearId?: string, date: string }} input Query parameters.
 * @returns {Promise<{ date: string, stats: object, classes: Array<object> }>} Attendance summary and class list.
 */
export function getDailyAttendanceOverview({ branchId, academicYearId, date }) {
  return simulate(() => {
    const branchExists = db.branches.some((branch) => branch.id === branchId);
    if (!branchExists) {
      throw new AppError({
        code: 'BRANCH_NOT_FOUND',
        message: 'The assigned branch could not be found.',
      });
    }

    const activeYear = db.academicYears?.find((ay) => ay.branchId === branchId && ay.isActive);
    const targetYearId = academicYearId || activeYear?.id;

    // Filter classes for this branch and academic session
    const branchClasses = db.classes.filter((classroom) => {
      if (classroom.branchId !== branchId) return false;
      return !targetYearId || classroom.academicYearId === targetYearId;
    });

    let totalEnrolled = 0;
    let totalPresent = 0;
    let totalAbsent = 0;
    let classesSubmitted = 0;

    const classSessions = branchClasses.map((classroom) => {
      totalEnrolled += classroom.studentCount || 0;

      const session = (db.attendanceSessions ?? []).find(
        (s) => s.classId === classroom.id && s.date === date,
      );

      if (session && session.status === 'submitted') {
        classesSubmitted += 1;
        totalPresent += session.presentCount || 0;
        totalAbsent += session.absentCount || 0;

        const attendedSum = session.presentCount || 0;
        const rate =
          session.totalStudents > 0
            ? Math.round((attendedSum / session.totalStudents) * 100)
            : 0;

        return {
          classId: classroom.id,
          name: classroom.name,
          grade: classroom.grade,
          section: classroom.section,
          studentCount: classroom.studentCount,
          status: 'submitted',
          presentCount: session.presentCount || 0,
          absentCount: session.absentCount || 0,
          attendanceRate: rate,
          submittedAt: session.submittedAt,
          submittedBy: session.submittedBy,
          sessionId: session.id,
        };
      }

      // Invariant: not_received !== absent
      return {
        classId: classroom.id,
        name: classroom.name,
        grade: classroom.grade,
        section: classroom.section,
        studentCount: classroom.studentCount,
        status: 'not_received',
        presentCount: 0,
        absentCount: 0,
        attendanceRate: null,
        submittedAt: null,
        submittedBy: null,
        sessionId: null,
      };
    });

    const submittedStudentsCount = totalPresent + totalAbsent;
    const overallRate =
      submittedStudentsCount > 0
        ? Math.round((totalPresent / submittedStudentsCount) * 100)
        : 0;

    const stats = {
      totalEnrolled,
      totalPresent,
      totalAbsent,
      overallRate,
      classesSubmitted,
      classesPending: branchClasses.length - classesSubmitted,
      totalClasses: branchClasses.length,
    };

    return {
      date,
      stats,
      classes: classSessions,
    };
  });
}

/**
 * Loads a specific class attendance session for a given date, including all student roll records.
 * @param {{ classId: string, date: string }} input Class and date identifiers.
 * @returns {Promise<object>} Class attendance session with student list.
 */
export async function getClassAttendanceSession({ classId, date }) {
  const classroom = db.classes.find((item) => item.id === classId);
  if (!classroom) {
    throw new AppError({
      code: 'CLASS_NOT_FOUND',
      message: 'The requested class could not be found.',
    });
  }

  const existingSession = (db.attendanceSessions ?? []).find(
    (s) => s.classId === classId && s.date === date,
  );

  if (existingSession) {
    return {
      ...existingSession,
      className: classroom.name,
      grade: classroom.grade,
      section: classroom.section,
    };
  }

  // If no session exists yet, load enrolled students and prepare a fresh roll
  const enrolledStudents = await getClassStudents(classId);

  const defaultRecords = enrolledStudents.map((student, index) => ({
    studentId: student.id,
    studentName: student.name,
    rollNo: student.rollNo ?? String(index + 1).padStart(2, '0'),
    admissionNo: student.admissionNo ?? `ADM-${student.id.slice(-6).toUpperCase()}`,
    status: 'present',
    remark: '',
  }));

  return {
    id: null,
    classId: classroom.id,
    className: classroom.name,
    grade: classroom.grade,
    section: classroom.section,
    date,
    status: 'not_received',
    submittedAt: null,
    submittedBy: null,
    totalStudents: enrolledStudents.length || classroom.studentCount,
    presentCount: enrolledStudents.length,
    absentCount: 0,
    records: defaultRecords,
  };
}

/**
 * Saves or updates student attendance records for a class on a specified date.
 * @param {{
 *   classId: string,
 *   date: string,
 *   branchId: string,
 *   academicYearId?: string,
 *   records: Array<{ studentId: string, studentName: string, status: 'present'|'absent', remark?: string }>,
 *   submittedBy?: string
 * }} input Save payload.
 * @returns {Promise<object>} Saved attendance session.
 */
export function saveClassAttendance({
  classId,
  date,
  branchId,
  academicYearId,
  records,
  submittedBy,
}) {
  return simulate(() => {
    const classroom = db.classes.find((item) => item.id === classId);
    if (!classroom) {
      throw new AppError({
        code: 'CLASS_NOT_FOUND',
        message: 'The requested class could not be found.',
      });
    }

    if (!Array.isArray(records) || records.length === 0) {
      throw new AppError({
        code: 'INVALID_ATTENDANCE',
        message: 'At least one student record is required to submit attendance.',
      });
    }

    const presentCount = records.filter((r) => r.status === 'present').length;
    const absentCount = records.filter((r) => r.status === 'absent').length;
    const totalStudents = records.length;

    const existingIndex = (db.attendanceSessions ?? []).findIndex(
      (s) => s.classId === classId && s.date === date,
    );

    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    const sessionData = {
      id: existingIndex >= 0 ? db.attendanceSessions[existingIndex].id : `att-${classId}-${date}`,
      branchId,
      classId,
      academicYearId: academicYearId || classroom.academicYearId,
      date,
      status: 'submitted',
      submittedAt: formattedTime,
      submittedBy: submittedBy || 'Branch Admin',
      totalStudents,
      presentCount,
      absentCount,
      records: records.map((r, index) => ({
        studentId: r.studentId,
        studentName: r.studentName,
        rollNo: r.rollNo ?? String(index + 1).padStart(2, '0'),
        admissionNo: r.admissionNo,
        status: r.status === 'absent' ? 'absent' : 'present',
        remark: r.remark ?? '',
      })),
    };

    if (existingIndex >= 0) {
      db.attendanceSessions[existingIndex] = sessionData;
    } else {
      if (!db.attendanceSessions) {
        db.attendanceSessions = [];
      }
      db.attendanceSessions.push(sessionData);
    }

    // If date is today, update classroom present count in class card
    const todayStr = new Date().toISOString().split('T')[0];
    if (date === todayStr) {
      classroom.presentToday = presentCount;
    }

    return {
      ...sessionData,
      className: classroom.name,
      grade: classroom.grade,
      section: classroom.section,
    };
  });
}

/**
 * Compiles a comprehensive attendance report for an academic year, month, or custom date range.
 * @param {{
 *   branchId: string,
 *   academicYearId?: string,
 *   startDate: string,
 *   endDate: string,
 *   classId?: string
 * }} input Report query parameters.
 * @returns {Promise<object>} Report compilation result.
 */
export async function getAttendanceReport({
  branchId,
  academicYearId,
  startDate,
  endDate,
  classId = 'all',
}) {
  return simulate(async () => {
    const branchExists = db.branches.some((branch) => branch.id === branchId);
    if (!branchExists) {
      throw new AppError({
        code: 'BRANCH_NOT_FOUND',
        message: 'The assigned branch could not be found.',
      });
    }

    const branch = db.branches.find((b) => b.id === branchId);
    const activeYear = db.academicYears?.find((ay) => ay.branchId === branchId && (academicYearId ? ay.id === academicYearId : ay.isActive));

    // Target classes
    const branchClasses = db.classes.filter((c) => {
      if (c.branchId !== branchId) return false;
      if (academicYearId && c.academicYearId !== academicYearId) return false;
      if (classId && classId !== 'all' && c.id !== classId) return false;
      return true;
    });

    if (branchClasses.length === 0) {
      return {
        branchName: branch?.name ?? 'Branch',
        academicYearName: activeYear?.name ?? 'Current Academic Year',
        period: { startDate, endDate },
        summary: {
          totalPresent: 0,
          totalAbsent: 0,
          overallRate: 0,
          totalEnrolled: 0,
          daysCount: 0,
          sessionsCount: 0,
        },
        classBreakdown: [],
        dailyBreakdown: [],
        studentBreakdown: [],
      };
    }

    // Generate weekdays list within [startDate, endDate]
    const validDates = [];
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);

    const startObj = new Date(startYear, startMonth - 1, startDay);
    const endObj = new Date(endYear, endMonth - 1, endDay);

    const curr = new Date(startObj);
    while (curr <= endObj && validDates.length < 90) {
      const dayOfWeek = curr.getDay();
      // Monday (1) to Friday (5)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        const y = curr.getFullYear();
        const m = String(curr.getMonth() + 1).padStart(2, '0');
        const d = String(curr.getDate()).padStart(2, '0');
        validDates.push(`${y}-${m}-${d}`);
      }
      curr.setDate(curr.getDate() + 1);
    }

    // If no weekdays found (e.g. single weekend day picked), include the exact start date
    if (validDates.length === 0) {
      validDates.push(startDate);
    }

    // Aggregate sessions for all classes over the dates
    const dailyMap = new Map(); // date -> { present, absent, classesCount }
    const classStatsMap = new Map(); // classId -> { present, absent, daysCount }

    branchClasses.forEach((cls) => {
      classStatsMap.set(cls.id, {
        classId: cls.id,
        className: cls.name,
        grade: cls.grade,
        section: cls.section,
        enrolledCount: cls.studentCount || 0,
        presentCount: 0,
        absentCount: 0,
        daysCount: 0,
      });
    });

    validDates.forEach((dateStr) => {
      let dayPresent = 0;
      let dayAbsent = 0;
      let dayClasses = 0;

      branchClasses.forEach((cls) => {
        // Check if an actual submitted session exists in db
        const actualSession = (db.attendanceSessions ?? []).find(
          (s) => s.classId === cls.id && s.date === dateStr && s.status === 'submitted',
        );

        let present = 0;
        let absent = 0;

        if (actualSession) {
          present = actualSession.presentCount || 0;
          absent = actualSession.absentCount || 0;
        } else {
          // Deterministic simulation for realistic report preview
          const total = cls.studentCount || 24;
          const hash = (dateStr.split('-').reduce((acc, v) => acc + Number(v), 0) + cls.id.charCodeAt(cls.id.length - 1)) % 7;
          absent = Math.max(1, Math.round(total * (0.05 + hash * 0.012)));
          present = Math.max(0, total - absent);
        }

        const classStat = classStatsMap.get(cls.id);
        if (classStat) {
          classStat.presentCount += present;
          classStat.absentCount += absent;
          classStat.daysCount += 1;
        }

        dayPresent += present;
        dayAbsent += absent;
        dayClasses += 1;
      });

      const dayTotal = dayPresent + dayAbsent;
      const dayRate = dayTotal > 0 ? Math.round((dayPresent / dayTotal) * 100) : 0;

      dailyMap.set(dateStr, {
        date: dateStr,
        presentCount: dayPresent,
        absentCount: dayAbsent,
        attendanceRate: dayRate,
        classesCount: dayClasses,
      });
    });

    // Compile class breakdown
    let grandTotalPresent = 0;
    let grandTotalAbsent = 0;
    let grandTotalEnrolled = 0;

    const classBreakdown = Array.from(classStatsMap.values()).map((c) => {
      grandTotalPresent += c.presentCount;
      grandTotalAbsent += c.absentCount;
      grandTotalEnrolled += c.enrolledCount;
      const sum = c.presentCount + c.absentCount;
      const attendanceRate = sum > 0 ? Math.round((c.presentCount / sum) * 100) : 0;
      return {
        ...c,
        attendanceRate,
      };
    });

    const overallTotal = grandTotalPresent + grandTotalAbsent;
    const overallRate = overallTotal > 0 ? Math.round((grandTotalPresent / overallTotal) * 100) : 0;

    // Sort daily breakdown descending (most recent date first)
    const dailyBreakdown = Array.from(dailyMap.values()).sort((a, b) => b.date.localeCompare(a.date));

    // Compile student breakdown for selected classes
    const studentBreakdown = [];
    for (const cls of branchClasses) {
      try {
        const students = await getClassStudents(cls.id);
        const days = classStatsMap.get(cls.id)?.daysCount || validDates.length;
        students.forEach((std) => {
          // Deterministic student attendance rate
          const sHash = (std.name.charCodeAt(0) + std.name.charCodeAt(std.name.length - 1)) % 6;
          const absentDays = Math.min(days, Math.max(0, Math.round(days * (sHash * 0.03))));
          const presentDays = Math.max(0, days - absentDays);
          const studentRate = days > 0 ? Math.round((presentDays / days) * 100) : 100;

          studentBreakdown.push({
            studentId: std.id,
            studentName: std.name,
            rollNo: std.rollNo,
            admissionNo: std.admissionNo,
            className: cls.name,
            grade: cls.grade,
            presentDays,
            absentDays,
            totalDays: days,
            attendanceRate: studentRate,
          });
        });
      } catch {
        // Continue if students could not be loaded
      }
    }

    return {
      branchName: branch?.name ?? 'Branch',
      academicYearName: activeYear?.name ?? '2024–2025',
      period: {
        startDate,
        endDate,
        label: `${startDate} to ${endDate}`,
      },
      summary: {
        totalPresent: grandTotalPresent,
        totalAbsent: grandTotalAbsent,
        overallRate,
        totalEnrolled: grandTotalEnrolled,
        daysCount: validDates.length,
        sessionsCount: validDates.length * branchClasses.length,
      },
      classBreakdown,
      dailyBreakdown,
      studentBreakdown,
    };
  });
}

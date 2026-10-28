import { ROLES } from '@/lib/constants';
import { AppError } from '@/lib/errors';
import { db } from '@/mocks/db';
import { simulate } from '@/mocks/delay';

/**
 * Helper to generate a secure, memorable temporary password.
 * @returns {string} Generated temporary password.
 */
function generateTemporaryPassword() {
  const prefixes = ['School', 'Trust', 'Branch', 'Attend', 'Rural', 'Admin'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${prefix}@${num}`;
}

/**
 * Returns today's date formatted as YYYY-MM-DD.
 * @returns {string} YYYY-MM-DD
 */
function getTodayDateString() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Appends a new entry to the in-memory audit logs.
 * @param {object} entry Log parameters.
 */
function recordAuditLog({ organizationId = 'org-rural-trust', branchId, branchName, actorRole = 'SCHOOL_ADMIN', actorName = 'School Admin', action, entityType, entityId, summary }) {
  const newEntry = {
    id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    organizationId,
    branchId: branchId || null,
    branchName: branchName || (branchId ? db.branches.find((b) => b.id === branchId)?.name : null) || null,
    actorId: 'user-school-demo',
    actorName,
    actorRole,
    action,
    entityType,
    entityId,
    summary,
    createdAt: new Date().toISOString(),
  };
  db.auditLogs.unshift(newEntry);
  return newEntry;
}

/**
 * Loads the overall executive overview for School Admin.
 * Aggregates statistics across all branches, today's attendance, and urgent action items.
 * @returns {Promise<object>} School dashboard overview data.
 */
export function getSchoolOverview() {
  return simulate(() => {
    const today = getTodayDateString();
    const branches = db.branches || [];
    const activeBranches = branches.filter((b) => b.status === 'active');
    const allTeachers = db.teachers || [];
    const allUsers = db.users || [];
    const todaySessions = (db.attendanceSessions || []).filter((s) => s.date === today);

    // Active classes across active branches
    const activeClasses = (db.classes || []).filter((c) => {
      const branch = branches.find((b) => b.id === c.branchId);
      if (!branch || branch.status !== 'active') return false;
      const activeYear = (db.academicYears || []).find((ay) => ay.branchId === c.branchId && ay.isActive);
      return !activeYear || c.academicYearId === activeYear.id;
    });

    const totalStudents = activeClasses.reduce((sum, c) => sum + (c.studentCount || 0), 0);
    const totalTeachers = allTeachers.length;

    // Calculate today's submissions and presence
    let submittedClassesCount = 0;
    let totalPresentToday = 0;
    let totalEnrolledInSubmitted = 0;

    activeClasses.forEach((cls) => {
      const session = todaySessions.find((s) => s.classId === cls.id && s.status === 'submitted');
      if (session) {
        submittedClassesCount += 1;
        totalPresentToday += session.presentCount || 0;
        totalEnrolledInSubmitted += (session.presentCount || 0) + (session.absentCount || 0);
      }
    });

    const pendingClassesCount = Math.max(0, activeClasses.length - submittedClassesCount);
    const orgAttendanceRate =
      totalEnrolledInSubmitted > 0
        ? Math.round((totalPresentToday / totalEnrolledInSubmitted) * 1000) / 10
        : 93.8; // Baseline realistic attendance percentage

    const submissionRate =
      activeClasses.length > 0
        ? Math.round((submittedClassesCount / activeClasses.length) * 100)
        : 100;

    // Per-branch summaries
    const branchSummaries = branches.map((branch) => {
      const branchClasses = activeClasses.filter((c) => c.branchId === branch.id);
      const branchTeachers = allTeachers.filter((t) => t.branchId === branch.id);
      const branchAdmin = allUsers.find((u) => u.branchId === branch.id && u.role === ROLES.BRANCH_ADMIN);

      let branchSubmitted = 0;
      let branchPresent = 0;
      let branchTotalEnrolled = 0;

      branchClasses.forEach((cls) => {
        const session = todaySessions.find((s) => s.classId === cls.id && s.status === 'submitted');
        if (session) {
          branchSubmitted += 1;
          branchPresent += session.presentCount || 0;
          branchTotalEnrolled += (session.presentCount || 0) + (session.absentCount || 0);
        }
      });

      const branchStudentCount = branchClasses.reduce((acc, c) => acc + (c.studentCount || 0), 0);
      const branchRate =
        branchTotalEnrolled > 0
          ? Math.round((branchPresent / branchTotalEnrolled) * 1000) / 10
          : branchClasses.length > 0 && branchSubmitted > 0
          ? 94.2
          : null;

      return {
        id: branch.id,
        name: branch.name,
        code: branch.code || 'BR-01',
        location: branch.location || 'Regional Campus',
        description: branch.description,
        status: branch.status || 'active',
        adminName: branchAdmin?.name || 'Unassigned',
        adminEmail: branchAdmin?.email || null,
        classCount: branchClasses.length,
        studentCount: branchStudentCount,
        teacherCount: branchTeachers.length,
        submittedClasses: branchSubmitted,
        pendingClasses: branchClasses.length - branchSubmitted,
        attendanceRate: branchRate,
      };
    });

    // Build urgent action items / alerts
    const alerts = [];
    branchSummaries.forEach((b) => {
      if (b.status === 'active' && b.pendingClasses > 0) {
        alerts.push({
          id: `alert-sub-${b.id}`,
          severity: 'warning',
          branchId: b.id,
          branchName: b.name,
          title: `${b.name} has ${b.pendingClasses} pending class roll(s)`,
          message: `${b.pendingClasses} out of ${b.classCount} classes have not yet submitted attendance past the cutoff time.`,
        });
      }
      if (!b.adminEmail) {
        alerts.push({
          id: `alert-admin-${b.id}`,
          severity: 'info',
          branchId: b.id,
          branchName: b.name,
          title: `No Branch Admin assigned to ${b.name}`,
          message: 'Provision a branch administrator to manage class rosters and teacher credentials.',
        });
      }
    });

    return {
      organization: { ...db.organization },
      kpis: {
        totalStudents,
        totalTeachers,
        totalBranches: branches.length,
        activeBranches: activeBranches.length,
        totalClassesToday: activeClasses.length,
        submittedClassesToday: submittedClassesCount,
        pendingClassesToday: pendingClassesCount,
        orgAttendanceRate,
        submissionRate,
      },
      branchSummaries,
      alerts,
      recentAuditLogs: (db.auditLogs || []).slice(0, 5),
    };
  });
}

/**
 * Loads all branches with resolved statistics and administrator details.
 * @returns {Promise<Array<object>>} List of branch objects.
 */
export function getBranches() {
  return simulate(() => {
    const today = getTodayDateString();
    const todaySessions = (db.attendanceSessions || []).filter((s) => s.date === today);

    return db.branches.map((branch) => {
      const branchClasses = (db.classes || []).filter((c) => {
        if (c.branchId !== branch.id) return false;
        const activeYear = (db.academicYears || []).find((ay) => ay.branchId === branch.id && ay.isActive);
        return !activeYear || c.academicYearId === activeYear.id;
      });

      const branchTeachers = (db.teachers || []).filter((t) => t.branchId === branch.id);
      const branchAdmin = (db.users || []).find(
        (u) => u.branchId === branch.id && u.role === ROLES.BRANCH_ADMIN,
      );

      let branchSubmitted = 0;
      let branchPresent = 0;
      let branchTotalEnrolled = 0;

      branchClasses.forEach((cls) => {
        const session = todaySessions.find((s) => s.classId === cls.id && s.status === 'submitted');
        if (session) {
          branchSubmitted += 1;
          branchPresent += session.presentCount || 0;
          branchTotalEnrolled += (session.presentCount || 0) + (session.absentCount || 0);
        }
      });

      const studentCount = branchClasses.reduce((sum, c) => sum + (c.studentCount || 0), 0);
      const attendanceRate =
        branchTotalEnrolled > 0
          ? Math.round((branchPresent / branchTotalEnrolled) * 1000) / 10
          : branchClasses.length > 0 && branchSubmitted > 0
          ? 94.2
          : null;

      return {
        id: branch.id,
        name: branch.name,
        code: branch.code || 'BR-01',
        location: branch.location || 'Regional Campus',
        description: branch.description || '',
        status: branch.status || 'active',
        createdAt: branch.createdAt || '2024-01-01',
        admin: branchAdmin
          ? {
              id: branchAdmin.id,
              name: branchAdmin.name,
              email: branchAdmin.email,
            }
          : null,
        classCount: branchClasses.length,
        studentCount,
        teacherCount: branchTeachers.length,
        submittedClasses: branchSubmitted,
        pendingClasses: branchClasses.length - branchSubmitted,
        attendanceRate,
      };
    });
  });
}

/**
 * Loads full details of a specific branch for read-only drilldown.
 * @param {string} branchId Target branch ID.
 * @returns {Promise<object>} Complete branch details.
 */
export function getBranchDrilldown(branchId) {
  return simulate(() => {
    const branch = db.branches.find((b) => b.id === branchId);
    if (!branch) {
      throw new AppError({
        code: 'BRANCH_NOT_FOUND',
        message: 'The requested branch could not be found.',
      });
    }

    const activeYear = (db.academicYears || []).find((ay) => ay.branchId === branchId && ay.isActive);
    const classes = (db.classes || []).filter((c) => {
      if (c.branchId !== branchId) return false;
      return !activeYear || c.academicYearId === activeYear.id;
    });

    const teachers = (db.teachers || []).filter((t) => t.branchId === branchId);
    const admin = (db.users || []).find((u) => u.branchId === branchId && u.role === ROLES.BRANCH_ADMIN);

    const today = getTodayDateString();
    const todaySessions = (db.attendanceSessions || []).filter(
      (s) => s.branchId === branchId && s.date === today,
    );

    const classesWithAttendance = classes.map((cls) => {
      const session = todaySessions.find((s) => s.classId === cls.id);
      return {
        ...cls,
        status: session?.status === 'submitted' ? 'submitted' : 'not_received',
        submittedAt: session?.submittedAt || null,
        submittedBy: session?.submittedBy || null,
        presentToday: session?.presentCount ?? null,
        absentToday: session?.absentCount ?? null,
      };
    });

    return {
      branch: { ...branch },
      academicYear: activeYear ? { ...activeYear } : null,
      admin: admin ? { id: admin.id, name: admin.name, email: admin.email } : null,
      teachers: teachers.map((t) => ({ ...t })),
      classes: classesWithAttendance,
    };
  });
}

/**
 * Creates a new branch in the organization and optionally provisions its administrator.
 * When an administrator is provisioned, returns the one-time `IssuedCredentials` slip.
 * @param {object} input Branch creation parameters.
 * @returns {Promise<{ branch: object, issuedCredentials: object|null }>}
 */
export function createBranch({ name, code, location, description, adminName, adminEmail }) {
  return simulate(() => {
    if (!name?.trim()) {
      throw new AppError({
        code: 'INVALID_BRANCH',
        message: 'Branch name is required.',
        fieldErrors: { name: 'Branch name is required.' },
      });
    }

    const branchCode = (code || `BR-${db.branches.length + 1}`).trim().toUpperCase();
    const duplicateCode = db.branches.some((b) => b.code?.toUpperCase() === branchCode);
    if (duplicateCode) {
      throw new AppError({
        code: 'DUPLICATE_BRANCH_CODE',
        message: 'A branch with this code already exists.',
        fieldErrors: { code: 'A branch with this code already exists.' },
      });
    }

    const branchId = `branch-${Date.now()}`;
    const newBranch = {
      id: branchId,
      name: name.trim(),
      code: branchCode,
      location: (location || 'Rural Campus').trim(),
      description: (description || '').trim(),
      status: 'active',
      createdAt: getTodayDateString(),
    };

    db.branches.push(newBranch);

    // Create an initial active academic year for the new branch
    const academicYearId = `ay-${branchId}-${Date.now()}`;
    db.academicYears.push({
      id: academicYearId,
      branchId,
      name: db.organization.academicCycle || '2024–2025',
      startDate: getTodayDateString(),
      endDate: null,
      isActive: true,
    });

    let issuedCredentials = null;

    // Optionally provision Branch Admin
    if (adminEmail?.trim()) {
      const email = adminEmail.trim().toLowerCase();
      const existingUser = db.users.find((u) => u.email.toLowerCase() === email);
      if (existingUser) {
        throw new AppError({
          code: 'DUPLICATE_ADMIN_EMAIL',
          message: 'A user account with this email address already exists.',
          fieldErrors: { adminEmail: 'This email address is already in use.' },
        });
      }

      const temporaryPassword = generateTemporaryPassword();
      const userId = `user-admin-${Date.now()}`;
      const newUser = {
        id: userId,
        name: (adminName || `${name} Admin`).trim(),
        email,
        password: temporaryPassword,
        role: ROLES.BRANCH_ADMIN,
        branchId,
      };

      db.users.push(newUser);

      issuedCredentials = {
        loginId: email,
        temporaryPassword,
        mustChangePassword: true,
        branchName: newBranch.name,
        userName: newUser.name,
        issuedAt: new Date().toISOString(),
      };

      recordAuditLog({
        branchId,
        branchName: newBranch.name,
        action: 'CREDENTIAL_ISSUED',
        entityType: 'User',
        entityId: userId,
        summary: `Provisioned Branch Admin account for ${newUser.name} (${email})`,
      });
    }

    recordAuditLog({
      branchId,
      branchName: newBranch.name,
      action: 'BRANCH_CREATED',
      entityType: 'Branch',
      entityId: branchId,
      summary: `Created new branch "${newBranch.name}" [${newBranch.code}] in ${newBranch.location}`,
    });

    return {
      branch: { ...newBranch },
      issuedCredentials,
    };
  });
}

/**
 * Updates an existing branch's metadata.
 * @param {object} input Branch update payload.
 * @returns {Promise<object>} Updated branch.
 */
export function updateBranch({ branchId, name, code, location, description, status }) {
  return simulate(() => {
    const branch = db.branches.find((b) => b.id === branchId);
    if (!branch) {
      throw new AppError({
        code: 'BRANCH_NOT_FOUND',
        message: 'The requested branch could not be found.',
      });
    }

    if (name?.trim()) branch.name = name.trim();
    if (code?.trim()) branch.code = code.trim().toUpperCase();
    if (location?.trim()) branch.location = location.trim();
    if (description !== undefined) branch.description = description.trim();
    if (status) branch.status = status;

    recordAuditLog({
      branchId,
      branchName: branch.name,
      action: 'BRANCH_UPDATED',
      entityType: 'Branch',
      entityId: branchId,
      summary: `Updated branch information for "${branch.name}"`,
    });

    return { ...branch };
  });
}

/**
 * Toggles a branch's active or inactive status.
 * @param {{ branchId: string }} input
 * @returns {Promise<object>} Updated branch.
 */
export function toggleBranchStatus({ branchId }) {
  return simulate(() => {
    const branch = db.branches.find((b) => b.id === branchId);
    if (!branch) {
      throw new AppError({
        code: 'BRANCH_NOT_FOUND',
        message: 'The requested branch could not be found.',
      });
    }

    const previousStatus = branch.status || 'active';
    branch.status = previousStatus === 'active' ? 'inactive' : 'active';

    recordAuditLog({
      branchId,
      branchName: branch.name,
      action: 'STATUS_CHANGED',
      entityType: 'Branch',
      entityId: branchId,
      summary: `Changed branch status from ${previousStatus} to ${branch.status}`,
    });

    return { ...branch };
  });
}

/**
 * Loads all Branch Admin accounts across the organization.
 * @returns {Promise<Array<object>>} List of branch administrators.
 */
export function getBranchAdmins() {
  return simulate(() => {
    return (db.users || [])
      .filter((u) => u.role === ROLES.BRANCH_ADMIN)
      .map((admin) => {
        const assignedBranch = db.branches.find((b) => b.id === admin.branchId);
        return {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          phone: admin.phone || '+254 700 000 123',
          staffId: admin.staffId || `ADM-${admin.id.slice(-3).toUpperCase()}`,
          designation: 'Branch Administrator',
          branchId: admin.branchId || null,
          branchName: assignedBranch?.name || 'Unassigned',
          branchCode: assignedBranch?.code || null,
          branchStatus: assignedBranch?.status || 'inactive',
          status: admin.status || 'active',
        };
      });
  });
}

/**
 * Provisions a new Branch Admin user and returns the one-time IssuedCredentials slip.
 * @param {{ name: string, email: string, branchId: string, password?: string, phone?: string, staffId?: string }} input
 * @returns {Promise<{ user: object, issuedCredentials: object }>}
 */
export function provisionBranchAdmin({ name, email, branchId, password, phone, staffId }) {
  return simulate(() => {
    if (!name?.trim() || !email?.trim() || !branchId) {
      throw new AppError({
        code: 'INVALID_INPUT',
        message: 'Name, email, and assigned branch are required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      throw new AppError({
        code: 'DUPLICATE_EMAIL',
        message: 'A user account with this email address already exists.',
        fieldErrors: { email: 'This email address is already in use.' },
      });
    }

    const branch = db.branches.find((b) => b.id === branchId);
    if (!branch) {
      throw new AppError({
        code: 'BRANCH_NOT_FOUND',
        message: 'The selected branch does not exist.',
      });
    }

    const temporaryPassword = password?.trim() || generateTemporaryPassword();
    const userId = `user-admin-${Date.now()}`;
    const newUser = {
      id: userId,
      name: name.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || '+254 700 000 123',
      staffId: staffId?.trim() || `ADM-${String(db.users.length + 1).padStart(3, '0')}`,
      password: temporaryPassword,
      role: ROLES.BRANCH_ADMIN,
      branchId,
      status: 'active',
    };

    db.users.push(newUser);

    const issuedCredentials = {
      loginId: normalizedEmail,
      temporaryPassword,
      mustChangePassword: true,
      branchName: branch.name,
      userName: newUser.name,
      issuedAt: new Date().toISOString(),
    };

    recordAuditLog({
      branchId,
      branchName: branch.name,
      action: 'CREDENTIAL_ISSUED',
      entityType: 'User',
      entityId: userId,
      summary: `Provisioned Branch Admin credentials for ${newUser.name} (${normalizedEmail})`,
    });

    return {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        staffId: newUser.staffId,
        designation: 'Branch Administrator',
        branchId: newUser.branchId,
        branchName: branch.name,
        branchCode: branch.code,
        status: newUser.status,
      },
      issuedCredentials,
    };
  });
}

/**
 * Resets a Branch Admin's password to a fresh temporary password and returns the one-time slip.
 * @param {{ userId: string }} input
 * @returns {Promise<{ issuedCredentials: object }>}
 */
export function resetBranchAdminPassword({ userId }) {
  return simulate(() => {
    const user = db.users.find((u) => u.id === userId && u.role === ROLES.BRANCH_ADMIN);
    if (!user) {
      throw new AppError({
        code: 'USER_NOT_FOUND',
        message: 'Branch administrator account could not be found.',
      });
    }

    const temporaryPassword = generateTemporaryPassword();
    user.password = temporaryPassword;

    const branch = db.branches.find((b) => b.id === user.branchId);

    const issuedCredentials = {
      loginId: user.email,
      temporaryPassword,
      mustChangePassword: true,
      branchName: branch?.name || 'Assigned Branch',
      userName: user.name,
      issuedAt: new Date().toISOString(),
    };

    recordAuditLog({
      branchId: user.branchId,
      branchName: branch?.name,
      action: 'PASSWORD_RESET',
      entityType: 'User',
      entityId: user.id,
      summary: `Reset credentials for Branch Admin ${user.name} (${user.email})`,
    });

    return { issuedCredentials };
  });
}

/**
 * Reassigns an existing Branch Admin to a different branch.
 * @param {{ userId: string, branchId: string }} input
 * @returns {Promise<object>} Updated user.
 */
export function reassignBranchAdmin({ userId, branchId }) {
  return simulate(() => {
    const user = db.users.find((u) => u.id === userId && u.role === ROLES.BRANCH_ADMIN);
    if (!user) {
      throw new AppError({
        code: 'USER_NOT_FOUND',
        message: 'Branch administrator account could not be found.',
      });
    }

    const targetBranch = db.branches.find((b) => b.id === branchId);
    if (!targetBranch) {
      throw new AppError({
        code: 'BRANCH_NOT_FOUND',
        message: 'The target branch does not exist.',
      });
    }

    const previousBranchId = user.branchId;
    user.branchId = branchId;

    recordAuditLog({
      branchId,
      branchName: targetBranch.name,
      action: 'ADMIN_REASSIGNED',
      entityType: 'User',
      entityId: user.id,
      summary: `Reassigned admin ${user.name} to "${targetBranch.name}" (from ${previousBranchId || 'none'})`,
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      staffId: user.staffId,
      designation: 'Branch Administrator',
      branchId: user.branchId,
      branchName: targetBranch.name,
      branchCode: targetBranch.code,
      status: user.status || 'active',
    };
  });
}

/**
 * Updates an existing Branch Admin's profile and assignments.
 * @param {{ id: string, name?: string, email?: string, phone?: string, staffId?: string, branchId?: string, status?: string }} input
 * @returns {Promise<object>} Updated admin user.
 */
export function updateBranchAdmin({ id, name, email, phone, staffId, branchId, status }) {
  return simulate(() => {
    const user = db.users.find((u) => u.id === id && u.role === ROLES.BRANCH_ADMIN);
    if (!user) {
      throw new AppError({
        code: 'USER_NOT_FOUND',
        message: 'Branch administrator account could not be found.',
      });
    }

    if (name?.trim()) user.name = name.trim();
    if (email?.trim()) user.email = email.trim().toLowerCase();
    if (phone?.trim()) user.phone = phone.trim();
    if (staffId?.trim()) user.staffId = staffId.trim();
    if (status) user.status = status;

    let branchName = 'Unassigned';
    let branchCode = null;
    if (branchId) {
      const branch = db.branches.find((b) => b.id === branchId);
      if (branch) {
        user.branchId = branchId;
        branchName = branch.name;
        branchCode = branch.code;
      }
    }

    recordAuditLog({
      branchId: user.branchId,
      branchName,
      action: 'ADMIN_UPDATED',
      entityType: 'User',
      entityId: user.id,
      summary: `Updated administrator profile for ${user.name} (${user.email})`,
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      staffId: user.staffId,
      designation: 'Branch Administrator',
      branchId: user.branchId,
      branchName,
      branchCode,
      status: user.status || 'active',
    };
  });
}

/**
 * Loads organization-wide attendance analytics and class-level roster for a selected date.
 * Strictly maintains Invariant 1: not_received != absent!
 * @param {{ date?: string, branchId?: string }} params
 * @returns {Promise<object>} Attendance analytics dataset.
 */
export function getSchoolAttendanceAnalytics({ date, branchId } = {}) {
  return simulate(() => {
    const targetDate = date || getTodayDateString();
    const branches = db.branches || [];
    const filteredBranches = branchId && branchId !== 'all' ? branches.filter((b) => b.id === branchId) : branches;

    const sessions = (db.attendanceSessions || []).filter((s) => s.date === targetDate);

    // Active classes for the target branches
    const targetClasses = (db.classes || []).filter((c) => {
      const b = filteredBranches.find((br) => br.id === c.branchId);
      if (!b || b.status !== 'active') return false;
      const activeYear = (db.academicYears || []).find((ay) => ay.branchId === c.branchId && ay.isActive);
      return !activeYear || c.academicYearId === activeYear.id;
    });

    let totalStudents = 0;
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalSubmittedClasses = 0;
    let totalNotReceivedClasses = 0;

    const classRecords = targetClasses.map((cls) => {
      const branch = branches.find((b) => b.id === cls.branchId);
      const session = sessions.find((s) => s.classId === cls.id);
      const assignedTeachers = (db.teachers || []).filter(
        (t) => t.branchId === cls.branchId && t.allottedClassIds?.includes(cls.id),
      );

      totalStudents += cls.studentCount || 0;

      if (session && session.status === 'submitted') {
        totalSubmittedClasses += 1;
        totalPresent += session.presentCount || 0;
        totalAbsent += session.absentCount || 0;

        const rate =
          session.totalStudents > 0
            ? Math.round((session.presentCount / session.totalStudents) * 1000) / 10
            : 0;

        return {
          id: cls.id,
          name: cls.name,
          grade: cls.grade,
          section: cls.section,
          branchId: cls.branchId,
          branchName: branch?.name || 'Unknown Branch',
          branchCode: branch?.code || 'BR',
          studentCount: cls.studentCount,
          teacherName: assignedTeachers.map((t) => t.name).join(', ') || 'Unassigned',
          status: 'submitted',
          submittedAt: session.submittedAt || '08:30',
          submittedBy: session.submittedBy || 'Class Teacher',
          presentCount: session.presentCount,
          absentCount: session.absentCount,
          attendanceRate: rate,
        };
      }

      // Not submitted yet — strictly not_received, NEVER absent!
      totalNotReceivedClasses += 1;
      return {
        id: cls.id,
        name: cls.name,
        grade: cls.grade,
        section: cls.section,
        branchId: cls.branchId,
        branchName: branch?.name || 'Unknown Branch',
        branchCode: branch?.code || 'BR',
        studentCount: cls.studentCount,
        teacherName: assignedTeachers.map((t) => t.name).join(', ') || 'Unassigned',
        status: 'not_received',
        submittedAt: null,
        submittedBy: null,
        presentCount: null,
        absentCount: null,
        attendanceRate: null,
      };
    });

    const enrolledInSubmitted = totalPresent + totalAbsent;
    const overallRate =
      enrolledInSubmitted > 0
        ? Math.round((totalPresent / enrolledInSubmitted) * 1000) / 10
        : null;

    // Per branch breakdown
    const branchBreakdown = filteredBranches.map((branch) => {
      const branchClasses = classRecords.filter((r) => r.branchId === branch.id);
      const submitted = branchClasses.filter((r) => r.status === 'submitted');
      const notReceived = branchClasses.filter((r) => r.status === 'not_received');

      const bPresent = submitted.reduce((sum, r) => sum + (r.presentCount || 0), 0);
      const bAbsent = submitted.reduce((sum, r) => sum + (r.absentCount || 0), 0);
      const bTotal = bPresent + bAbsent;
      const bRate = bTotal > 0 ? Math.round((bPresent / bTotal) * 1000) / 10 : null;

      const adminUser = (db.users || []).find(
        (u) => u.branchId === branch.id && u.role === ROLES.BRANCH_ADMIN,
      );

      const bTotalStudents = branchClasses.reduce((sum, c) => sum + (c.studentCount || 0), 0);

      return {
        branchId: branch.id,
        branchName: branch.name,
        branchCode: branch.code,
        adminName: adminUser?.name || 'Branch Administrator',
        totalClasses: branchClasses.length,
        submittedClasses: submitted.length,
        notReceivedClasses: notReceived.length,
        totalStudents: bTotalStudents,
        presentCount: bPresent,
        absentCount: bAbsent,
        attendanceRate: bRate,
        status:
          notReceived.length === 0 && branchClasses.length > 0
            ? 'submitted'
            : submitted.length > 0
              ? 'partial'
              : 'not_received',
        classes: branchClasses,
      };
    });

    return {
      date: targetDate,
      summary: {
        totalClasses: targetClasses.length,
        submittedClasses: totalSubmittedClasses,
        notReceivedClasses: totalNotReceivedClasses,
        submissionPercentage:
          targetClasses.length > 0
            ? Math.round((totalSubmittedClasses / targetClasses.length) * 100)
            : 0,
        totalStudents,
        totalPresent,
        totalAbsent,
        overallRate,
      },
      branchBreakdown,
      classRecords,
    };
  });
}

/**
 * Loads the append-only organization audit logs with optional filtering.
 * @param {{ limit?: number, action?: string, search?: string }} options
 * @returns {Promise<Array<object>>} Filtered audit logs.
 */
export function getAuditLogs({ limit = 50, action = 'all', search = '' } = {}) {
  return simulate(() => {
    let logs = [...(db.auditLogs || [])];

    if (action !== 'all') {
      logs = logs.filter((log) => log.action === action);
    }

    if (search?.trim()) {
      const q = search.toLowerCase().trim();
      logs = logs.filter(
        (log) =>
          log.summary?.toLowerCase().includes(q) ||
          log.actorName?.toLowerCase().includes(q) ||
          log.branchName?.toLowerCase().includes(q) ||
          log.action?.toLowerCase().includes(q),
      );
    }

    return logs.slice(0, limit);
  });
}

/**
 * Loads organization-level profile and policy settings.
 * @returns {Promise<object>} Organization settings.
 */
export function getOrganizationSettings() {
  return simulate(() => {
    return { ...db.organization };
  });
}

/**
 * Updates organization-level profile and policy settings.
 * @param {object} updates
 * @returns {Promise<object>} Updated settings.
 */
export function updateOrganizationSettings(updates) {
  return simulate(() => {
    db.organization = {
      ...db.organization,
      ...updates,
    };

    recordAuditLog({
      action: 'SETTINGS_UPDATED',
      entityType: 'Organization',
      entityId: db.organization.id,
      summary: `Updated organization settings and operational parameters`,
    });

    return { ...db.organization };
  });
}

/**
 * Updates a single branch's profile details.
 * @param {string} branchId - The branch to update.
 * @param {{ name?: string, code?: string, location?: string, description?: string, status?: string }} updates
 * @returns {Promise<object>} Updated branch record.
 */
export function updateBranchProfile(branchId, updates) {
  return simulate(() => {
    const idx = (db.branches || []).findIndex((b) => b.id === branchId);
    if (idx === -1) throw new AppError('BRANCH_NOT_FOUND', 'Branch not found.');

    db.branches[idx] = { ...db.branches[idx], ...updates };

    recordAuditLog({
      branchId,
      action: 'BRANCH_PROFILE_UPDATED',
      entityType: 'Branch',
      entityId: branchId,
      summary: `Updated branch profile for ${db.branches[idx].name}`,
    });

    return { ...db.branches[idx] };
  });
}

/**
 * Loads distinct academic years across the organization.
 * @returns {Promise<Array<object>>} List of academic years.
 */
export function getSchoolAcademicYears() {
  return simulate(() => {
    const yearsMap = new Map();
    const orgCycle = db.organization?.academicCycle || '2024–2025';

    (db.academicYears || []).forEach((ay) => {
      if (!yearsMap.has(ay.name)) {
        yearsMap.set(ay.name, {
          id: ay.id,
          name: ay.name,
          startDate: ay.startDate,
          endDate: ay.endDate,
          isActive: ay.name === orgCycle || Boolean(ay.isActive),
        });
      } else {
        const existing = yearsMap.get(ay.name);
        if (ay.isActive || ay.name === orgCycle) {
          existing.isActive = true;
        }
      }
    });

    if (!yearsMap.has(orgCycle)) {
      yearsMap.set(orgCycle, {
        id: `ay-org-${orgCycle}`,
        name: orgCycle,
        startDate: '2024-06-01',
        endDate: null,
        isActive: true,
      });
    }

    return Array.from(yearsMap.values()).sort((a, b) => (b.startDate > a.startDate ? 1 : -1));
  });
}

/**
 * Starts a new organization-wide academic year/cycle.
 * @param {{ name: string, startDate: string }} input
 * @returns {Promise<object>} Created academic year.
 */
export function createSchoolAcademicYear({ name, startDate }) {
  return simulate(() => {
    const trimmedName = (name ?? '').trim();
    const trimmedStartDate = (startDate ?? '').trim();

    if (!trimmedName) {
      throw new AppError({
        code: 'INVALID_ACADEMIC_YEAR',
        message: 'Academic year name is required (e.g. 2025–2026).',
      });
    }

    if (!trimmedStartDate || !/^\d{4}-\d{2}-\d{2}$/.test(trimmedStartDate)) {
      throw new AppError({
        code: 'INVALID_START_DATE',
        message: 'A valid start date is required (YYYY-MM-DD).',
      });
    }

    const exists = (db.academicYears || []).some(
      (ay) => ay.name.toLowerCase() === trimmedName.toLowerCase(),
    );
    if (exists) {
      throw new AppError({
        code: 'DUPLICATE_ACADEMIC_YEAR',
        message: `Academic year "${trimmedName}" already exists.`,
      });
    }

    const startDateObj = new Date(trimmedStartDate);
    const dayBefore = new Date(startDateObj);
    dayBefore.setDate(dayBefore.getDate() - 1);
    const calculatedEndDate = dayBefore.toISOString().split('T')[0];

    (db.academicYears || []).forEach((ay) => {
      if (ay.isActive) {
        ay.isActive = false;
        ay.endDate = calculatedEndDate;
      }
    });

    if (db.organization) {
      db.organization.academicCycle = trimmedName;
    }

    const newYearId = `ay-school-${Date.now()}`;
    const newYear = {
      id: newYearId,
      branchId: 'all',
      name: trimmedName,
      startDate: trimmedStartDate,
      endDate: null,
      isActive: true,
    };
    db.academicYears.push(newYear);

    (db.branches || []).forEach((b) => {
      db.academicYears.push({
        id: `ay-${b.id}-${Date.now()}`,
        branchId: b.id,
        name: trimmedName,
        startDate: trimmedStartDate,
        endDate: null,
        isActive: true,
      });
    });

    recordAuditLog({
      action: 'ACADEMIC_CYCLE_CREATED',
      entityType: 'AcademicYear',
      entityId: newYearId,
      summary: `Started new academic cycle ${trimmedName} effective ${trimmedStartDate}`,
    });

    return newYear;
  });
}

export { getAttendanceReport, getAttendanceReport as getSchoolAttendanceReport } from '@/features/attendance/attendance.api';


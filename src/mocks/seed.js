import { ROLES } from '@/lib/constants';

export const seededUsers = [
  {
    id: 'user-school-demo',
    name: 'School Admin',
    email: 'school@demo.com',
    password: 'demo123',
    role: ROLES.SCHOOL_ADMIN,
  },
  {
    id: 'user-branch-demo',
    name: 'Branch Admin',
    email: 'branch@demo.com',
    password: 'demo123',
    role: ROLES.BRANCH_ADMIN,
    branchId: 'branch-demo',
  },
  {
    id: 'user-teacher-aditi',
    name: 'Mrs. Aditi Rao',
    email: 'aditi.rao@school.demo',
    password: 'password123',
    role: ROLES.TEACHER,
    branchId: 'branch-demo',
    teacherId: 'teacher-101',
  },
  {
    id: 'user-teacher-joseph',
    name: 'Mr. Joseph Mwangi',
    email: 'joseph.mwangi@school.demo',
    password: 'password123',
    role: ROLES.TEACHER,
    branchId: 'branch-demo',
    teacherId: 'teacher-102',
  },
  {
    id: 'user-teacher-beatrice',
    name: 'Ms. Beatrice Kemboi',
    email: 'beatrice.kemboi@school.demo',
    password: 'password123',
    role: ROLES.TEACHER,
    branchId: 'branch-demo',
    teacherId: 'teacher-103',
  },
];

export const seededTeachers = [
  {
    id: 'teacher-101',
    branchId: 'branch-demo',
    userId: 'user-teacher-aditi',
    name: 'Mrs. Aditi Rao',
    email: 'aditi.rao@school.demo',
    phone: '+254 712 345 678',
    staffId: 'TCH-001',
    designation: 'Class Teacher',
    allottedClassIds: ['class-1a'],
    status: 'active',
    password: 'password123',
    createdAt: '2024-06-01',
  },
  {
    id: 'teacher-102',
    branchId: 'branch-demo',
    userId: 'user-teacher-joseph',
    name: 'Mr. Joseph Mwangi',
    email: 'joseph.mwangi@school.demo',
    phone: '+254 722 456 789',
    staffId: 'TCH-002',
    designation: 'Class Teacher',
    allottedClassIds: ['class-2b'],
    status: 'active',
    password: 'password123',
    createdAt: '2024-06-01',
  },
  {
    id: 'teacher-103',
    branchId: 'branch-demo',
    userId: 'user-teacher-beatrice',
    name: 'Ms. Beatrice Kemboi',
    email: 'beatrice.kemboi@school.demo',
    phone: '+254 733 567 890',
    staffId: 'TCH-003',
    designation: 'Subject Teacher',
    allottedClassIds: ['class-3a'],
    status: 'active',
    password: 'password123',
    createdAt: '2024-06-01',
  },
];

export const seededBranches = [
  {
    id: 'branch-demo',
    name: 'North Rift branch',
    description: 'Assigned branch',
  },
];

export const seededAcademicYears = [
  {
    id: 'ay-2023-2024',
    branchId: 'branch-demo',
    name: '2023–2024',
    startDate: '2023-06-01',
    endDate: '2024-05-31',
    isActive: false,
  },
  {
    id: 'ay-2024-2025',
    branchId: 'branch-demo',
    name: '2024–2025',
    startDate: '2024-06-01',
    endDate: null,
    isActive: true,
  },
];

export const seededClasses = [
  // 2024-2025 (Active Session)
  { id: 'class-1a', branchId: 'branch-demo', academicYearId: 'ay-2024-2025', name: 'Class 1A', grade: 'Class 1', section: 'A', studentCount: 36, presentToday: 32 },
  { id: 'class-2b', branchId: 'branch-demo', academicYearId: 'ay-2024-2025', name: 'Class 2B', grade: 'Class 2', section: 'B', studentCount: 30, presentToday: 27 },
  { id: 'class-3a', branchId: 'branch-demo', academicYearId: 'ay-2024-2025', name: 'Class 3A', grade: 'Class 3', section: 'A', studentCount: 22, presentToday: 20 },
  { id: 'class-4b', branchId: 'branch-demo', academicYearId: 'ay-2024-2025', name: 'Class 4B', grade: 'Class 4', section: 'B', studentCount: 17, presentToday: 14 },

  // 2023-2024 (Archived Session)
  { id: 'class-archived-1a', branchId: 'branch-demo', academicYearId: 'ay-2023-2024', name: 'Class 1A', grade: 'Class 1', section: 'A', studentCount: 32, presentToday: 28 },
  { id: 'class-archived-2a', branchId: 'branch-demo', academicYearId: 'ay-2023-2024', name: 'Class 2A', grade: 'Class 2', section: 'A', studentCount: 28, presentToday: 25 },
];

export const seededStudents = [];

export const seededBranchDashboardStats = [
  { id: 'present-today', branchId: 'branch-demo', label: 'Present today', value: '1,284', delta: '+8.2%', tone: 'positive' },
  { id: 'total-enrolled', branchId: 'branch-demo', label: 'Enrolled students', value: '1,360', delta: '+4.2%', tone: 'positive' },
  { id: 'absences', branchId: 'branch-demo', label: 'Absences', value: '76', delta: '-5.3%', tone: 'positive' },
  { id: 'attendance-rate', branchId: 'branch-demo', label: 'Attendance rate', value: '94.4%', delta: '+1.1%', tone: 'positive' },
];

export const seededBranchActionItems = [
  { id: 'attendance-follow-up', branchId: 'branch-demo', title: 'Attendance follow-up', meta: '7 classes need action', badge: '3 urgent', tone: 'warning' },
  { id: 'parent-notices', branchId: 'branch-demo', title: 'Parent notices', meta: '12 messages queued', badge: 'New', tone: 'info' },
  { id: 'staff-roster-sync', branchId: 'branch-demo', title: 'Staff roster sync', meta: '2 class updates pending', badge: 'Review', tone: 'neutral' },
];

export const seededAttendanceSessions = [
  {
    id: 'att-class-1a-today',
    branchId: 'branch-demo',
    classId: 'class-1a',
    academicYearId: 'ay-2024-2025',
    date: new Date().toISOString().split('T')[0],
    status: 'submitted',
    submittedAt: '08:30',
    submittedBy: 'Mrs. Aditi Rao (Class Teacher)',
    totalStudents: 36,
    presentCount: 33,
    absentCount: 3,
    records: [
      { studentId: 'std-101', studentName: 'Asha Patel', rollNo: '01', status: 'present', remark: '' },
      { studentId: 'std-102', studentName: 'Ravi Kumar', rollNo: '02', status: 'present', remark: '' },
      { studentId: 'std-103', studentName: 'Samira Khan', rollNo: '03', status: 'present', remark: '' },
      { studentId: 'std-104', studentName: 'David Ochieng', rollNo: '04', status: 'present', remark: '' },
      { studentId: 'std-105', studentName: 'Faith Mwangi', rollNo: '05', status: 'absent', remark: 'Sick leave' },
      { studentId: 'std-106', studentName: 'Kavita Rao', rollNo: '06', status: 'present', remark: '' },
      { studentId: 'std-107', studentName: 'Emmanuel Kiprop', rollNo: '07', status: 'present', remark: '' },
      { studentId: 'std-108', studentName: 'Grace Njeri', rollNo: '08', status: 'absent', remark: 'Unexcused' },
      { studentId: 'std-109', studentName: 'Arjun Mehta', rollNo: '09', status: 'present', remark: 'Bus delay excused' },
      { studentId: 'std-110', studentName: 'Brian Otieno', rollNo: '10', status: 'present', remark: '' },
    ],
  },
  {
    id: 'att-class-2b-today',
    branchId: 'branch-demo',
    classId: 'class-2b',
    academicYearId: 'ay-2024-2025',
    date: new Date().toISOString().split('T')[0],
    status: 'submitted',
    submittedAt: '08:45',
    submittedBy: 'Mr. Joseph Mwangi',
    totalStudents: 30,
    presentCount: 28,
    absentCount: 2,
    records: [
      { studentId: 'std-201', studentName: 'Ananya Sharma', rollNo: '01', status: 'present', remark: '' },
      { studentId: 'std-202', studentName: 'Dennis Kimutai', rollNo: '02', status: 'present', remark: '' },
      { studentId: 'std-203', studentName: 'Pooja Verma', rollNo: '03', status: 'absent', remark: 'Family travel' },
      { studentId: 'std-204', studentName: 'Kevin Wekesa', rollNo: '04', status: 'present', remark: '' },
      { studentId: 'std-205', studentName: 'Mercy Chebet', rollNo: '05', status: 'present', remark: '' },
      { studentId: 'std-206', studentName: 'Rohan Gupta', rollNo: '06', status: 'present', remark: 'Excused' },
      { studentId: 'std-207', studentName: 'Sharon Achieng', rollNo: '07', status: 'present', remark: '' },
      { studentId: 'std-208', studentName: 'Victor Korir', rollNo: '08', status: 'absent', remark: '' },
    ],
  },
  {
    id: 'att-class-3a-today',
    branchId: 'branch-demo',
    classId: 'class-3a',
    academicYearId: 'ay-2024-2025',
    date: new Date().toISOString().split('T')[0],
    status: 'submitted',
    submittedAt: '09:05',
    submittedBy: 'Ms. Beatrice Kemboi',
    totalStudents: 22,
    presentCount: 20,
    absentCount: 2,
    records: [
      { studentId: 'std-301', studentName: 'Deepak Joshi', rollNo: '01', status: 'present', remark: '' },
      { studentId: 'std-302', studentName: 'Lilian Muthoni', rollNo: '02', status: 'present', remark: '' },
      { studentId: 'std-303', studentName: 'Sneha Kulkarni', rollNo: '03', status: 'present', remark: '' },
      { studentId: 'std-304', studentName: 'Peter Kamau', rollNo: '04', status: 'absent', remark: 'Medical appointment' },
      { studentId: 'std-305', studentName: 'Neha Nair', rollNo: '05', status: 'present', remark: '' },
      { studentId: 'std-306', studentName: 'Stephen Mutua', rollNo: '06', status: 'present', remark: '' },
    ],
  },
  {
    id: 'att-archived-1a-past',
    branchId: 'branch-demo',
    classId: 'class-archived-1a',
    academicYearId: 'ay-2023-2024',
    date: '2024-05-30',
    status: 'submitted',
    submittedAt: '08:30',
    submittedBy: 'Mrs. Aditi Rao',
    totalStudents: 32,
    presentCount: 28,
    absentCount: 4,
    records: [
      { studentId: 'std-arch-1', studentName: 'Asha Patel', rollNo: '01', status: 'present', remark: '' },
      { studentId: 'std-arch-2', studentName: 'Ravi Kumar', rollNo: '02', status: 'present', remark: '' },
      { studentId: 'std-arch-3', studentName: 'Grace Njeri', rollNo: '03', status: 'absent', remark: '' },
    ],
  },
];

import {
  users,
  companies,
  departments,
  employees,
  attendance,
  leaveTypes,
  leaveRequests,
  salaryComponents,
  employeeSalaryComponents,
  payroll,
  documents,
  reimbursements,
  performanceReviews,
  jobs,
  jobApplications,
  rewardWallet,
  aiInsights,
  localAuth,
  type User,
  type UpsertUser,
  type Company,
  type Employee,
  type InsertEmployee,
  type Attendance,
  type InsertAttendance,
  type LeaveRequest,
  type InsertLeaveRequest,
  type Payroll,
  type InsertPayroll,
  type Document,
  type InsertDocument,
  type Reimbursement,
  type InsertReimbursement,
  type PerformanceReview,
  type InsertPerformanceReview,
  type Job,
  type InsertJob,
  type JobApplication,
  type InsertJobApplication,
  type RewardWallet,
  type AIInsight,
  type SalaryComponent,
  type InsertSalaryComponent,
  type EmployeeSalaryComponent,
  type InsertEmployeeSalaryComponent,
  type LocalAuth,
  type HRLoginInput,
  type EmployeeLoginInput,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Local authentication operations
  authenticateHR(email: string, password: string): Promise<LocalAuth | null>;
  authenticateEmployee(employeeId: string, password: string): Promise<LocalAuth | null>;
  createAuthUser(data: { email: string; password: string; role: "admin" | "hr" | "employee"; employeeId?: string; companyId: string }): Promise<LocalAuth>;
  updateLastLogin(id: number): Promise<void>;
  
  // Dashboard operations
  getDashboardStats(companyId: string): Promise<any>;
  getRecentActivities(companyId: string): Promise<any[]>;
  getAIInsights(companyId: string): Promise<AIInsight[]>;
  generateAIInsights(companyId: string): Promise<AIInsight[]>;
  
  // Employee operations
  getEmployees(companyId: string): Promise<Employee[]>;
  getEmployee(id: number): Promise<Employee | undefined>;
  getEmployeeById(id: number): Promise<Employee | undefined>;
  getEmployeeByEmployeeId(employeeId: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, data: Partial<InsertEmployee>): Promise<Employee>;
  deleteEmployee(id: number): Promise<void>;
  
  // Attendance operations
  getAttendance(companyId: string, date?: string, employeeId?: number): Promise<Attendance[]>;
  getAttendanceByDate(date: string): Promise<Attendance[]>;
  getEmployeeAttendanceByDate(employeeId: string, date: string): Promise<Attendance | null>;
  getAttendanceById(id: number): Promise<Attendance | null>;
  createAttendance(data: any): Promise<Attendance>;
  updateAttendance(id: number, data: any): Promise<Attendance>;
  checkIn(data: InsertAttendance): Promise<Attendance>;
  checkOut(id: number, data: { checkOut: Date; checkOutLocation?: any; checkOutPhoto?: string }): Promise<Attendance>;
  
  // Leave operations
  getLeaveRequests(companyId: string): Promise<LeaveRequest[]>;
  getLeaveRequestById(id: number): Promise<LeaveRequest | undefined>;
  createLeaveRequest(data: InsertLeaveRequest): Promise<LeaveRequest>;
  approveLeaveRequest(id: number, approvedBy: string): Promise<LeaveRequest>;
  rejectLeaveRequest(id: number, approvedBy: string, reason: string): Promise<LeaveRequest>;
  
  // Payroll operations
  getPayroll(companyId: string, period?: string): Promise<Payroll[]>;
  calculatePayroll(companyId: string, period: string, employeeId?: number): Promise<Payroll[]>;
  generatePayslip(id: number): Promise<string>;
  
  // Document operations
  getDocuments(companyId: string): Promise<Document[]>;
  createDocument(data: InsertDocument): Promise<Document>;
  updateDocumentStatus(id: number, signed: boolean, signedBy?: string): Promise<Document>;
  
  // Reimbursement operations
  getReimbursements(companyId: string): Promise<Reimbursement[]>;
  createReimbursement(data: InsertReimbursement): Promise<Reimbursement>;
  approveReimbursement(id: number, approvedBy: string): Promise<Reimbursement>;
  rejectReimbursement(id: number, approvedBy: string, reason: string): Promise<Reimbursement>;
  
  // Performance operations
  getPerformanceReviews(companyId: string): Promise<PerformanceReview[]>;
  createPerformanceReview(data: InsertPerformanceReview): Promise<PerformanceReview>;
  updatePerformanceReview(id: number, data: Partial<InsertPerformanceReview>): Promise<PerformanceReview>;
  
  // Recruitment operations
  getJobs(companyId: string): Promise<Job[]>;
  createJob(data: InsertJob): Promise<Job>;
  updateJob(id: number, data: Partial<InsertJob>): Promise<Job>;
  deleteJob(id: number): Promise<void>;
  getJobApplications(companyId: string): Promise<JobApplication[]>;
  getJobApplication(id: number): Promise<JobApplication | undefined>;
  createJobApplication(data: InsertJobApplication): Promise<JobApplication>;
  updateJobApplication(id: number, data: Partial<InsertJobApplication>): Promise<JobApplication>;
  deleteJobApplication(id: number): Promise<void>;
  
  // AI Matching operations
  analyzeApplicantJobMatch(applicationId: number): Promise<JobApplication>;
  
  // Document operations for applicants
  getApplicantDocuments(applicationId: number): Promise<ApplicantDocument[]>;
  createApplicantDocument(data: InsertApplicantDocument): Promise<ApplicantDocument>;
  deleteApplicantDocument(id: number): Promise<void>;
  
  // Interview operations
  getInterviewSchedules(companyId: string): Promise<InterviewSchedule[]>;
  getApplicationInterviews(applicationId: number): Promise<InterviewSchedule[]>;
  createInterviewSchedule(data: InsertInterviewSchedule): Promise<InterviewSchedule>;
  updateInterviewSchedule(id: number, data: Partial<InsertInterviewSchedule>): Promise<InterviewSchedule>;
  deleteInterviewSchedule(id: number): Promise<void>;
  
  // Salary Component operations
  getSalaryComponents(companyId: string): Promise<SalaryComponent[]>;
  createSalaryComponent(data: InsertSalaryComponent): Promise<SalaryComponent>;
  updateSalaryComponent(id: number, data: Partial<InsertSalaryComponent>): Promise<SalaryComponent>;
  deleteSalaryComponent(id: number): Promise<void>;
  
  // Employee Salary Component operations
  getEmployeeSalaryComponents(employeeId: number): Promise<EmployeeSalaryComponent[]>;
  setEmployeeSalaryComponent(data: InsertEmployeeSalaryComponent): Promise<EmployeeSalaryComponent>;
  updateEmployeeSalaryComponent(id: number, data: Partial<InsertEmployeeSalaryComponent>): Promise<EmployeeSalaryComponent>;
  deleteEmployeeSalaryComponent(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Local authentication operations
  async authenticateHR(email: string, password: string): Promise<LocalAuth | null> {
    try {
      console.log('HR authentication attempt for:', email);
      const bcrypt = await import('bcryptjs');
      const [auth] = await db
        .select()
        .from(localAuth)
        .where(and(
          eq(localAuth.email, email),
          eq(localAuth.isActive, true),
          sql`${localAuth.role} IN ('hr', 'admin')`
        ));
      
      console.log('Found auth record:', auth ? 'yes' : 'no');
      
      if (!auth) {
        console.log('No auth record found for email:', email);
        return null;
      }
      
      const passwordMatch = await bcrypt.compare(password, auth.password);
      console.log('Password match:', passwordMatch);
      
      if (!passwordMatch) {
        console.log('Password mismatch for email:', email);
        return null;
      }
      
      await this.updateLastLogin(auth.id);
      console.log('HR authentication successful for:', email);
      return auth;
    } catch (error) {
      console.error('HR authentication error:', error);
      return null;
    }
  }

  async authenticateEmployee(employeeId: string, password: string): Promise<LocalAuth | null> {
    const bcrypt = await import('bcryptjs');
    const [auth] = await db
      .select()
      .from(localAuth)
      .where(and(
        eq(localAuth.employeeId, employeeId),
        eq(localAuth.isActive, true),
        eq(localAuth.role, 'employee')
      ));
    
    if (!auth || !await bcrypt.compare(password, auth.password)) {
      return null;
    }
    
    await this.updateLastLogin(auth.id);
    return auth;
  }

  async createAuthUser(data: { email: string; password: string; role: "admin" | "hr" | "employee"; employeeId?: string; companyId: string }): Promise<LocalAuth> {
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    const [auth] = await db
      .insert(localAuth)
      .values({
        email: data.email,
        password: hashedPassword,
        role: data.role,
        employeeId: data.employeeId,
        companyId: data.companyId,
      })
      .returning();
    
    return auth;
  }

  async updateLastLogin(id: number): Promise<void> {
    await db
      .update(localAuth)
      .set({ lastLogin: new Date() })
      .where(eq(localAuth.id, id));
  }

  // Dashboard operations
  async getDashboardStats(companyId: string): Promise<any> {
    try {
      // Get total employees
      const totalEmployeesResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(employees)
        .where(eq(employees.companyId, companyId));
      
      const totalEmployees = totalEmployeesResult[0]?.count || 0;

      // Get today's attendance
      const today = new Date().toISOString().split('T')[0];
      const todayAttendanceResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(attendance)
        .innerJoin(employees, eq(attendance.employeeId, employees.id))
        .where(and(
          eq(employees.companyId, companyId),
          eq(attendance.date, today),
          eq(attendance.status, 'present')
        ));
      
      const todayAttendance = todayAttendanceResult[0]?.count || 0;

      // Get pending leaves
      const pendingLeavesResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(leaveRequests)
        .innerJoin(employees, eq(leaveRequests.employeeId, employees.id))
        .where(and(
          eq(employees.companyId, companyId),
          eq(leaveRequests.status, 'pending')
        ));
      
      const pendingLeaves = pendingLeavesResult[0]?.count || 0;

      // Get current month payroll total
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const payrollResult = await db
        .select({ total: sql<string>`sum(net_salary)` })
        .from(payroll)
        .innerJoin(employees, eq(payroll.employeeId, employees.id))
        .where(and(
          eq(employees.companyId, companyId),
          eq(payroll.period, currentMonth)
        ));
      
      const monthlyPayroll = payrollResult[0]?.total || "0";

      return {
        totalEmployees,
        employeeGrowth: "+5 bulan ini",
        todayAttendance,
        attendanceRate: totalEmployees > 0 ? `${((todayAttendance / totalEmployees) * 100).toFixed(1)}% tingkat kehadiran` : "0% tingkat kehadiran",
        pendingLeaves,
        urgentLeaves: "3 perlu persetujuan segera",
        monthlyPayroll: `Rp ${parseFloat(monthlyPayroll).toLocaleString('id-ID')}`,
        payrollStatus: "Siap diproses"
      };
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      return {
        totalEmployees: 0,
        employeeGrowth: "+0 bulan ini",
        todayAttendance: 0,
        attendanceRate: "0% tingkat kehadiran",
        pendingLeaves: 0,
        urgentLeaves: "0 perlu persetujuan segera",
        monthlyPayroll: "Rp 0",
        payrollStatus: "Belum ada data"
      };
    }
  }

  // Employee-specific dashboard stats
  async getEmployeeStats(employeeId: number, companyId: string): Promise<any> {
    try {
      // Get employee data
      const employee = await this.getEmployee(employeeId);
      if (!employee) {
        throw new Error("Employee not found");
      }

      // Get today's attendance for this employee
      const today = new Date().toISOString().split('T')[0];
      const todayAttendanceResult = await db
        .select()
        .from(attendance)
        .where(and(
          eq(attendance.employeeId, employeeId),
          eq(attendance.date, today)
        ));
      
      const todayAttendance = todayAttendanceResult[0];
      const attendanceStatus = todayAttendance ? 
        (todayAttendance.checkOut ? "Sudah Check Out" : "Sedang Bekerja") : 
        "Belum Check In";

      // Get this month's attendance count
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const monthlyAttendanceResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(attendance)
        .where(and(
          eq(attendance.employeeId, employeeId),
          sql`date_part('year', ${attendance.date}) = ${new Date().getFullYear()} AND date_part('month', ${attendance.date}) = ${new Date().getMonth() + 1}`,
          eq(attendance.status, 'present')
        ));
      
      const monthlyAttendance = monthlyAttendanceResult[0]?.count || 0;

      // Get pending leave requests for this employee
      const pendingLeavesResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(leaveRequests)
        .where(and(
          eq(leaveRequests.employeeId, employeeId),
          eq(leaveRequests.status, 'pending')
        ));
      
      const pendingLeaves = pendingLeavesResult[0]?.count || 0;

      // Get current month salary
      const currentPayrollResult = await db
        .select()
        .from(payroll)
        .where(and(
          eq(payroll.employeeId, employeeId),
          eq(payroll.period, currentMonth)
        ));
      
      const currentSalary = currentPayrollResult[0]?.netSalary || "0";

      return {
        employeeName: `${employee.firstName} ${employee.lastName}`,
        employeeId: employee.employeeId,
        todayAttendance: attendanceStatus,
        attendanceIcon: todayAttendance ? (todayAttendance.checkOut ? "✓" : "⏰") : "○",
        monthlyAttendance,
        attendanceRate: `${monthlyAttendance} hari bulan ini`,
        pendingLeaves,
        urgentLeaves: pendingLeaves > 0 ? `${pendingLeaves} menunggu persetujuan` : "Tidak ada",
        monthlyPayroll: `Rp ${parseFloat(currentSalary).toLocaleString('id-ID')}`,
        payrollStatus: currentPayrollResult[0]?.status || "Belum diproses"
      };
    } catch (error) {
      console.error("Error fetching employee dashboard stats:", error);
      return {
        employeeName: "Unknown Employee",
        employeeId: "N/A",
        todayAttendance: "Belum Check In",
        attendanceIcon: "○",
        monthlyAttendance: 0,
        attendanceRate: "0 hari bulan ini",
        pendingLeaves: 0,
        urgentLeaves: "Tidak ada",
        monthlyPayroll: "Rp 0",
        payrollStatus: "Belum ada data"
      };
    }
  }

  async getRecentActivities(companyId: string): Promise<any[]> {
    try {
      // Get recent attendance check-ins
      const recentAttendance = await db
        .select({
          id: sql<string>`CAST(${attendance.id} AS TEXT)`,
          type: sql<string>`'checkin'`,
          title: sql<string>`CONCAT(${employees.firstName}, ' ', ${employees.lastName}, ' telah melakukan check-in')`,
          description: sql<string>`CONCAT('Kantor - ', TO_CHAR(${attendance.checkIn}, 'HH24:MI'), ' WIB')`,
          timestamp: attendance.createdAt,
        })
        .from(attendance)
        .innerJoin(employees, eq(attendance.employeeId, employees.id))
        .where(and(
          eq(employees.companyId, companyId),
          sql`${attendance.checkIn} IS NOT NULL`
        ))
        .orderBy(desc(attendance.createdAt))
        .limit(10);

      return recentAttendance.map(activity => ({
        ...activity,
        timestamp: activity.timestamp?.toISOString() || new Date().toISOString()
      }));
    } catch (error) {
      console.error("Error fetching recent activities:", error);
      return [];
    }
  }

  // Employee-specific recent activities
  async getEmployeeRecentActivities(employeeId: number, companyId: string): Promise<any[]> {
    try {
      // Get employee's recent attendance
      const recentAttendance = await db
        .select({
          id: sql<string>`CAST(${attendance.id} AS TEXT)`,
          type: sql<string>`'attendance'`,
          title: sql<string>`'Absensi Hari Ini'`,
          description: sql<string>`CONCAT('Check-in: ', TO_CHAR(${attendance.checkIn}, 'HH24:MI'), ' WIB')`,
          timestamp: attendance.createdAt,
        })
        .from(attendance)
        .where(eq(attendance.employeeId, employeeId))
        .orderBy(desc(attendance.createdAt))
        .limit(5);

      // Get employee's recent leave requests
      const recentLeaves = await db
        .select({
          id: sql<string>`CAST(${leaveRequests.id} AS TEXT)`,
          type: sql<string>`'leave'`,
          title: sql<string>`'Pengajuan Cuti'`,
          description: sql<string>`CONCAT('Status: ', ${leaveRequests.status})`,
          timestamp: leaveRequests.createdAt,
        })
        .from(leaveRequests)
        .where(eq(leaveRequests.employeeId, employeeId))
        .orderBy(desc(leaveRequests.createdAt))
        .limit(3);

      // Get employee's recent reimbursements
      const recentReimbursements = await db
        .select({
          id: sql<string>`CAST(${reimbursements.id} AS TEXT)`,
          type: sql<string>`'reimbursement'`,
          title: sql<string>`'Pengajuan Reimbursement'`,
          description: sql<string>`CONCAT('Status: ', ${reimbursements.status})`,
          timestamp: reimbursements.createdAt,
        })
        .from(reimbursements)
        .where(eq(reimbursements.employeeId, employeeId))
        .orderBy(desc(reimbursements.createdAt))
        .limit(2);

      // Combine and sort all activities
      const allActivities = [...recentAttendance, ...recentLeaves, ...recentReimbursements]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 8);

      return allActivities.map(activity => ({
        ...activity,
        timestamp: activity.timestamp?.toISOString() || new Date().toISOString()
      }));
    } catch (error) {
      console.error("Error fetching employee recent activities:", error);
      return [];
    }
  }

  async getAIInsights(companyId: string): Promise<AIInsight[]> {
    try {
      const insights = await db
        .select()
        .from(aiInsights)
        .where(eq(aiInsights.companyId, companyId))
        .orderBy(desc(aiInsights.createdAt))
        .limit(5);
      
      return insights;
    } catch (error) {
      console.error("Error fetching AI insights:", error);
      return [];
    }
  }

  async getEmployeePayrollHistory(employeeId: number): Promise<any[]> {
    try {
      const payrollHistory = await db
        .select()
        .from(payroll)
        .where(eq(payroll.employeeId, employeeId))
        .orderBy(desc(payroll.createdAt))
        .limit(12); // Last 12 months

      return payrollHistory;
    } catch (error) {
      console.error("Error fetching employee payroll history:", error);
      return [];
    }
  }

  async getPayrollById(id: number): Promise<any | undefined> {
    try {
      const [payrollRecord] = await db
        .select()
        .from(payroll)
        .where(eq(payroll.id, id));
      return payrollRecord;
    } catch (error) {
      console.error("Error fetching payroll by ID:", error);
      return undefined;
    }
  }

  async generateAIInsights(companyId: string): Promise<AIInsight[]> {
    try {
      // Generate sample insights - in real implementation, this would call DeepSeek API
      const sampleInsights = [
        {
          companyId,
          type: 'attendance_pattern',
          title: 'Pola Absensi Terlambat',
          description: '5 karyawan menunjukkan pola keterlambatan berulang dalam 2 minggu terakhir',
          severity: 'medium' as const,
          data: { employees: 5, pattern: 'late_arrival' },
          actionTaken: false,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
        {
          companyId,
          type: 'turnover_prediction',
          title: 'Prediksi Turnover',
          description: '2 karyawan berisiko tinggi resign dalam 3 bulan ke depan',
          severity: 'high' as const,
          data: { at_risk_employees: 2, confidence: 0.85 },
          actionTaken: false,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        }
      ];

      const insertedInsights = await Promise.all(
        sampleInsights.map(insight =>
          db.insert(aiInsights).values(insight).returning()
        )
      );

      return insertedInsights.flat();
    } catch (error) {
      console.error("Error generating AI insights:", error);
      return [];
    }
  }

  // Employee operations
  async getEmployees(companyId: string): Promise<Employee[]> {
    return db
      .select()
      .from(employees)
      .where(eq(employees.companyId, companyId))
      .orderBy(desc(employees.createdAt));
  }

  async getEmployee(id: number): Promise<Employee | undefined> {
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, id));
    return employee;
  }

  async getEmployeeById(id: number): Promise<Employee | undefined> {
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, id));
    return employee;
  }

  async getEmployeeByEmployeeId(employeeId: string): Promise<Employee | undefined> {
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.employeeId, employeeId));
    return employee;
  }

  async createEmployee(employeeData: InsertEmployee): Promise<Employee> {
    const [employee] = await db
      .insert(employees)
      .values(employeeData)
      .returning();
    return employee;
  }

  async updateEmployee(id: number, data: Partial<InsertEmployee>): Promise<Employee> {
    const [employee] = await db
      .update(employees)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(employees.id, id))
      .returning();
    return employee;
  }

  async deleteEmployee(id: number): Promise<void> {
    await db.delete(employees).where(eq(employees.id, id));
  }

  // Attendance operations
  async getAttendance(companyId: string, date?: string, employeeId?: number): Promise<Attendance[]> {
    let conditions = [eq(employees.companyId, companyId)];
    
    if (date) {
      conditions.push(eq(attendance.date, date));
    }

    if (employeeId) {
      conditions.push(eq(attendance.employeeId, employeeId));
    }

    return db
      .select({
        id: attendance.id,
        employeeId: attendance.employeeId,
        date: attendance.date,
        checkIn: attendance.checkIn,
        checkOut: attendance.checkOut,
        checkInLocation: attendance.checkInLocation,
        checkOutLocation: attendance.checkOutLocation,
        checkInPhoto: attendance.checkInPhoto,
        checkOutPhoto: attendance.checkOutPhoto,
        workingHours: attendance.workingHours,
        overtimeHours: attendance.overtimeHours,
        status: attendance.status,
        notes: attendance.notes,
        createdAt: attendance.createdAt,
        employee: {
          firstName: employees.firstName,
          lastName: employees.lastName,
          employeeId: employees.employeeId,
        }
      })
      .from(attendance)
      .innerJoin(employees, eq(attendance.employeeId, employees.id))
      .where(and(...conditions))
      .orderBy(desc(attendance.createdAt));
  }

  async getAttendanceByDate(date: string): Promise<Attendance[]> {
    return db
      .select()
      .from(attendance)
      .where(eq(attendance.date, date))
      .orderBy(desc(attendance.createdAt));
  }

  async getEmployeeAttendanceByDate(employeeId: string, date: string): Promise<Attendance | null> {
    const [attendanceRecord] = await db
      .select()
      .from(attendance)
      .innerJoin(employees, eq(attendance.employeeId, employees.id))
      .where(and(eq(employees.employeeId, employeeId), eq(attendance.date, date)));
    return attendanceRecord?.attendance || null;
  }

  async getEmployeeAttendanceRange(employeeId: string, startDate: string, endDate: string): Promise<Attendance[]> {
    return db
      .select({
        id: attendance.id,
        employeeId: attendance.employeeId,
        date: attendance.date,
        checkIn: attendance.checkIn,
        checkOut: attendance.checkOut,
        checkInLocation: attendance.checkInLocation,
        checkOutLocation: attendance.checkOutLocation,
        checkInPhoto: attendance.checkInPhoto,
        checkOutPhoto: attendance.checkOutPhoto,
        workingHours: attendance.workingHours,
        overtimeHours: attendance.overtimeHours,
        status: attendance.status,
        notes: attendance.notes,
        createdAt: attendance.createdAt,
      })
      .from(attendance)
      .innerJoin(employees, eq(attendance.employeeId, employees.id))
      .where(and(
        eq(employees.employeeId, employeeId),
        gte(attendance.date, startDate),
        lte(attendance.date, endDate)
      ))
      .orderBy(attendance.date);
  }

  async getAttendanceRange(startDate: string, endDate: string): Promise<Attendance[]> {
    return db
      .select({
        id: attendance.id,
        employeeId: attendance.employeeId,
        date: attendance.date,
        checkIn: attendance.checkIn,
        checkOut: attendance.checkOut,
        checkInLocation: attendance.checkInLocation,
        checkOutLocation: attendance.checkOutLocation,
        checkInPhoto: attendance.checkInPhoto,
        checkOutPhoto: attendance.checkOutPhoto,
        workingHours: attendance.workingHours,
        overtimeHours: attendance.overtimeHours,
        status: attendance.status,
        notes: attendance.notes,
        createdAt: attendance.createdAt,
        employee: {
          firstName: employees.firstName,
          lastName: employees.lastName,
          employeeId: employees.employeeId,
        }
      })
      .from(attendance)
      .innerJoin(employees, eq(attendance.employeeId, employees.id))
      .where(and(
        gte(attendance.date, startDate),
        lte(attendance.date, endDate)
      ))
      .orderBy(attendance.date);
  }

  async getAttendanceById(id: number): Promise<Attendance | null> {
    const [attendanceRecord] = await db
      .select()
      .from(attendance)
      .where(eq(attendance.id, id));
    return attendanceRecord || null;
  }

  async createAttendance(data: any): Promise<Attendance> {
    // Get employee by employeeId first
    const employee = await this.getEmployeeByEmployeeId(data.employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    const attendanceData = {
      ...data,
      employeeId: employee.id, // Use the actual employee ID from database
    };

    const [attendanceRecord] = await db
      .insert(attendance)
      .values(attendanceData)
      .returning();
    return attendanceRecord;
  }

  async updateAttendance(id: number, data: any): Promise<Attendance> {
    const [updatedRecord] = await db
      .update(attendance)
      .set(data)
      .where(eq(attendance.id, id))
      .returning();
    return updatedRecord;
  }

  async checkIn(data: InsertAttendance): Promise<Attendance> {
    const [attendanceRecord] = await db
      .insert(attendance)
      .values(data)
      .returning();
    return attendanceRecord;
  }

  async getEmployeeAttendance(employeeId: string, date?: string): Promise<Attendance[]> {
    let conditions = [eq(employees.employeeId, employeeId)];
    
    if (date) {
      conditions.push(eq(attendance.date, date));
    }

    return db
      .select({
        id: attendance.id,
        employeeId: attendance.employeeId,
        date: attendance.date,
        checkIn: attendance.checkIn,
        checkOut: attendance.checkOut,
        checkInLocation: attendance.checkInLocation,
        checkOutLocation: attendance.checkOutLocation,
        checkInPhoto: attendance.checkInPhoto,
        checkOutPhoto: attendance.checkOutPhoto,
        workingHours: attendance.workingHours,
        overtimeHours: attendance.overtimeHours,
        status: attendance.status,
        notes: attendance.notes,
        createdAt: attendance.createdAt,
        employee: {
          firstName: employees.firstName,
          lastName: employees.lastName,
          employeeId: employees.employeeId,
        }
      })
      .from(attendance)
      .innerJoin(employees, eq(attendance.employeeId, employees.id))
      .where(and(...conditions))
      .orderBy(desc(attendance.date));
  }

  async getTodayAttendance(employeeId: string): Promise<Attendance | undefined> {
    const today = new Date().toISOString().split('T')[0];
    const [attendanceRecord] = await db
      .select()
      .from(attendance)
      .innerJoin(employees, eq(attendance.employeeId, employees.id))
      .where(and(
        eq(employees.employeeId, employeeId),
        eq(attendance.date, today)
      ));
    return attendanceRecord?.attendance;
  }

  async checkOut(id: number, data: { checkOut: Date; checkOutLocation?: any; checkOutPhoto?: string }): Promise<Attendance> {
    const [attendanceRecord] = await db
      .update(attendance)
      .set(data)
      .where(eq(attendance.id, id))
      .returning();
    return attendanceRecord;
  }

  // Leave operations
  async getLeaveRequests(companyId: string): Promise<LeaveRequest[]> {
    return db
      .select({
        id: leaveRequests.id,
        employeeId: leaveRequests.employeeId,
        leaveTypeId: leaveRequests.leaveTypeId,
        startDate: leaveRequests.startDate,
        endDate: leaveRequests.endDate,
        totalDays: leaveRequests.totalDays,
        reason: leaveRequests.reason,
        status: leaveRequests.status,
        approvedBy: leaveRequests.approvedBy,
        approvedAt: leaveRequests.approvedAt,
        rejectionReason: leaveRequests.rejectionReason,
        documents: leaveRequests.documents,
        createdAt: leaveRequests.createdAt,
        updatedAt: leaveRequests.updatedAt,
        employee: {
          firstName: employees.firstName,
          lastName: employees.lastName,
          employeeId: employees.employeeId,
        }
      })
      .from(leaveRequests)
      .innerJoin(employees, eq(leaveRequests.employeeId, employees.id))
      .where(eq(employees.companyId, companyId))
      .orderBy(desc(leaveRequests.createdAt));
  }

  async getLeaveRequestById(id: number): Promise<LeaveRequest | undefined> {
    const [leaveRequest] = await db
      .select({
        id: leaveRequests.id,
        employeeId: leaveRequests.employeeId,
        leaveTypeId: leaveRequests.leaveTypeId,
        startDate: leaveRequests.startDate,
        endDate: leaveRequests.endDate,
        totalDays: leaveRequests.totalDays,
        reason: leaveRequests.reason,
        status: leaveRequests.status,
        approvedBy: leaveRequests.approvedBy,
        approvedAt: leaveRequests.approvedAt,
        rejectionReason: leaveRequests.rejectionReason,
        documents: leaveRequests.documents,
        createdAt: leaveRequests.createdAt,
        updatedAt: leaveRequests.updatedAt,
        employee: {
          firstName: employees.firstName,
          lastName: employees.lastName,
          employeeId: employees.employeeId,
        }
      })
      .from(leaveRequests)
      .innerJoin(employees, eq(leaveRequests.employeeId, employees.id))
      .where(eq(leaveRequests.id, id));
    return leaveRequest;
  }

  async createLeaveRequest(data: InsertLeaveRequest): Promise<LeaveRequest> {
    const [leaveRequest] = await db
      .insert(leaveRequests)
      .values(data)
      .returning();
    return leaveRequest;
  }

  async approveLeaveRequest(id: number, approvedBy: string): Promise<LeaveRequest> {
    const [leaveRequest] = await db
      .update(leaveRequests)
      .set({
        status: 'approved',
        approvedBy: approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(leaveRequests.id, id))
      .returning();
    return leaveRequest;
  }

  async rejectLeaveRequest(id: number, approvedBy: string, reason: string): Promise<LeaveRequest> {
    const [leaveRequest] = await db
      .update(leaveRequests)
      .set({
        status: 'rejected',
        approvedBy: approvedBy,
        rejectionReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(leaveRequests.id, id))
      .returning();
    return leaveRequest;
  }

  // Payroll operations
  async getPayroll(companyId: string, period?: string): Promise<Payroll[]> {
    let query = db
      .select({
        id: payroll.id,
        employeeId: payroll.employeeId,
        period: payroll.period,
        basicSalary: payroll.basicSalary,
        overtimePay: payroll.overtimePay,
        allowances: payroll.allowances,
        deductions: payroll.deductions,
        grossSalary: payroll.grossSalary,
        netSalary: payroll.netSalary,
        bpjsHealth: payroll.bpjsHealth,
        bpjsEmployment: payroll.bpjsEmployment,
        pph21: payroll.pph21,
        status: payroll.status,
        processedAt: payroll.processedAt,
        paidAt: payroll.paidAt,
        slipGenerated: payroll.slipGenerated,
        createdAt: payroll.createdAt,
        employee: {
          firstName: employees.firstName,
          lastName: employees.lastName,
          employeeId: employees.employeeId,
        }
      })
      .from(payroll)
      .innerJoin(employees, eq(payroll.employeeId, employees.id));

    let conditions = [eq(employees.companyId, companyId)];
    
    if (period) {
      conditions.push(eq(payroll.period, period));
    }

    return db
      .select({
        id: payroll.id,
        employeeId: payroll.employeeId,
        period: payroll.period,
        basicSalary: payroll.basicSalary,
        overtimePay: payroll.overtimePay,
        allowances: payroll.allowances,
        deductions: payroll.deductions,
        grossSalary: payroll.grossSalary,
        netSalary: payroll.netSalary,
        bpjsHealth: payroll.bpjsHealth,
        bpjsEmployment: payroll.bpjsEmployment,
        tax: payroll.pph21,
        status: payroll.status,
        processedAt: payroll.processedAt,
        paidAt: payroll.paidAt,
        slipGenerated: payroll.slipGenerated,
        createdAt: payroll.createdAt,
        employee: {
          firstName: employees.firstName,
          lastName: employees.lastName,
          employeeId: employees.employeeId,
          position: employees.position,
          bankAccount: employees.bankAccount,
          bankName: employees.bankName,
        }
      })
      .from(payroll)
      .innerJoin(employees, eq(payroll.employeeId, employees.id))
      .where(and(...conditions))
      .orderBy(desc(payroll.createdAt));
  }

  async calculatePayroll(companyId: string, period: string, employeeId?: number): Promise<Payroll[]> {
    try {
      // Get employees to process
      const allEmployees = await this.getEmployees(companyId);
      const employeesToProcess = employeeId 
        ? allEmployees.filter(emp => emp.id === employeeId)
        : allEmployees;

      const results: Payroll[] = [];

      for (const employee of employeesToProcess) {
        // Check if payroll already exists for this employee and period
        const existingPayroll = await db
          .select()
          .from(payroll)
          .where(and(
            eq(payroll.employeeId, employee.id),
            eq(payroll.period, period)
          ))
          .limit(1);

        if (existingPayroll.length > 0) {
          results.push(existingPayroll[0]);
          continue;
        }

        // Calculate basic components  
        const basicSalary = parseFloat(employee.basicSalary || "5000000"); // Default 5M if no salary set
        
        // Get employee salary components
        const employeeSalaryComponents = await this.getEmployeeSalaryComponents(employee.id);
        
        // Calculate total allowances from salary components
        let totalAllowances = 0;
        let totalDeductions = 0;
        const allowanceDetails: any = {};
        const deductionDetails: any = {};
        
        // Get salary component definitions to determine type
        const salaryComponents = await this.getSalaryComponents(companyId);
        
        for (const empComponent of employeeSalaryComponents) {
          if (!empComponent.isActive) continue;
          
          const componentDef = salaryComponents.find(sc => sc.id === empComponent.componentId);
          if (!componentDef) continue;
          
          const amount = parseFloat(empComponent.amount);
          
          if (componentDef.type === 'allowance') {
            totalAllowances += amount;
            allowanceDetails[componentDef.code] = amount;
          } else if (componentDef.type === 'deduction') {
            totalDeductions += amount;
            deductionDetails[componentDef.code] = amount;
          }
        }
        
        // Get attendance data for overtime calculation
        const startDate = new Date(period + "-01");
        const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
        
        const attendanceRecords = await db
          .select()
          .from(attendance)
          .where(and(
            eq(attendance.employeeId, employee.id),
            gte(attendance.date, startDate.toISOString().split('T')[0]),
            lte(attendance.date, endDate.toISOString().split('T')[0])
          ));

        // Calculate overtime pay
        const totalOvertimeHours = attendanceRecords.reduce((total, record) => {
          const overtimeHours = parseFloat(record.overtimeHours || "0");
          return total + overtimeHours;
        }, 0);

        const hourlyRate = basicSalary / 173; // Average working hours per month
        const overtimePay = totalOvertimeHours * hourlyRate * 1.5; // 1.5x for overtime

        // Calculate gross salary
        const grossSalary = basicSalary + totalAllowances + overtimePay;

        // Calculate deductions
        const bpjsHealth = grossSalary * 0.04; // 4% BPJS Kesehatan
        const bpjsEmployment = grossSalary * 0.02; // 2% BPJS Ketenagakerjaan
        
        // Calculate PPh21 (simplified calculation)
        let tax = 0;
        const annualGross = grossSalary * 12;
        if (annualGross > 60000000) { // Above 60M per year
          tax = (annualGross - 60000000) * 0.15 / 12; // 15% tax
        }

        // Include salary component deductions in total deductions
        const totalBpjsDeductions = bpjsHealth + bpjsEmployment;
        const totalCalculatedDeductions = totalBpjsDeductions + tax + totalDeductions;
        
        // Calculate net salary
        const netSalary = grossSalary - totalCalculatedDeductions;

        // Create payroll record with employee salary components
        const payrollData = {
          employeeId: employee.id,
          period: period,
          basicSalary: basicSalary.toString(),
          allowances: allowanceDetails,
          overtimePay: overtimePay.toString(),
          grossSalary: grossSalary.toString(),
          bpjsHealth: bpjsHealth.toString(),
          bpjsEmployment: bpjsEmployment.toString(),
          pph21: tax.toString(),
          deductions: { 
            ...deductionDetails,
            bpjsHealth: bpjsHealth, 
            bpjsEmployment: bpjsEmployment, 
            tax: tax, 
            total: totalCalculatedDeductions 
          },
          netSalary: netSalary.toString(),
          status: "draft",
          processedAt: new Date(),
          adjustments: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const [newPayroll] = await db
          .insert(payroll)
          .values(payrollData)
          .returning();

        results.push(newPayroll);
      }

      return results;
    } catch (error) {
      console.error("Error calculating payroll:", error);
      console.error("Error details:", error);
      // Return empty array if calculation fails - no mock data
      return [];
    }
  }

  async generatePayslip(id: number): Promise<string> {
    // This would generate PDF payslip
    // For now, return a placeholder path
    return `/payslips/payslip_${id}.pdf`;
  }

  // Document operations
  async getDocuments(companyId: string): Promise<Document[]> {
    return db
      .select()
      .from(documents)
      .where(eq(documents.companyId, companyId))
      .orderBy(desc(documents.createdAt));
  }

  async createDocument(data: InsertDocument): Promise<Document> {
    const [document] = await db
      .insert(documents)
      .values(data)
      .returning();
    return document;
  }

  async updateDocumentStatus(id: number, signed: boolean, signedBy?: string): Promise<Document> {
    const updateData: any = {
      signedBy: signed ? { userId: signedBy || "current_user", timestamp: new Date() } : null,
      signedAt: signed ? new Date() : null,
    };

    const [document] = await db
      .update(documents)
      .set(updateData)
      .where(eq(documents.id, id))
      .returning();
    return document;
  }

  // Reimbursement operations
  async getReimbursements(companyId: string): Promise<Reimbursement[]> {
    return db
      .select({
        id: reimbursements.id,
        employeeId: reimbursements.employeeId,
        category: reimbursements.category,
        amount: reimbursements.amount,
        description: reimbursements.description,
        receiptPhoto: reimbursements.receiptPhoto,
        ocrData: reimbursements.ocrData,
        date: reimbursements.date,
        status: reimbursements.status,
        approvedBy: reimbursements.approvedBy,
        approvedAt: reimbursements.approvedAt,
        rejectionReason: reimbursements.rejectionReason,
        paidAt: reimbursements.paidAt,
        createdAt: reimbursements.createdAt,
        updatedAt: reimbursements.updatedAt,
        employee: {
          firstName: employees.firstName,
          lastName: employees.lastName,
          employeeId: employees.employeeId,
        }
      })
      .from(reimbursements)
      .innerJoin(employees, eq(reimbursements.employeeId, employees.id))
      .where(eq(employees.companyId, companyId))
      .orderBy(desc(reimbursements.createdAt));
  }

  async createReimbursement(data: InsertReimbursement): Promise<Reimbursement> {
    const [reimbursement] = await db
      .insert(reimbursements)
      .values(data)
      .returning();
    return reimbursement;
  }

  async approveReimbursement(id: number, approvedBy: string): Promise<Reimbursement> {
    const [reimbursement] = await db
      .update(reimbursements)
      .set({
        status: "approved",
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(reimbursements.id, id))
      .returning();
    return reimbursement;
  }

  async rejectReimbursement(id: number, approvedBy: string, reason: string): Promise<Reimbursement> {
    const [reimbursement] = await db
      .update(reimbursements)
      .set({
        status: "rejected",
        approvedBy,
        rejectionReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(reimbursements.id, id))
      .returning();
    return reimbursement;
  }

  // Performance operations
  async getPerformanceReviews(companyId: string): Promise<PerformanceReview[]> {
    return db
      .select({
        id: performanceReviews.id,
        employeeId: performanceReviews.employeeId,
        period: performanceReviews.period,
        targets: performanceReviews.targets,
        achievements: performanceReviews.achievements,
        rating: performanceReviews.rating,
        feedback: performanceReviews.feedback,
        reviewedBy: performanceReviews.reviewedBy,
        status: performanceReviews.status,
        createdAt: performanceReviews.createdAt,
        updatedAt: performanceReviews.updatedAt,
        employee: {
          firstName: employees.firstName,
          lastName: employees.lastName,
          employeeId: employees.employeeId,
        }
      })
      .from(performanceReviews)
      .innerJoin(employees, eq(performanceReviews.employeeId, employees.id))
      .where(eq(employees.companyId, companyId))
      .orderBy(desc(performanceReviews.createdAt));
  }

  async createPerformanceReview(data: InsertPerformanceReview): Promise<PerformanceReview> {
    const [review] = await db
      .insert(performanceReviews)
      .values(data)
      .returning();
    return review;
  }

  async updatePerformanceReview(id: number, data: Partial<InsertPerformanceReview>): Promise<PerformanceReview> {
    const [updatedReview] = await db
      .update(performanceReviews)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(performanceReviews.id, id))
      .returning();
    
    if (!updatedReview) {
      throw new Error('Performance review not found');
    }
    
    return updatedReview;
  }

  // Recruitment operations
  async getJobs(companyId: string): Promise<Job[]> {
    return db
      .select()
      .from(jobs)
      .where(eq(jobs.companyId, companyId))
      .orderBy(desc(jobs.createdAt));
  }

  async createJob(data: InsertJob): Promise<Job> {
    const [job] = await db
      .insert(jobs)
      .values(data)
      .returning();
    return job;
  }

  async updateJob(id: number, data: Partial<InsertJob>): Promise<Job> {
    const [job] = await db
      .update(jobs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(jobs.id, id))
      .returning();
    return job;
  }

  async deleteJob(id: number): Promise<void> {
    await db.delete(jobs).where(eq(jobs.id, id));
  }

  async getJobApplications(companyId: string): Promise<any[]> {
    return db
      .select({
        id: jobApplications.id,
        jobId: jobApplications.jobId,
        applicantName: jobApplications.applicantName,
        applicantEmail: jobApplications.applicantEmail,
        applicantPhone: jobApplications.applicantPhone,
        resumePath: jobApplications.resumePath,
        portfolioPath: jobApplications.portfolioPath,
        stage: jobApplications.stage,
        status: jobApplications.status,
        aiMatchScore: jobApplications.aiMatchScore,
        interviewDate: jobApplications.interviewDate,
        notes: jobApplications.notes,
        offerAmount: jobApplications.offerAmount,
        hiredDate: jobApplications.hiredDate,
        createdAt: jobApplications.createdAt,
        updatedAt: jobApplications.updatedAt,
        job: {
          title: jobs.title,
          location: jobs.location,
          type: jobs.type
        }
      })
      .from(jobApplications)
      .leftJoin(jobs, eq(jobApplications.jobId, jobs.id))
      .where(eq(jobs.companyId, companyId))
      .orderBy(desc(jobApplications.createdAt));
  }

  async getJobApplication(id: number): Promise<JobApplication | undefined> {
    const [application] = await db
      .select()
      .from(jobApplications)
      .leftJoin(jobs, eq(jobApplications.jobId, jobs.id))
      .where(eq(jobApplications.id, id));
    return application;
  }

  async createJobApplication(data: InsertJobApplication): Promise<JobApplication> {
    const [application] = await db
      .insert(jobApplications)
      .values(data)
      .returning();
    return application;
  }

  async updateJobApplication(id: number, data: Partial<InsertJobApplication>): Promise<JobApplication> {
    const [application] = await db
      .update(jobApplications)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(jobApplications.id, id))
      .returning();
    return application;
  }

  async deleteJobApplication(id: number): Promise<void> {
    await db.delete(jobApplications).where(eq(jobApplications.id, id));
  }

  async analyzeApplicantJobMatch(applicationId: number): Promise<JobApplication> {
    const application = await this.getJobApplication(applicationId);
    if (!application) {
      throw new Error("Application not found");
    }

    // Import AI matcher here to avoid circular dependencies
    const { aiJobMatcher } = await import('./aiMatching');
    
    // Get job details
    const [job] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, application.jobApplications.jobId));

    if (!job) {
      throw new Error("Job not found");
    }

    // Perform AI analysis
    const aiResult = await aiJobMatcher.analyzeApplicantJobCompatibility(
      application.jobApplications,
      job
    );

    // Update application with AI results
    const [updatedApplication] = await db
      .update(jobApplications)
      .set({
        aiMatchScore: aiResult.overallScore.toString(),
        aiAnalysis: aiResult,
        updatedAt: new Date(),
      })
      .where(eq(jobApplications.id, applicationId))
      .returning();

    return updatedApplication;
  }

  // Document operations for applicants
  async getApplicantDocuments(applicationId: number): Promise<ApplicantDocument[]> {
    return db
      .select()
      .from(applicantDocuments)
      .where(eq(applicantDocuments.applicationId, applicationId))
      .orderBy(desc(applicantDocuments.uploadedAt));
  }

  async createApplicantDocument(data: InsertApplicantDocument): Promise<ApplicantDocument> {
    const [document] = await db
      .insert(applicantDocuments)
      .values(data)
      .returning();
    return document;
  }

  async deleteApplicantDocument(id: number): Promise<void> {
    await db.delete(applicantDocuments).where(eq(applicantDocuments.id, id));
  }

  // Interview operations
  async getInterviewSchedules(companyId: string): Promise<InterviewSchedule[]> {
    return db
      .select()
      .from(interviewSchedules)
      .leftJoin(jobApplications, eq(interviewSchedules.applicationId, jobApplications.id))
      .leftJoin(jobs, eq(jobApplications.jobId, jobs.id))
      .where(eq(jobs.companyId, companyId))
      .orderBy(desc(interviewSchedules.scheduledDate));
  }

  async getApplicationInterviews(applicationId: number): Promise<InterviewSchedule[]> {
    return db
      .select()
      .from(interviewSchedules)
      .where(eq(interviewSchedules.applicationId, applicationId))
      .orderBy(desc(interviewSchedules.scheduledDate));
  }

  async createInterviewSchedule(data: InsertInterviewSchedule): Promise<InterviewSchedule> {
    const [interview] = await db
      .insert(interviewSchedules)
      .values(data)
      .returning();
    return interview;
  }

  async updateInterviewSchedule(id: number, data: Partial<InsertInterviewSchedule>): Promise<InterviewSchedule> {
    const [interview] = await db
      .update(interviewSchedules)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(interviewSchedules.id, id))
      .returning();
    return interview;
  }

  async deleteInterviewSchedule(id: number): Promise<void> {
    await db.delete(interviewSchedules).where(eq(interviewSchedules.id, id));
  }

  async createJobApplication_old(data: InsertJobApplication): Promise<JobApplication> {
    return db
      .select({
        id: jobApplications.id,
        jobId: jobApplications.jobId,
        applicantName: jobApplications.applicantName,
        applicantEmail: jobApplications.applicantEmail,
        applicantPhone: jobApplications.applicantPhone,
        resumePath: jobApplications.resumePath,
        coverLetter: jobApplications.coverLetter,
        parsedResume: jobApplications.parsedResume,
        keywordScore: jobApplications.keywordScore,
        stage: jobApplications.stage,
        notes: jobApplications.notes,
        interviewDate: jobApplications.interviewDate,
        offerAmount: jobApplications.offerAmount,
        hiredDate: jobApplications.hiredDate,
        createdAt: jobApplications.createdAt,
        updatedAt: jobApplications.updatedAt,
        job: {
          title: jobs.title,
          department: jobs.departmentId,
        }
      })
      .from(jobApplications)
      .innerJoin(jobs, eq(jobApplications.jobId, jobs.id))
      .where(eq(jobs.companyId, companyId))
      .orderBy(desc(jobApplications.createdAt));
  }

  async createJobApplication(data: InsertJobApplication): Promise<JobApplication> {
    const [application] = await db
      .insert(jobApplications)
      .values(data)
      .returning();
    return application;
  }

  // Salary Component operations
  async getSalaryComponents(companyId: string): Promise<SalaryComponent[]> {
    return await db
      .select()
      .from(salaryComponents)
      .where(eq(salaryComponents.companyId, companyId))
      .orderBy(salaryComponents.type, salaryComponents.name);
  }

  async createSalaryComponent(data: InsertSalaryComponent): Promise<SalaryComponent> {
    const [newComponent] = await db
      .insert(salaryComponents)
      .values(data)
      .returning();
    return newComponent;
  }

  async updateSalaryComponent(id: number, data: Partial<InsertSalaryComponent>): Promise<SalaryComponent> {
    const [updatedComponent] = await db
      .update(salaryComponents)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(salaryComponents.id, id))
      .returning();
    return updatedComponent;
  }

  async deleteSalaryComponent(id: number): Promise<void> {
    await db
      .delete(salaryComponents)
      .where(eq(salaryComponents.id, id));
  }

  // Employee Salary Component operations
  async getEmployeeSalaryComponents(employeeId: number): Promise<EmployeeSalaryComponent[]> {
    return await db
      .select()
      .from(employeeSalaryComponents)
      .where(and(
        eq(employeeSalaryComponents.employeeId, employeeId),
        eq(employeeSalaryComponents.isActive, true)
      ))
      .orderBy(employeeSalaryComponents.createdAt);
  }

  async setEmployeeSalaryComponent(data: InsertEmployeeSalaryComponent): Promise<EmployeeSalaryComponent> {
    const [newComponent] = await db
      .insert(employeeSalaryComponents)
      .values(data)
      .returning();
    return newComponent;
  }

  async updateEmployeeSalaryComponent(id: number, data: Partial<InsertEmployeeSalaryComponent>): Promise<EmployeeSalaryComponent> {
    const [updatedComponent] = await db
      .update(employeeSalaryComponents)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(employeeSalaryComponents.id, id))
      .returning();
    return updatedComponent;
  }

  async deleteEmployeeSalaryComponent(id: number): Promise<void> {
    await db
      .update(employeeSalaryComponents)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(employeeSalaryComponents.id, id));
  }
}

export const storage = new DatabaseStorage();

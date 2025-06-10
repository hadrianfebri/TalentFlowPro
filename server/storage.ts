import {
  users,
  companies,
  departments,
  employees,
  attendance,
  leaveTypes,
  leaveRequests,
  payroll,
  documents,
  reimbursements,
  performanceReviews,
  jobs,
  jobApplications,
  rewardWallet,
  aiInsights,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Dashboard operations
  getDashboardStats(companyId: string): Promise<any>;
  getRecentActivities(companyId: string): Promise<any[]>;
  getAIInsights(companyId: string): Promise<AIInsight[]>;
  generateAIInsights(companyId: string): Promise<AIInsight[]>;
  
  // Employee operations
  getEmployees(companyId: string): Promise<Employee[]>;
  getEmployee(id: number): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, data: Partial<InsertEmployee>): Promise<Employee>;
  
  // Attendance operations
  getAttendance(companyId: string, date?: string, employeeId?: number): Promise<Attendance[]>;
  checkIn(data: InsertAttendance): Promise<Attendance>;
  checkOut(id: number, data: { checkOut: Date; checkOutLocation?: any; checkOutPhoto?: string }): Promise<Attendance>;
  
  // Leave operations
  getLeaveRequests(companyId: string): Promise<LeaveRequest[]>;
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
  
  // Reimbursement operations
  getReimbursements(companyId: string): Promise<Reimbursement[]>;
  createReimbursement(data: InsertReimbursement): Promise<Reimbursement>;
  
  // Performance operations
  getPerformanceReviews(companyId: string): Promise<PerformanceReview[]>;
  createPerformanceReview(data: InsertPerformanceReview): Promise<PerformanceReview>;
  
  // Recruitment operations
  getJobs(companyId: string): Promise<Job[]>;
  createJob(data: InsertJob): Promise<Job>;
  getJobApplications(companyId: string): Promise<JobApplication[]>;
  createJobApplication(data: InsertJobApplication): Promise<JobApplication>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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

  // Attendance operations
  async getAttendance(companyId: string, date?: string, employeeId?: number): Promise<Attendance[]> {
    let query = db
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
      .where(eq(employees.companyId, companyId));

    if (date) {
      query = query.where(and(eq(employees.companyId, companyId), eq(attendance.date, date)));
    }

    if (employeeId) {
      query = query.where(and(eq(employees.companyId, companyId), eq(attendance.employeeId, employeeId)));
    }

    return query.orderBy(desc(attendance.createdAt));
  }

  async checkIn(data: InsertAttendance): Promise<Attendance> {
    const [attendanceRecord] = await db
      .insert(attendance)
      .values(data)
      .returning();
    return attendanceRecord;
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
        approvedBy: parseInt(approvedBy),
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
        approvedBy: parseInt(approvedBy),
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
      .innerJoin(employees, eq(payroll.employeeId, employees.id))
      .where(eq(employees.companyId, companyId));

    if (period) {
      query = query.where(and(eq(employees.companyId, companyId), eq(payroll.period, period)));
    }

    return query.orderBy(desc(payroll.createdAt));
  }

  async calculatePayroll(companyId: string, period: string, employeeId?: number): Promise<Payroll[]> {
    // This would implement payroll calculation logic
    // For now, return existing payroll records
    return this.getPayroll(companyId, period);
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

  async getJobApplications(companyId: string): Promise<JobApplication[]> {
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
}

export const storage = new DatabaseStorage();

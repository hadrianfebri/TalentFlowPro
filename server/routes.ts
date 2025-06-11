import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupSwagger } from "./swagger";
import { getUserProfile, requireAdminOrHR, requireAdmin, requireEmployeeAccess, AuthenticatedRequest } from "./rbac";
import {
  insertEmployeeSchema,
  insertAttendanceSchema,
  insertLeaveRequestSchema,
  insertPayrollSchema,
  insertDocumentSchema,
  insertReimbursementSchema,
  insertPerformanceReviewSchema,
  insertJobSchema,
  insertJobApplicationSchema,
  insertEmployeeSalaryComponentSchema,
  insertSalaryComponentSchema,
  employees,
  attendance,
  payroll,
} from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";
import { eq, and } from "drizzle-orm";

// AI Insights Generation Function
async function generateAttendanceInsights(attendanceRecords: any[], employees: any[], period: string) {
  const insights = [];
  
  try {
    // Analysis 1: Late Arrival Pattern
    const lateRecords = attendanceRecords.filter(record => record.status === 'late');
    if (lateRecords.length > 0) {
      const lateEmployees = lateRecords.map(record => 
        `${record.employee?.firstName || ''} ${record.employee?.lastName || ''}`.trim()
      ).filter(name => name.length > 0);
      
      insights.push({
        type: 'late_pattern',
        title: 'Pola Keterlambatan Terdeteksi',
        description: `${lateRecords.length} karyawan menunjukkan pola keterlambatan pada tanggal ${period}`,
        severity: lateRecords.length > 3 ? 'high' : 'medium',
        actionable: true,
        employees: lateEmployees,
        recommendation: 'Pertimbangkan untuk mengadakan counseling atau review jadwal kerja untuk karyawan yang sering terlambat.'
      });
    }

    // Analysis 2: Attendance Rate
    const totalEmployees = employees.length;
    const presentEmployees = attendanceRecords.filter(record => record.checkIn || record.status === 'present').length;
    const attendanceRate = totalEmployees > 0 ? (presentEmployees / totalEmployees) * 100 : 0;
    
    if (attendanceRate < 85) {
      insights.push({
        type: 'low_attendance',
        title: 'Tingkat Kehadiran Rendah',
        description: `Tingkat kehadiran hanya ${attendanceRate.toFixed(1)}%, di bawah standar optimal 85%`,
        severity: attendanceRate < 70 ? 'high' : 'medium',
        actionable: true,
        recommendation: 'Evaluasi kebijakan absensi dan identifikasi faktor-faktor yang mempengaruhi kehadiran karyawan.'
      });
    }

    // Analysis 3: Working Hours Pattern
    const workingHoursRecords = attendanceRecords.filter(record => 
      record.checkIn && record.checkOut && record.workingHours
    );
    
    if (workingHoursRecords.length > 0) {
      const avgHours = workingHoursRecords.reduce((sum, record) => 
        sum + parseFloat(record.workingHours || '0'), 0
      ) / workingHoursRecords.length;
      
      const shortHourEmployees = workingHoursRecords
        .filter(record => parseFloat(record.workingHours || '0') < 7)
        .map(record => `${record.employee?.firstName || ''} ${record.employee?.lastName || ''}`.trim())
        .filter(name => name.length > 0);
      
      if (shortHourEmployees.length > 0) {
        insights.push({
          type: 'short_working_hours',
          title: 'Jam Kerja Di Bawah Standar',
          description: `${shortHourEmployees.length} karyawan bekerja kurang dari 7 jam pada ${period}`,
          severity: shortHourEmployees.length > 2 ? 'medium' : 'low',
          actionable: true,
          employees: shortHourEmployees,
          recommendation: 'Review penyebab jam kerja pendek - apakah karena keperluan pribadi, kondisi kesehatan, atau masalah operasional.'
        });
      }
    }

    // Analysis 4: Check-in Location Anomaly
    const locationRecords = attendanceRecords.filter(record => record.checkInLocation);
    if (locationRecords.length > 0) {
      insights.push({
        type: 'location_compliance',
        title: 'Kepatuhan Lokasi Check-in',
        description: `${locationRecords.length} dari ${attendanceRecords.length} check-in memiliki data lokasi GPS`,
        severity: 'low',
        actionable: false,
        recommendation: 'Pastikan semua karyawan mengaktifkan GPS saat melakukan check-in untuk meningkatkan akurasi data.'
      });
    }

    // Analysis 5: Overall Productivity Insight
    if (attendanceRate > 90 && workingHoursRecords.length > 0) {
      const avgHours = workingHoursRecords.reduce((sum, record) => 
        sum + parseFloat(record.workingHours || '0'), 0
      ) / workingHoursRecords.length;
      
      if (avgHours >= 8) {
        insights.push({
          type: 'high_performance',
          title: 'Kinerja Kehadiran Optimal',
          description: `Tim menunjukkan tingkat kehadiran ${attendanceRate.toFixed(1)}% dengan rata-rata jam kerja ${avgHours.toFixed(1)} jam`,
          severity: 'low',
          actionable: false,
          recommendation: 'Pertahankan momentum positif ini dengan program recognition dan reward untuk tim yang konsisten.'
        });
      }
    }

    return insights;
  } catch (error) {
    console.error('Error generating AI insights:', error);
    return [{
      type: 'error',
      title: 'Error dalam Analisis AI',
      description: 'Terjadi kesalahan saat menganalisis data absensi',
      severity: 'medium' as const,
      actionable: false,
      recommendation: 'Silakan coba lagi atau hubungi administrator sistem.'
    }];
  }
}

// AI Payroll Insights Generation Function
// External platform integration function
async function postToExternalPlatform(platform: string, jobData: any) {
  // Simulate API calls to external job platforms
  // In production, you would integrate with actual APIs
  
  const simulatedDelay = Math.random() * 2000 + 1000; // 1-3 seconds
  await new Promise(resolve => setTimeout(resolve, simulatedDelay));
  
  const platforms = {
    jobstreet: {
      name: 'JobStreet',
      apiUrl: 'https://api.jobstreet.com/jobs',
      requiresAuth: true
    },
    indeed: {
      name: 'Indeed',
      apiUrl: 'https://api.indeed.com/publisher',
      requiresAuth: true
    },
    linkedin: {
      name: 'LinkedIn Jobs',
      apiUrl: 'https://api.linkedin.com/v2/jobs',
      requiresAuth: true
    },
    glints: {
      name: 'Glints',
      apiUrl: 'https://api.glints.com/jobs',
      requiresAuth: true
    },
    kalibrr: {
      name: 'Kalibrr',
      apiUrl: 'https://api.kalibrr.com/jobs',
      requiresAuth: true
    }
  };

  const platformConfig = platforms[platform as keyof typeof platforms];
  if (!platformConfig) {
    throw new Error(`Platform ${platform} not supported`);
  }

  // Simulate successful posting
  const externalId = `ext_${platform}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const url = `https://${platform}.com/jobs/${externalId}`;

  return {
    externalId,
    url,
    platform: platformConfig.name,
    postedAt: new Date().toISOString()
  };
}

async function generatePayrollInsights(payrollRecords: any[], employees: any[], period: string) {
  const insights = [];
  
  try {
    // Analysis 1: Salary Distribution Analysis
    if (payrollRecords.length > 0) {
      const salaries = payrollRecords.map(record => parseFloat(record.netSalary));
      const avgSalary = salaries.reduce((sum, salary) => sum + salary, 0) / salaries.length;
      const maxSalary = Math.max(...salaries);
      const minSalary = Math.min(...salaries);
      const salaryGap = maxSalary - minSalary;
      
      if (salaryGap > avgSalary * 2) {
        insights.push({
          type: 'salary_disparity',
          title: 'Kesenjangan Gaji Terdeteksi',
          description: `Terdapat kesenjangan gaji yang signifikan antara ${formatCurrency(minSalary)} hingga ${formatCurrency(maxSalary)}`,
          severity: salaryGap > avgSalary * 3 ? 'high' : 'medium',
          value: salaryGap,
          trend: 'stable',
          recommendation: 'Review struktur gaji untuk memastikan keadilan internal. Pertimbangkan implementasi salary grade yang lebih terstruktur.'
        });
      }
    }

    // Analysis 2: Overtime Cost Analysis
    const overtimeRecords = payrollRecords.filter(record => parseFloat(record.overtimePay) > 0);
    if (overtimeRecords.length > 0) {
      const totalOvertimeCost = overtimeRecords.reduce((sum, record) => sum + parseFloat(record.overtimePay), 0);
      const avgOvertimeCost = totalOvertimeCost / overtimeRecords.length;
      const overtimePercentage = (overtimeRecords.length / payrollRecords.length) * 100;
      
      if (overtimePercentage > 30) {
        insights.push({
          type: 'high_overtime',
          title: 'Biaya Lembur Tinggi',
          description: `${overtimePercentage.toFixed(1)}% karyawan memiliki lembur dengan total biaya ${formatCurrency(totalOvertimeCost)}`,
          severity: overtimePercentage > 50 ? 'high' : 'medium',
          value: totalOvertimeCost,
          trend: 'up',
          recommendation: 'Evaluasi beban kerja dan distribusi tugas. Pertimbangkan penambahan karyawan atau optimalisasi proses kerja.'
        });
      }
    }

    // Analysis 3: Tax and Deduction Compliance
    const taxRecords = payrollRecords.filter(record => parseFloat(record.tax) > 0);
    const totalTax = taxRecords.reduce((sum, record) => sum + parseFloat(record.tax), 0);
    const totalBPJS = payrollRecords.reduce((sum, record) => 
      sum + parseFloat(record.bpjsHealth) + parseFloat(record.bpjsEmployment), 0
    );
    
    insights.push({
      type: 'compliance_status',
      title: 'Status Kepatuhan Pajak & BPJS',
      description: `Total pajak PPh21: ${formatCurrency(totalTax)}, Total BPJS: ${formatCurrency(totalBPJS)}`,
      severity: 'low',
      value: totalTax + totalBPJS,
      trend: 'stable',
      recommendation: 'Pastikan semua perhitungan pajak dan BPJS sesuai dengan regulasi terbaru. Lakukan review berkala.'
    });

    // Analysis 4: Payroll Cost Trend
    const totalPayrollCost = payrollRecords.reduce((sum, record) => sum + parseFloat(record.netSalary), 0);
    const avgSalaryPerEmployee = payrollRecords.length > 0 ? totalPayrollCost / payrollRecords.length : 0;
    
    insights.push({
      type: 'cost_analysis',
      title: 'Analisis Biaya Total Payroll',
      description: `Total biaya payroll periode ${period}: ${formatCurrency(totalPayrollCost)} dengan rata-rata ${formatCurrency(avgSalaryPerEmployee)} per karyawan`,
      severity: 'low',
      value: totalPayrollCost,
      trend: 'stable',
      recommendation: 'Monitor trend biaya payroll secara konsisten. Bandingkan dengan budget dan proyeksi pertumbuhan perusahaan.'
    });

    // Analysis 5: Department Cost Distribution
    const departmentCosts = {};
    payrollRecords.forEach(record => {
      const dept = record.employee?.department || 'Tidak Ditentukan';
      if (!departmentCosts[dept]) {
        departmentCosts[dept] = { total: 0, count: 0 };
      }
      departmentCosts[dept].total += parseFloat(record.netSalary);
      departmentCosts[dept].count += 1;
    });

    const departments = Object.keys(departmentCosts);
    if (departments.length > 1) {
      const costByDept = departments.map(dept => ({
        department: dept,
        total: departmentCosts[dept].total,
        average: departmentCosts[dept].total / departmentCosts[dept].count,
        count: departmentCosts[dept].count
      })).sort((a, b) => b.total - a.total);

      const highestCostDept = costByDept[0];
      insights.push({
        type: 'department_analysis',
        title: 'Distribusi Biaya per Departemen',
        description: `Departemen ${highestCostDept.department} memiliki biaya payroll tertinggi: ${formatCurrency(highestCostDept.total)} untuk ${highestCostDept.count} karyawan`,
        severity: 'low',
        value: highestCostDept.total,
        trend: 'stable',
        recommendation: 'Analisis ROI per departemen untuk optimalisasi alokasi budget dan evaluasi produktivitas.'
      });
    }

    // Analysis 6: Salary Benchmarking Insight
    if (payrollRecords.length > 5) {
      const medianSalary = [...payrollRecords.map(r => parseFloat(r.netSalary))].sort((a, b) => a - b)[Math.floor(payrollRecords.length / 2)];
      const avgSalary = payrollRecords.reduce((sum, r) => sum + parseFloat(r.netSalary), 0) / payrollRecords.length;
      
      insights.push({
        type: 'salary_benchmarking',
        title: 'Benchmarking Struktur Gaji',
        description: `Median gaji: ${formatCurrency(medianSalary)}, Rata-rata: ${formatCurrency(avgSalary)}`,
        severity: 'low',
        value: avgSalary,
        trend: Math.abs(medianSalary - avgSalary) > avgSalary * 0.15 ? 'up' : 'stable',
        recommendation: 'Lakukan survey gaji industri untuk memastikan kompetitivitas kompensasi. Pertimbangkan adjustments berkala.'
      });
    }

    return insights;
  } catch (error) {
    console.error('Error generating payroll AI insights:', error);
    return [{
      type: 'error',
      title: 'Error dalam Analisis Payroll AI',
      description: 'Terjadi kesalahan saat menganalisis data payroll',
      severity: 'medium' as const,
      recommendation: 'Silakan coba lagi atau hubungi administrator sistem.'
    }];
  }
}

// Helper function for currency formatting in insights
function formatCurrency(amount: string | number) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Swagger documentation
  setupSwagger(app);
  
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  /**
   * @swagger
   * /auth/user:
   *   get:
   *     summary: Mendapatkan informasi user yang sedang login dengan role
   *     tags: [Authentication]
   *     security:
   *       - ReplitAuth: []
   *     responses:
   *       200:
   *         description: Data user berhasil diambil
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 email:
   *                   type: string
   *                 firstName:
   *                   type: string
   *                 lastName:
   *                   type: string
   *                 role:
   *                   type: string
   *                   enum: [admin, hr, employee]
   *                 employeeId:
   *                   type: integer
   *                 companyId:
   *                   type: string
   *       401:
   *         description: Unauthorized - User belum login
   *       500:
   *         description: Server error
   */
  app.get('/api/auth/user', isAuthenticated, getUserProfile, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json({
        ...user,
        permissions: req.userProfile?.role
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard API
  /**
   * @swagger
   * /dashboard/stats:
   *   get:
   *     summary: Mendapatkan statistik dashboard perusahaan
   *     tags: [Dashboard]
   *     security:
   *       - ReplitAuth: []
   *     responses:
   *       200:
   *         description: Statistik dashboard berhasil diambil
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 totalEmployees:
   *                   type: integer
   *                 attendanceToday:
   *                   type: integer
   *                 pendingLeaves:
   *                   type: integer
   *                 monthlyPayroll:
   *                   type: number
   *       400:
   *         description: User tidak terkait dengan perusahaan
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Server error
   */
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const stats = await storage.getDashboardStats(user.companyId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get('/api/dashboard/activities', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const activities = await storage.getRecentActivities(user.companyId);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.get('/api/dashboard/ai-insights', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const insights = await storage.getAIInsights(user.companyId);
      res.json(insights);
    } catch (error) {
      console.error("Error fetching AI insights:", error);
      res.status(500).json({ message: "Failed to fetch AI insights" });
    }
  });

  // Employee Management API
  /**
   * @swagger
   * /employees:
   *   get:
   *     summary: Mendapatkan daftar semua karyawan
   *     tags: [Employee Management]
   *     security:
   *       - ReplitAuth: []
   *     responses:
   *       200:
   *         description: Daftar karyawan berhasil diambil
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Employee'
   *       400:
   *         description: User tidak terkait dengan perusahaan
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Server error
   *   post:
   *     summary: Menambah karyawan baru
   *     tags: [Employee Management]
   *     security:
   *       - ReplitAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - employeeId
   *               - firstName
   *               - lastName
   *               - email
   *               - position
   *               - hireDate
   *             properties:
   *               employeeId:
   *                 type: string
   *               firstName:
   *                 type: string
   *               lastName:
   *                 type: string
   *               email:
   *                 type: string
   *               phone:
   *                 type: string
   *               position:
   *                 type: string
   *               department:
   *                 type: string
   *               hireDate:
   *                 type: string
   *                 format: date
   *               salary:
   *                 type: string
   *     responses:
   *       201:
   *         description: Karyawan berhasil ditambahkan
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Employee'
   *       400:
   *         description: Data tidak valid atau user tidak terkait dengan perusahaan
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Server error
   */
  app.get('/api/employees', isAuthenticated, getUserProfile, async (req: any, res) => {
    try {
      const companyId = req.userProfile?.companyId;
      const userRole = req.userProfile?.role;
      const employeeId = req.userProfile?.employeeId;

      if (!companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      let employees;
      if (userRole === "admin" || userRole === "hr") {
        // Admin dan HR bisa lihat semua karyawan
        employees = await storage.getEmployees(companyId);
      } else {
        // Employee hanya bisa lihat data mereka sendiri
        if (!employeeId) {
          return res.status(403).json({ message: "Employee profile not found" });
        }
        const employee = await storage.getEmployee(employeeId);
        employees = employee ? [employee] : [];
      }

      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.post('/api/employees', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const companyId = req.userProfile?.companyId;

      if (!companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const validatedData = insertEmployeeSchema.parse({
        ...req.body,
        companyId: companyId,
      });
      
      const employee = await storage.createEmployee(validatedData);
      res.status(201).json(employee);
    } catch (error) {
      console.error("Error creating employee:", error);
      res.status(500).json({ message: "Failed to create employee" });
    }
  });

  app.get('/api/employees/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const employee = await storage.getEmployee(parseInt(id));
      
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      res.json(employee);
    } catch (error) {
      console.error("Error fetching employee:", error);
      res.status(500).json({ message: "Failed to fetch employee" });
    }
  });

  app.put('/api/employees/:id', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertEmployeeSchema.partial().parse(req.body);
      
      const employee = await storage.updateEmployee(parseInt(id), validatedData);
      res.json(employee);
    } catch (error) {
      console.error("Error updating employee:", error);
      res.status(500).json({ message: "Failed to update employee" });
    }
  });

  app.delete('/api/employees/:id', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      await storage.deleteEmployee(parseInt(id));
      res.json({ message: "Employee deleted successfully" });
    } catch (error) {
      console.error("Error deleting employee:", error);
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });

  // Attendance API
  app.get('/api/attendance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const { date, employeeId } = req.query;
      const attendance = await storage.getAttendance(
        user.companyId,
        date as string,
        employeeId ? parseInt(employeeId as string) : undefined
      );
      res.json(attendance);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  app.post('/api/attendance/checkin', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertAttendanceSchema.parse(req.body);
      const attendance = await storage.checkIn(validatedData);
      res.status(201).json(attendance);
    } catch (error) {
      console.error("Error recording check-in:", error);
      res.status(500).json({ message: "Failed to record check-in" });
    }
  });

  app.put('/api/attendance/:id/checkout', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { checkOut, checkOutLocation, checkOutPhoto } = req.body;
      
      const attendance = await storage.checkOut(parseInt(id), {
        checkOut: new Date(checkOut),
        checkOutLocation,
        checkOutPhoto,
      });
      res.json(attendance);
    } catch (error) {
      console.error("Error recording check-out:", error);
      res.status(500).json({ message: "Failed to record check-out" });
    }
  });

  // Attendance Statistics API
  app.get('/api/attendance/stats', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const companyId = req.userProfile?.companyId;
      if (!companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const { date } = req.query;
      const selectedDate = date || new Date().toISOString().split('T')[0];
      
      // Get all employees for the company
      const employees = await storage.getEmployees(companyId);
      const totalEmployees = employees.length;
      
      // Get attendance records for the selected date
      const attendanceRecords = await storage.getAttendance(companyId, selectedDate);
      
      // Calculate statistics
      const presentToday = attendanceRecords.filter((record: any) => record.status === 'present' || record.checkIn).length;
      const absentToday = totalEmployees - presentToday;
      const lateToday = attendanceRecords.filter((record: any) => record.status === 'late').length;
      
      // Calculate attendance rate
      const attendanceRate = totalEmployees > 0 ? (presentToday / totalEmployees) * 100 : 0;
      
      // Calculate average working hours
      const workingHoursRecords = attendanceRecords.filter((record: any) => record.workingHours);
      const avgWorkingHours = workingHoursRecords.length > 0 
        ? workingHoursRecords.reduce((sum: number, record: any) => sum + parseFloat(record.workingHours || '0'), 0) / workingHoursRecords.length
        : 0;

      const stats = {
        totalEmployees,
        presentToday,
        absentToday,
        lateToday,
        attendanceRate,
        avgWorkingHours: Math.round(avgWorkingHours * 10) / 10
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching attendance statistics:", error);
      res.status(500).json({ message: "Failed to fetch attendance statistics" });
    }
  });

  // AI Insights for Attendance
  app.post('/api/attendance/ai-insights', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const companyId = req.userProfile?.companyId;
      if (!companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const { period } = req.body;
      
      // Get attendance data for analysis
      const attendanceRecords = await storage.getAttendance(companyId, period);
      const employees = await storage.getEmployees(companyId);
      
      // Generate AI insights using DeepSeek-like analysis
      const insights = await generateAttendanceInsights(attendanceRecords, employees, period);
      
      res.json(insights);
    } catch (error) {
      console.error("Error generating AI insights:", error);
      res.status(500).json({ message: "Failed to generate AI insights" });
    }
  });

  // Payroll Statistics API
  app.get('/api/payroll/stats', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const companyId = req.userProfile?.companyId;
      if (!companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const { period } = req.query;
      const selectedPeriod = period || format(new Date(), "yyyy-MM");
      
      // Get payroll records for the period
      const payrollRecords = await storage.getPayroll(companyId, selectedPeriod);
      
      // Calculate statistics
      const totalEmployees = await storage.getEmployees(companyId).then(emp => emp.length);
      const totalGrossSalary = payrollRecords.reduce((sum, record) => 
        sum + parseFloat(record.basicSalary) + parseFloat(record.allowances) + parseFloat(record.overtimePay), 0
      );
      const totalNetSalary = payrollRecords.reduce((sum, record) => sum + parseFloat(record.netSalary), 0);
      const totalDeductions = payrollRecords.reduce((sum, record) => sum + parseFloat(record.deductions), 0);
      const totalTax = payrollRecords.reduce((sum, record) => sum + parseFloat(record.tax), 0);
      
      const processed = payrollRecords.filter(record => record.status === 'processed' || record.status === 'approved' || record.status === 'paid').length;
      const pending = payrollRecords.filter(record => record.status === 'draft' || record.status === 'pending').length;
      const paid = payrollRecords.filter(record => record.status === 'paid').length;

      const stats = {
        totalEmployees,
        totalGrossSalary,
        totalNetSalary,
        totalDeductions,
        totalTax,
        processed,
        pending,
        paid
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching payroll statistics:", error);
      res.status(500).json({ message: "Failed to fetch payroll statistics" });
    }
  });

  // Process Payroll API
  app.post('/api/payroll/process', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const companyId = req.userProfile?.companyId;
      if (!companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const { period, employeeIds } = req.body;
      
      // Calculate payroll for specified employees or all employees
      const payrollRecords = await storage.calculatePayroll(companyId, period, employeeIds);
      
      res.json(payrollRecords);
    } catch (error) {
      console.error("Error processing payroll:", error);
      res.status(500).json({ message: "Failed to process payroll" });
    }
  });

  // Update Payroll Status API
  app.patch('/api/payroll/:id/status', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const [updatedPayroll] = await db
        .update(payroll)
        .set({ 
          status: status,
          updatedAt: new Date(),
          ...(status === 'processed' ? { processedAt: new Date() } : {})
        })
        .where(eq(payroll.id, parseInt(id)))
        .returning();
      
      res.json(updatedPayroll);
    } catch (error) {
      console.error("Error updating payroll status:", error);
      res.status(500).json({ message: "Failed to update payroll status" });
    }
  });

  // Add Overtime Hours API for Payroll
  app.patch('/api/payroll/:id/overtime', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { overtimeHours } = req.body;
      
      // Get employee data to calculate overtime rate based on their hourly rate
      const employeeData = await db
        .select()
        .from(payroll)
        .where(eq(payroll.id, parseInt(id)))
        .limit(1);
      
      if (employeeData.length === 0) {
        return res.status(404).json({ message: "Payroll record not found" });
      }
      
      // Calculate hourly rate from basic salary (assuming 8 hours/day, 22 working days/month)
      const basicSalary = parseFloat(employeeData[0].basicSalary);
      const hourlyRate = basicSalary / (8 * 22); // Monthly salary to hourly rate
      const overtimeMultiplier = 1.5; // 1.5x regular hourly rate for overtime
      const hourlyOvertimeRate = hourlyRate * overtimeMultiplier;
      const overtimePay = (overtimeHours * hourlyOvertimeRate).toString();
      
      const [updatedPayroll] = await db
        .update(payroll)
        .set({ 
          overtimePay: overtimePay,
          updatedAt: new Date()
        })
        .where(eq(payroll.id, parseInt(id)))
        .returning();
      
      // Recalculate net salary
      const currentBasicSalary = parseFloat(updatedPayroll.basicSalary);
      const allowances = parseFloat(updatedPayroll.allowances as string) || 0;
      const newOvertimePay = parseFloat(overtimePay);
      const deductions = parseFloat(updatedPayroll.deductions as string) || 0;
      const grossSalary = currentBasicSalary + allowances + newOvertimePay;
      const netSalary = grossSalary - deductions;
      
      // Update with recalculated values
      const [finalPayroll] = await db
        .update(payroll)
        .set({ 
          grossSalary: grossSalary.toString(),
          netSalary: netSalary.toString()
        })
        .where(eq(payroll.id, parseInt(id)))
        .returning();
      
      res.json(finalPayroll);
    } catch (error) {
      console.error("Error updating overtime hours:", error);
      res.status(500).json({ message: "Failed to update overtime hours" });
    }
  });

  // Add Overtime Hours API for Attendance
  app.patch('/api/attendance/:id/overtime', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { overtimeHours } = req.body;
      
      const [updatedAttendance] = await db
        .update(attendance)
        .set({ 
          overtimeHours: overtimeHours.toString(),
          updatedAt: new Date()
        })
        .where(eq(attendance.id, parseInt(id)))
        .returning();
      
      res.json(updatedAttendance);
    } catch (error) {
      console.error("Error updating overtime hours:", error);
      res.status(500).json({ message: "Failed to update overtime hours" });
    }
  });

  // Generate Payslip API
  app.get('/api/payroll/:id/payslip', isAuthenticated, getUserProfile, async (req: any, res) => {
    try {
      const { id } = req.params;
      const companyId = req.userProfile?.companyId;
      
      // Get payroll record with employee details
      const payrollRecord = await db
        .select()
        .from(payroll)
        .innerJoin(employees, eq(payroll.employeeId, employees.id))
        .where(and(
          eq(payroll.id, parseInt(id)),
          eq(employees.companyId, companyId)
        ))
        .limit(1);
      
      if (payrollRecord.length === 0) {
        return res.status(404).json({ message: "Payroll record not found" });
      }
      
      const record = {
        id: payrollRecord[0].payroll.id,
        employeeId: payrollRecord[0].payroll.employeeId,
        period: payrollRecord[0].payroll.period,
        basicSalary: payrollRecord[0].payroll.basicSalary,
        allowances: payrollRecord[0].payroll.allowances,
        overtimePay: payrollRecord[0].payroll.overtimePay,
        grossSalary: payrollRecord[0].payroll.grossSalary,
        deductions: payrollRecord[0].payroll.deductions,
        netSalary: payrollRecord[0].payroll.netSalary,
        status: payrollRecord[0].payroll.status,
        employee: {
          firstName: payrollRecord[0].employees.firstName,
          lastName: payrollRecord[0].employees.lastName,
          employeeId: payrollRecord[0].employees.employeeId,
          position: payrollRecord[0].employees.position,
          department: payrollRecord[0].employees.department,
        }
      };
      
      // Generate HTML payslip
      const payslipHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Slip Gaji - ${record.employee.firstName} ${record.employee.lastName}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .company-name { font-size: 24px; font-weight: bold; }
        .slip-title { font-size: 18px; margin-top: 10px; }
        .employee-info { margin-bottom: 20px; }
        .salary-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .salary-table th, .salary-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .salary-table th { background-color: #f2f2f2; }
        .total-row { font-weight: bold; background-color: #f9f9f9; }
        .signature-section { margin-top: 40px; display: flex; justify-content: space-between; }
        .signature-box { text-align: center; width: 200px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">TalentFlow.ai</div>
        <div class="slip-title">SLIP GAJI</div>
        <div>Periode: ${record.period}</div>
    </div>
    
    <div class="employee-info">
        <table style="width: 100%;">
            <tr>
                <td><strong>Nama Karyawan:</strong></td>
                <td>${record.employee.firstName} ${record.employee.lastName}</td>
                <td><strong>ID Karyawan:</strong></td>
                <td>${record.employee.employeeId}</td>
            </tr>
            <tr>
                <td><strong>Jabatan:</strong></td>
                <td>${record.employee.position}</td>
                <td><strong>Departemen:</strong></td>
                <td>${record.employee.department || 'N/A'}</td>
            </tr>
        </table>
    </div>
    
    <table class="salary-table">
        <thead>
            <tr>
                <th>Keterangan</th>
                <th style="text-align: right;">Jumlah (Rp)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Gaji Pokok</td>
                <td style="text-align: right;">${formatCurrency(record.basicSalary)}</td>
            </tr>
            ${Object.entries(record.allowances as any || {}).map(([key, value]) => 
              `<tr><td>Tunjangan ${key}</td><td style="text-align: right;">${formatCurrency(value)}</td></tr>`
            ).join('')}
            <tr>
                <td>Uang Lembur</td>
                <td style="text-align: right;">${formatCurrency(record.overtimePay)}</td>
            </tr>
            <tr class="total-row">
                <td><strong>Total Kotor</strong></td>
                <td style="text-align: right;"><strong>${formatCurrency(record.grossSalary)}</strong></td>
            </tr>
            <tr>
                <td colspan="2"><strong>POTONGAN:</strong></td>
            </tr>
            <tr><td>BPJS Kesehatan</td><td style="text-align: right;">${formatCurrency((record.deductions as any)?.bpjsHealth || 0)}</td></tr>
            <tr><td>BPJS Ketenagakerjaan</td><td style="text-align: right;">${formatCurrency((record.deductions as any)?.bpjsEmployment || 0)}</td></tr>
            <tr><td>PPh21</td><td style="text-align: right;">${formatCurrency((record.deductions as any)?.tax || 0)}</td></tr>
            <tr class="total-row">
                <td><strong>Total Potongan</strong></td>
                <td style="text-align: right;"><strong>${formatCurrency((record.deductions as any)?.total || 0)}</strong></td>
            </tr>
            <tr class="total-row" style="background-color: #e8f5e8;">
                <td><strong>GAJI BERSIH</strong></td>
                <td style="text-align: right;"><strong>${formatCurrency(record.netSalary)}</strong></td>
            </tr>
        </tbody>
    </table>
    
    <div class="signature-section">
        <div class="signature-box">
            <p>Karyawan</p>
            <br><br><br>
            <p>_________________</p>
            <p>${record.employee.firstName} ${record.employee.lastName}</p>
        </div>
        <div class="signature-box">
            <p>HRD</p>
            <br><br><br>
            <p>_________________</p>
            <p>Dept. HRD</p>
        </div>
    </div>
</body>
</html>`;
      
      res.setHeader('Content-Type', 'text/html');
      res.send(payslipHtml);
    } catch (error) {
      console.error("Error generating payslip:", error);
      res.status(500).json({ message: "Failed to generate payslip" });
    }
  });

  // AI Insights for Payroll
  app.post('/api/payroll/ai-insights', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const companyId = req.userProfile?.companyId;
      if (!companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const { period } = req.body;
      
      // Get payroll data for analysis
      const payrollRecords = await storage.getPayroll(companyId, period);
      const employees = await storage.getEmployees(companyId);
      
      // Generate AI insights using DeepSeek-like analysis
      const insights = await generatePayrollInsights(payrollRecords, employees, period);
      
      res.json(insights);
    } catch (error) {
      console.error("Error generating payroll AI insights:", error);
      res.status(500).json({ message: "Failed to generate payroll AI insights" });
    }
  });

  // Leave Management API
  app.get('/api/leaves', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const leaves = await storage.getLeaveRequests(user.companyId);
      res.json(leaves);
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      res.status(500).json({ message: "Failed to fetch leave requests" });
    }
  });

  app.post('/api/leaves', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertLeaveRequestSchema.parse(req.body);
      const leave = await storage.createLeaveRequest(validatedData);
      res.status(201).json(leave);
    } catch (error) {
      console.error("Error creating leave request:", error);
      res.status(500).json({ message: "Failed to create leave request" });
    }
  });

  app.put('/api/leaves/:id/approve', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      const leave = await storage.approveLeaveRequest(parseInt(id), userId);
      res.json(leave);
    } catch (error) {
      console.error("Error approving leave request:", error);
      res.status(500).json({ message: "Failed to approve leave request" });
    }
  });

  app.put('/api/leaves/:id/reject', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { rejectionReason } = req.body;
      const userId = req.user.claims.sub;
      
      const leave = await storage.rejectLeaveRequest(parseInt(id), userId, rejectionReason);
      res.json(leave);
    } catch (error) {
      console.error("Error rejecting leave request:", error);
      res.status(500).json({ message: "Failed to reject leave request" });
    }
  });

  // Payroll API
  app.get('/api/payroll', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const { period } = req.query;
      const payroll = await storage.getPayroll(user.companyId, period as string);
      res.json(payroll);
    } catch (error) {
      console.error("Error fetching payroll:", error);
      res.status(500).json({ message: "Failed to fetch payroll" });
    }
  });

  app.post('/api/payroll/calculate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const { period, employeeId } = req.body;
      const payroll = await storage.calculatePayroll(user.companyId, period, employeeId);
      res.json(payroll);
    } catch (error) {
      console.error("Error calculating payroll:", error);
      res.status(500).json({ message: "Failed to calculate payroll" });
    }
  });

  app.post('/api/payroll/:id/generate-slip', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const slipPath = await storage.generatePayslip(parseInt(id));
      res.json({ slipPath });
    } catch (error) {
      console.error("Error generating payslip:", error);
      res.status(500).json({ message: "Failed to generate payslip" });
    }
  });

  // Document Management API
  app.get('/api/documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const documents = await storage.getDocuments(user.companyId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post('/api/documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const validatedData = insertDocumentSchema.parse({
        ...req.body,
        companyId: user.companyId,
        createdBy: userId,
      });
      
      const document = await storage.createDocument(validatedData);
      res.status(201).json(document);
    } catch (error) {
      console.error("Error creating document:", error);
      res.status(500).json({ message: "Failed to create document" });
    }
  });

  app.patch('/api/documents/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { signed } = req.body;
      const userId = req.user.claims.sub;
      
      const document = await storage.updateDocumentStatus(parseInt(id), signed, userId);
      res.json(document);
    } catch (error) {
      console.error("Error updating document status:", error);
      res.status(500).json({ message: "Failed to update document status" });
    }
  });

  // Reimbursement API
  app.get('/api/reimbursements', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const reimbursements = await storage.getReimbursements(user.companyId);
      res.json(reimbursements);
    } catch (error) {
      console.error("Error fetching reimbursements:", error);
      res.status(500).json({ message: "Failed to fetch reimbursements" });
    }
  });

  app.post('/api/reimbursements', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertReimbursementSchema.parse(req.body);
      const reimbursement = await storage.createReimbursement(validatedData);
      res.status(201).json(reimbursement);
    } catch (error) {
      console.error("Error creating reimbursement:", error);
      res.status(500).json({ message: "Failed to create reimbursement" });
    }
  });

  app.patch('/api/reimbursements/:id/approve', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      const reimbursement = await storage.approveReimbursement(parseInt(id), userId);
      res.json(reimbursement);
    } catch (error) {
      console.error("Error approving reimbursement:", error);
      res.status(500).json({ message: "Failed to approve reimbursement" });
    }
  });

  app.patch('/api/reimbursements/:id/reject', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.user.claims.sub;
      
      const reimbursement = await storage.rejectReimbursement(parseInt(id), userId, reason || "Tidak sesuai kebijakan");
      res.json(reimbursement);
    } catch (error) {
      console.error("Error rejecting reimbursement:", error);
      res.status(500).json({ message: "Failed to reject reimbursement" });
    }
  });

  // Performance API
  app.get('/api/performance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const performance = await storage.getPerformanceReviews(user.companyId);
      res.json(performance);
    } catch (error) {
      console.error("Error fetching performance reviews:", error);
      res.status(500).json({ message: "Failed to fetch performance reviews" });
    }
  });

  app.post('/api/performance', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertPerformanceReviewSchema.parse(req.body);
      const performance = await storage.createPerformanceReview(validatedData);
      res.status(201).json(performance);
    } catch (error) {
      console.error("Error creating performance review:", error);
      res.status(500).json({ message: "Failed to create performance review" });
    }
  });

  app.put('/api/performance/:id', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertPerformanceReviewSchema.partial().parse(req.body);
      const performance = await storage.updatePerformanceReview(parseInt(id), validatedData);
      res.json(performance);
    } catch (error) {
      console.error("Error updating performance review:", error);
      res.status(500).json({ message: "Failed to update performance review" });
    }
  });

  // Recruitment API
  app.get('/api/jobs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const jobs = await storage.getJobs(user.companyId);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  app.post('/api/jobs', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const validatedData = insertJobSchema.parse({
        ...req.body,
        companyId: user.companyId,
        createdBy: userId,
      });
      
      const job = await storage.createJob(validatedData);
      res.status(201).json(job);
    } catch (error) {
      console.error("Error creating job:", error);
      res.status(500).json({ message: "Failed to create job" });
    }
  });

  // Update job
  app.put('/api/jobs/:id', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      // Verify job belongs to company
      const existingJob = await db
        .select()
        .from(jobs)
        .where(and(eq(jobs.id, parseInt(id)), eq(jobs.companyId, user.companyId)))
        .limit(1);

      if (existingJob.length === 0) {
        return res.status(404).json({ message: "Job not found" });
      }

      const updateData = {
        ...req.body,
        updatedAt: new Date()
      };

      const [updatedJob] = await db
        .update(jobs)
        .set(updateData)
        .where(eq(jobs.id, parseInt(id)))
        .returning();

      res.json(updatedJob);
    } catch (error) {
      console.error("Error updating job:", error);
      res.status(500).json({ message: "Failed to update job" });
    }
  });

  // Delete job
  app.delete('/api/jobs/:id', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      // Verify job belongs to company
      const existingJob = await db
        .select()
        .from(jobs)
        .where(and(eq(jobs.id, parseInt(id)), eq(jobs.companyId, user.companyId)))
        .limit(1);

      if (existingJob.length === 0) {
        return res.status(404).json({ message: "Job not found" });
      }

      await db.delete(jobs).where(eq(jobs.id, parseInt(id)));
      res.json({ message: "Job deleted successfully" });
    } catch (error) {
      console.error("Error deleting job:", error);
      res.status(500).json({ message: "Failed to delete job" });
    }
  });

  // Post job to external platforms
  app.post('/api/jobs/:id/post-external', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { platforms } = req.body; // array of platform names like ['jobstreet', 'indeed', 'linkedin']
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      // Get job details
      const job = await db
        .select()
        .from(jobs)
        .where(and(eq(jobs.id, parseInt(id)), eq(jobs.companyId, user.companyId)))
        .limit(1);

      if (job.length === 0) {
        return res.status(404).json({ message: "Job not found" });
      }

      const jobData = job[0];
      const results = [];

      // Simulate posting to external platforms
      for (const platform of platforms) {
        try {
          // Here you would integrate with actual APIs like:
          // - JobStreet API
          // - Indeed API  
          // - LinkedIn Jobs API
          // - Glints API
          // - Karir.com API
          
          const postResult = await postToExternalPlatform(platform, jobData);
          results.push({
            platform,
            status: 'success',
            externalId: postResult.externalId,
            url: postResult.url
          });
        } catch (error) {
          results.push({
            platform,
            status: 'error',
            error: error.message
          });
        }
      }

      res.json({
        jobId: parseInt(id),
        results
      });
    } catch (error) {
      console.error("Error posting job to external platforms:", error);
      res.status(500).json({ message: "Failed to post job to external platforms" });
    }
  });

  app.get('/api/job-applications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const applications = await storage.getJobApplications(user.companyId);
      res.json(applications);
    } catch (error) {
      console.error("Error fetching job applications:", error);
      res.status(500).json({ message: "Failed to fetch job applications" });
    }
  });

  app.post('/api/job-applications', async (req, res) => {
    try {
      const validatedData = insertJobApplicationSchema.parse(req.body);
      const application = await storage.createJobApplication(validatedData);
      res.status(201).json(application);
    } catch (error) {
      console.error("Error creating job application:", error);
      res.status(500).json({ message: "Failed to create job application" });
    }
  });

  // Update job application status
  app.patch('/api/job-applications/:id/status', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { stage, notes, interviewDate, offerAmount } = req.body;

      const updateData: any = { stage, updatedAt: new Date() };
      if (notes) updateData.notes = notes;
      if (interviewDate) updateData.interviewDate = new Date(interviewDate);
      if (offerAmount) updateData.offerAmount = offerAmount.toString();
      if (stage === 'hired') updateData.hiredDate = new Date();

      const [updatedApplication] = await db
        .update(jobApplications)
        .set(updateData)
        .where(eq(jobApplications.id, parseInt(id)))
        .returning();

      if (!updatedApplication) {
        return res.status(404).json({ message: "Application not found" });
      }

      res.json(updatedApplication);
    } catch (error) {
      console.error("Error updating application status:", error);
      res.status(500).json({ message: "Failed to update application status" });
    }
  });

  // Update job status
  app.patch('/api/jobs/:id/status', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const [updatedJob] = await db
        .update(jobs)
        .set({ status, updatedAt: new Date() })
        .where(eq(jobs.id, parseInt(id)))
        .returning();

      if (!updatedJob) {
        return res.status(404).json({ message: "Job not found" });
      }

      res.json(updatedJob);
    } catch (error) {
      console.error("Error updating job status:", error);
      res.status(500).json({ message: "Failed to update job status" });
    }
  });

  // AI Integration API
  app.post('/api/ai/generate-insights', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const insights = await storage.generateAIInsights(user.companyId);
      res.json(insights);
    } catch (error) {
      console.error("Error generating AI insights:", error);
      res.status(500).json({ message: "Failed to generate AI insights" });
    }
  });

  // Salary Components API
  app.get('/api/salary-components', isAuthenticated, getUserProfile, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const components = await storage.getSalaryComponents(user.companyId);
      res.json(components);
    } catch (error) {
      console.error("Error fetching salary components:", error);
      res.status(500).json({ message: "Failed to fetch salary components" });
    }
  });

  app.post('/api/salary-components', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      console.log("Received salary component data:", req.body);
      const validatedData = insertSalaryComponentSchema.parse({
        ...req.body,
        companyId: user.companyId,
      });
      console.log("Validated data:", validatedData);
      
      const component = await storage.createSalaryComponent(validatedData);
      res.status(201).json(component);
    } catch (error) {
      console.error("Error creating salary component:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
      }
      res.status(500).json({ message: "Failed to create salary component", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put('/api/salary-components/:id', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertSalaryComponentSchema.partial().parse(req.body);
      const component = await storage.updateSalaryComponent(parseInt(id), validatedData);
      res.json(component);
    } catch (error) {
      console.error("Error updating salary component:", error);
      res.status(500).json({ message: "Failed to update salary component" });
    }
  });

  app.delete('/api/salary-components/:id', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteSalaryComponent(parseInt(id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting salary component:", error);
      res.status(500).json({ message: "Failed to delete salary component" });
    }
  });

  // Employee Salary Components API
  app.get('/api/employee-salary-components/:employeeId', isAuthenticated, getUserProfile, async (req: any, res) => {
    try {
      const { employeeId } = req.params;
      const components = await storage.getEmployeeSalaryComponents(parseInt(employeeId));
      res.json(components);
    } catch (error) {
      console.error("Error fetching employee salary components:", error);
      res.status(500).json({ message: "Failed to fetch employee salary components" });
    }
  });

  app.post('/api/employee-salary-components', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      console.log("Received employee salary component data:", req.body);
      const validatedData = insertEmployeeSalaryComponentSchema.parse(req.body);
      console.log("Validated data:", validatedData);
      const component = await storage.setEmployeeSalaryComponent(validatedData);
      res.status(201).json(component);
    } catch (error) {
      console.error("Error creating employee salary component:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
      }
      res.status(500).json({ message: "Failed to create employee salary component", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put('/api/employee-salary-components/:id', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertEmployeeSalaryComponentSchema.partial().parse(req.body);
      const component = await storage.updateEmployeeSalaryComponent(parseInt(id), validatedData);
      res.json(component);
    } catch (error) {
      console.error("Error updating employee salary component:", error);
      res.status(500).json({ message: "Failed to update employee salary component" });
    }
  });

  app.delete('/api/employee-salary-components/:id', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteEmployeeSalaryComponent(parseInt(id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting employee salary component:", error);
      res.status(500).json({ message: "Failed to delete employee salary component" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
